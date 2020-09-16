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
import { HostedPluginClient, ServerPluginRunner } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { HostedPluginRemote } from './hosted-plugin-remote';
import { DeployedPlugin } from '@theia/plugin-ext';

/**
 * Proxy runner being a facade for loading plugins locally or remotely
 */
@injectable()
export class ServerPluginProxyRunner implements ServerPluginRunner {

    @inject(HostedPluginRemote)
    protected readonly hostedPluginRemote: HostedPluginRemote;

    public setClient(client: HostedPluginClient): void {
        this.hostedPluginRemote.setClient(client);
    }

    public clientClosed(): void {
        this.hostedPluginRemote.clientClosed();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acceptMessage(pluginHostId: string): boolean {
        return this.hostedPluginRemote.hasEndpoint(pluginHostId);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public onMessage(pluginHostId: string, jsonMessage: string): void {
        this.hostedPluginRemote.onMessage(pluginHostId, jsonMessage);
    }

    /**
     * Provides additional deployed plugins.
     */
    public getDeployedPlugins(pluginHostId: string, pluginIds: string[]): Promise<DeployedPlugin[]> {
        return Promise.resolve(this.hostedPluginRemote.getDeployedPlugins(pluginHostId, pluginIds));
    }

    /**
     * Provides additional plugin ids.
     */
    public getDeployedPluginIds(pluginHostId: string): Promise<string[]> {
        return Promise.resolve(this.hostedPluginRemote.getDeployedPluginIds(pluginHostId));
    }

}
