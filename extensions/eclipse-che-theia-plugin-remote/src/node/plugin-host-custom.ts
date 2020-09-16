/*********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

/**
 * Copy of the upstream plugin-remote-init except that we add remote stuff
 * const pluginRemoteBrowser = rpc.getProxy(MAIN_REMOTE_RPC_CONTEXT.PLUGIN_REMOTE_BROWSER);
 * const pluginRemoteNodeImpl = new PluginRemoteNodeImpl(pluginRemoteBrowser);
 * rpc.set(MAIN_REMOTE_RPC_CONTEXT.PLUGIN_REMOTE_NODE, pluginRemoteNodeImplt);
 *
 * and
 *
 * pluginRemoteNodeImpl.setPluginManager(pluginManager);
 */
import { Emitter } from '@theia/core/lib/common/event';
import { RPCProtocolImpl } from '@theia/plugin-ext/lib/common/rpc-protocol';
import { PluginHostRPC } from '@theia/plugin-ext/lib/hosted/node/plugin-host-rpc';
import { PluginRemoteNodeImpl } from './plugin-remote-node-impl';
import { MAIN_REMOTE_RPC_CONTEXT } from '../common/plugin-remote-rpc';
console.log('PLUGIN_HOST_CHE_THEIA(' + process.pid + ') starting instance');

// override exit() function, to do not allow plugin kill this node
process.exit = function (code?: number): void {
    const err = new Error('An plugin call process.exit() and it was prevented.');
    console.warn(err.stack);
} as (code?: number) => never;

// same for 'crash'(works only in electron)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proc = process as any;
if (proc.crash) {
    proc.crash = function (): void {
        const err = new Error('An plugin call process.crash() and it was prevented.');
        console.warn(err.stack);
    };
}

process.on('uncaughtException', (err: Error) => {
    console.error(err);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unhandledPromises: Promise<any>[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    unhandledPromises.push(promise);
    setTimeout(() => {
        const index = unhandledPromises.indexOf(promise);
        if (index >= 0) {
            promise.catch(err => {
                unhandledPromises.splice(index, 1);
                console.error(`Promise rejection not handled in one second: ${err} , reason: ${reason}`);
                if (err && err.stack) {
                    console.error(`With stack trace: ${err.stack}`);
                }
            });
        }
    }, 1000);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('rejectionHandled', (promise: Promise<any>) => {
    const index = unhandledPromises.indexOf(promise);
    if (index >= 0) {
        unhandledPromises.splice(index, 1);
    }
});

const emitter = new Emitter<string>();
const rpc = new RPCProtocolImpl({
    onMessage: emitter.event,
    send: (m: string) => {
        if (process.send) {
            process.send(m);
        }
    }
});

process.on('message', (message: string) => {
    try {
        emitter.fire(message);
    } catch (e) {
        console.error(e);
    }
});

const pluginHostRPC = new PluginHostRPC(rpc);
const pluginRemoteBrowser = rpc.getProxy(MAIN_REMOTE_RPC_CONTEXT.PLUGIN_REMOTE_BROWSER);
const pluginRemoteNodeImpl = new PluginRemoteNodeImpl(pluginRemoteBrowser);
rpc.set(MAIN_REMOTE_RPC_CONTEXT.PLUGIN_REMOTE_NODE, pluginRemoteNodeImpl);

pluginHostRPC.initialize();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pluginManager = (pluginHostRPC as any).pluginManager;
pluginRemoteNodeImpl.setPluginManager(pluginManager);
