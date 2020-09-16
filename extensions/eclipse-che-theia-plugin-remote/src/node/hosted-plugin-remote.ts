/*********************************************************************
 * Copyright (c) 2018-2019 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core/lib/common';
import { HostedPluginClient, DeployedPlugin, getPluginId } from '@theia/plugin-ext';
import { HostedPluginMapping } from './plugin-remote-mapping';
import { Websocket } from './websocket';
import { PluginDiscovery } from './plugin-discovery';
import { InternalMessagePayload, InternalMessage } from './internal-messages';

type PromiseResolver = (value?: Buffer) => void;

/**
 * Class handling remote connection for executing plug-ins.
 * @author Florent Benoit
 */
@injectable()
export class HostedPluginRemote {
    private static readonly STOP_MESSAGE: InternalMessage = {
        internal: {
            method: 'stop'
        }
    };

    private client: HostedPluginClient | undefined;

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(HostedPluginMapping)
    protected hostedPluginMapping: HostedPluginMapping;

    /**
     * Mapping between endpoint name and the websockets
     */
    private endpointsSockets = new Map<string, Websocket>();

    /**
     * Mapping between plugin host ids and the deployed plugins
     */
    private deployedPlugins: Map<string, DeployedPlugin[]> = new Map<string, DeployedPlugin[]>();

    /**
     * Mapping between plugin id's and plugin hosts. Note that in our system, a plugin
     * could run on multiple hosts, but for purposed of looking up resources, we don't care.
     */
    private hostForPlugin: Map<string, string> = new Map();

    /**
     * Mapping between resource request id (pluginId_resourcePath) and resource query callback.
     */
    private resourceRequests: Map<string, PromiseResolver> = new Map<string, PromiseResolver>();

    private nextPluginHostId = 0;

    public clientClosed(): void {

        Array.from(this.endpointsSockets.values()).forEach(websocket => {
            websocket.send(JSON.stringify(HostedPluginRemote.STOP_MESSAGE));
            websocket.close();
        });
    }

    /**
     * Called when a client is connecting to this endpoint
     */
    public setClient(client: HostedPluginClient): void {
        if (!this.client) {
            this.client = client;
            this.setupDiscovery();
            this.setupWebsocket();
        }
    }

    /**
     * Handle discovery of other endpoints on same network.
     */
    protected setupDiscovery(): void {
        const pluginDiscovery = new PluginDiscovery(this.logger);
        pluginDiscovery.onNewEndpoint = announceRequest => {
            const endpointAdress = announceRequest.websocketAddress;
            // only accept new endpoint address
            if (!this.endpointsSockets.has(endpointAdress)) {
                this.logger.info(`Adding a new remote endpoint from ${endpointAdress}`);
                this.connect(endpointAdress);
            }
        };
        pluginDiscovery.discover();
    }

    /**
     * Handle the creation of connection to remote endpoints.
     */
    setupWebsocket(): void {
        this.hostedPluginMapping.getEndPoints().forEach(endpointAdress => this.connect(endpointAdress));
    }

    connect(endpointAdress: string): void {
        const pluginHostId = 'plugin-host-' + this.nextPluginHostId++;
        this.client!.onWillStartPluginHost(pluginHostId);
        this.logger.info(`Establish websocket connection to ${endpointAdress}`);
        const websocket = new Websocket(this.logger, endpointAdress);
        this.endpointsSockets.set(endpointAdress, websocket);
        this.hostedPluginMapping.setEndpoint(pluginHostId, endpointAdress);
        websocket.onMessage = (messageRaw: string) => {
            const parsed = JSON.parse(messageRaw);
            if (parsed.internal) {
                this.handleLocalMessage(pluginHostId, parsed.internal);
                return;
            }
            this.sendToClient(pluginHostId, messageRaw);
        };

        // when websocket is opened, send the order
        websocket.onOpen = event => {
            const metadataRequest: InternalMessage = {
                internal: {
                    method: 'metadataRequest'
                }
            };
            websocket.send(JSON.stringify(metadataRequest));
        };
    }

    onDidStartPluginHost(pluginHostId: string): void {
        this.client!.onDidStartPluginHost(pluginHostId);
    }

    /**
     * Checks if the given pluginHostId has a remote endpoint
     */
    hasEndpoint(pluginHostId: string): boolean {
        return this.hostedPluginMapping.hasEndpoint(pluginHostId);
    }

