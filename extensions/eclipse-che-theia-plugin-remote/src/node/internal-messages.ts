/*********************************************************************
 * Copyright (c) 2018-2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import { DeployedPlugin } from '@theia/plugin-ext';

/*
 * This file documents the protocol between plugins hosts and the
 * Theia back-end. Anything not part of this protocol will be tunnelled
 * through the back-end from front-end to plugin host
 */

export interface InternalMessage {
    internal: InternalMessagePayload
}

/**
 * Request the content of the file with a given path. The path
 * is releative to the installation folder of the plugin with the given id.
 */
export interface GetResourceRequest {
    method: 'getResourceRequest',
    pluginId: string,
    path: string
}

export interface GetResourceReply {
    method: 'getResourceReply',
    pluginId: string,
    path: string,
    data: string | undefined
}

/**
 * Request the plugin host instance to stop.
 */
export interface StopRequest {
    method: 'stop'
}

/**
 * Request info about the plugins the plugin host has installed.
 * This will be the first request sent to a plugin host upon connection.
 * Once the host replies, it is considered to be ready for serving requests.
 */
export interface MetadataRequest {
    method: 'metadataRequest'
}

export interface MetadataReply {
    method: 'metadataReply',
    result: DeployedPlugin[]
}

export type InternalRequest = GetResourceRequest | MetadataRequest | StopRequest;
export type InternalReply = GetResourceReply | MetadataReply;
export type InternalMessagePayload = InternalRequest | InternalReply;
