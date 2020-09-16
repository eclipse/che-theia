/*********************************************************************
 * Copyright (c) 2019 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { HostedPluginProcess } from '@theia/plugin-ext/lib/hosted/node/hosted-plugin-process';
import { LogType } from '@theia/plugin-ext/lib/common/types';

/**
 * Redirect extension host log to client
 */
export class LogHostedPluginProcess extends HostedPluginProcess {

    protected onStdOutData(serverName: string, pid: number, data: string | Buffer): void {
        super.onStdOutData(serverName, pid, data);
        this.client.log({ data: `Extension-Host:${data.toString().trim()}`, type: LogType.Info });
    }

    protected onStdErrData(serverName: string, pid: number, data: string | Buffer): void {
        super.onStdErrData(serverName, pid, data);
        this.client.log({ data: `Extension-Host:${data.toString().trim()}`, type: LogType.Error });
    }
}
