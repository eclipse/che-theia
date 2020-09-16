/*********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { DisposableCollection } from '@theia/core';
import { injectable } from 'inversify';
import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';
import { MAIN_REMOTE_RPC_CONTEXT } from '../common/plugin-remote-rpc';
import { PluginRemoteBrowserImpl } from '../node/plugin-remote-browser-impl';
import { DeployedPlugin } from '@theia/plugin-ext/lib/common';

/**
 * Extends Theia hosted plugin to notify all sidecar hosts the list of other plug-ins that can be found in other places.
 */
@injectable()
export class BrowserRemoteHostedPluginSupport extends HostedPluginSupport {

    private rpcs: Map<string, RPCProtocol>;
    private pluginRemoteBrowser: PluginRemoteBrowserImpl;
    private remotePlugins: Map<string, Set<string>>;

    constructor() {
        super();
        this.rpcs = new Map<string, RPCProtocol>();
        this.pluginRemoteBrowser = new PluginRemoteBrowserImpl(this.rpcs);
        this.remotePlugins = new Map();
    }

    protected async initializePluginHost(pluginHostId: string, rpc: RPCProtocol): Promise<void> {
        await super.initializePluginHost(pluginHostId, rpc);
        const pluginRemoteExt = rpc.getProxy(MAIN_REMOTE_RPC_CONTEXT.PLUGIN_REMOTE_NODE);
        // get all plugins that are not for a given host
        const externalPlugins: DeployedPlugin[] = [];
        const newPluginIds: Set<string> = this.deployedPlugins.get(pluginHostId)!;

        const initializedPlugins: Promise<void>[] = [];

        Array.from(this.deployedPlugins.keys()).forEach(pluginHost => {
            const deployedOnHost: Set<string> = this.deployedPlugins.get(pluginHost)!;
            if (pluginHostId !== pluginHost) {
                deployedOnHost.forEach(id => {
                    externalPlugins.push(this.contributions.get(id)!.plugin);
                });
            } else {
                const remotePlugins: Set<string> = this.remotePlugins.get(pluginHost)!;
                newPluginIds.forEach(id => remotePlugins.add(id));
                const currentPlugins: DeployedPlugin[] = [];
                remotePlugins.forEach(id => currentPlugins.push(this.contributions.get(id)!.plugin));
                initializedPlugins.push(pluginRemoteExt.$initExternalPlugins(currentPlugins));
            }
        });
        const initPromise = pluginRemoteExt.$initExternalPlugins(externalPlugins);
        initializedPlugins.push(initPromise);
        return Promise.all(initializedPlugins).then();
    }
    /**
     * Send all hosts the plugins that are available
     */
    protected initRpc(rpc: RPCProtocol): void {
        super.initRpc(rpc);
        rpc.set(MAIN_REMOTE_RPC_CONTEXT.PLUGIN_REMOTE_BROWSER, this.pluginRemoteBrowser);
    }

    protected async startPlugins(pluginHostId: string, toDisconnect: DisposableCollection): Promise<void> {
        const pluginsForHost = this.deployedPlugins.get(pluginHostId);
        if (pluginsForHost) {
            pluginsForHost.forEach(pluginId => {
                this.pluginRemoteBrowser.addMapping(pluginId, pluginHostId);
            });
        }
        return super.startPlugins(pluginHostId, toDisconnect);
    }
}