    /**
     * Handle the mesage to remotely send to a ws endpoint
     * @param jsonMessage the given message
     */
    onMessage(pluginHostId: string, jsonMessage: string): void {
        // route to the appropriate plugin host

        const endpoint = this.hostedPluginMapping.getEndpoint(pluginHostId);
        if (!endpoint) {
            this.logger.error('no endpoint configured for the given plugin', pluginHostId, 'skipping message');
            return;
        }
        const websocket = this.endpointsSockets.get(endpoint);
        websocket!.send(jsonMessage);
    }

    /**
     * Handle a local message.
     * @param message the message to analyze locally and not sending back to the browser
     */
    handleLocalMessage(pluginHostId: string, jsonMessage: InternalMessagePayload): void {
        if (jsonMessage.method === 'metadataReply') {
            const deployedPlugins: DeployedPlugin[] = jsonMessage.result;
            const oldPlugins = this.deployedPlugins.get(pluginHostId);
            if (oldPlugins) {
                oldPlugins.forEach(plugin => {
                    const pluginId = getPluginId(plugin.metadata.model);
                    if (this.hostForPlugin.get(pluginId) === pluginHostId) {
                        this.hostForPlugin.delete(pluginId);
                    }
                });
            }

            this.deployedPlugins.set(pluginHostId, deployedPlugins);
            deployedPlugins.forEach(plugin => {
                this.hostForPlugin.set(getPluginId(plugin.metadata.model), pluginHostId);
            });
            this.onDidStartPluginHost(pluginHostId);
            return;
        }
        if (jsonMessage.method === 'getResourceReply') {
            const resourceBase64 = jsonMessage.data;
            const resource = resourceBase64 ? Buffer.from(resourceBase64, 'base64') : undefined;
            this.onGetResourceResponse(pluginHostId, jsonMessage.pluginId, jsonMessage.path, resource);
            return;
        }
    }

    getDeployedPlugins(pluginHostId: string, pluginIds: string[]): DeployedPlugin[] {
        return this.getAllDeployedPlugins(pluginHostId).filter(plugin => pluginIds.indexOf(plugin.metadata.model.id) >= 0);
    }

    getDeployedPluginIds(pluginHostId: string): string[] {
        return this.getAllDeployedPlugins(pluginHostId).map(plugin => plugin.metadata.model.id);
    }

    private getAllDeployedPlugins(pluginHostId: string): DeployedPlugin[] {
        const plugins = this.deployedPlugins.get(pluginHostId);
        return plugins || [];
    }

    /**
     * Send the given message back to the client
     * @param message the message to send
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendToClient(pluginHostId: string, message: any): void {
        if (this.client) {
            this.client.postMessage(pluginHostId, message);
        }

    }

    /**
     * Sends request to retreive plugin resource from its sidecar.
     * Returns undefined if plugin doesn't run in sidecar or doesn't exist.
     * @param pluginId id of the plugin for which resource should be retreived
     * @param resourcePath relative path of the requested resource based on plugin root directory
     */
    public requestPluginResource(pluginId: string, resourcePath: string): Promise<Buffer | undefined> | undefined {
        const pluginHostId = this.hostForPlugin.get(pluginId);
        if (pluginHostId && this.hasEndpoint(pluginHostId) && resourcePath) {
            return new Promise<Buffer>((resolve, reject) => {
                const endpoint = this.hostedPluginMapping.getEndpoint(pluginHostId);
                if (!endpoint) {
                    reject(new Error(`No endpoint for plugin: ${pluginHostId}`));
                }
                const targetWebsocket = this.endpointsSockets.get(endpoint!);
                if (!targetWebsocket) {
                    reject(new Error(`No websocket connection for plugin: ${pluginHostId}`));
                }

                this.resourceRequests.set(this.getResourceRequestId(pluginHostId, pluginId, resourcePath), resolve);
                const message: InternalMessage = {
                    internal: {
                        method: 'getResourceRequest',
                        pluginId: pluginId,
                        path: resourcePath
                    }
                };
                targetWebsocket!.send(JSON.stringify(message));
            });
        }
        return undefined;
    }

    /**
     * Handles all responses from all remote plugins.
     * Resolves promise from getResource method with requested data.
     */
    onGetResourceResponse(pluginHostId: string, pluginId: string, resourcePath: string, resource: Buffer | undefined): void {
        const key = this.getResourceRequestId(pluginHostId, pluginId, resourcePath);
        const resourceResponsePromiseResolver = this.resourceRequests.get(key);
        if (resourceResponsePromiseResolver) {
            // This response is being waited for
            this.resourceRequests.delete(key);
            resourceResponsePromiseResolver(resource);
        }
    }

    private getResourceRequestId(pluginHostId: string, pluginId: string, resourcePath: string): string {
        return pluginHostId + '_' + pluginId + '_' + resourcePath;
    }

}
