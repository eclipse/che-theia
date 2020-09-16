/*********************************************************************
 * Copyright (c) 2018-2019 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { injectable, inject, postConstruct } from 'inversify';
import { ILogger } from '@theia/core';

/**
 * Class handling mapping between plug-in and endpoints
 * @author Florent Benoit
 */
@injectable()
export class HostedPluginMapping {

    private static ENDPOINT_ENV_VAR_PREFIX: string = 'THEIA_PLUGIN_REMOTE_ENDPOINT_';

    @inject(ILogger)
    protected readonly logger: ILogger;

    // list of endpoints
    private endpoints: string[];

    // mapping between plugin host id and the websocket endpoint
    private pluginsEndpoints = new Map<string, string>();

    /**
     * Post construct setup. Parse ENV variables to grab endpoints.
     */
    @postConstruct()
    protected setup(): void {

        // Grab endpoints from env var
        const pluginEndpointKeys: string[] = Object.keys(process.env).filter(key => key.startsWith(HostedPluginMapping.ENDPOINT_ENV_VAR_PREFIX));
        pluginEndpointKeys.forEach(key => {
            this.pluginsEndpoints.set(key.substring(HostedPluginMapping.ENDPOINT_ENV_VAR_PREFIX.length), process.env[key] || '');
        });
        this.endpoints = pluginEndpointKeys.map(key => process.env[key] || '');
        if (this.endpoints.length > 0) {
            this.logger.info('Plugins Endpoints are ', this.endpoints);
        }
        if (this.pluginsEndpoints.size > 0) {
            this.logger.info('Plugins Mapping Endpoints are ', this.pluginsEndpoints);
        }
    }

    /**
     * Checks if the given pluginHostId has a remote endpoint
     */
    hasEndpoint(pluginHostId: string): boolean {
        return this.pluginsEndpoints.has(pluginHostId);
    }

    setEndpoint(pluginHostId: string, websocketEndpoint: string): void {
        this.pluginsEndpoints.set(pluginHostId, websocketEndpoint);
    }

    /**
     * Gets endpoint for given id
     * @param pluginHostId for plugin host id
     */
    getEndpoint(pluginHostId: string): string | undefined {
        return this.pluginsEndpoints.get(pluginHostId);
    }

    /**
     * Gets the endpoints
     */
    getEndPoints(): string[] {
        return this.endpoints;
    }
}
