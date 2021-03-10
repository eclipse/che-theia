/**********************************************************************
 * Copyright (c) 2018-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { CheAuthority, CheAuthorityMain, PLUGIN_RPC_CONTEXT } from '../common/che-protocol';

import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';

export class CheAuthorityImpl implements CheAuthority {
  private readonly authorityMain: CheAuthorityMain;

  constructor(rpc: RPCProtocol) {
    this.authorityMain = rpc.getProxy(PLUGIN_RPC_CONTEXT.CHE_AUTHORITY_MAIN);
  }

  async getCertificates(): Promise<Buffer[] | undefined> {
    return this.authorityMain.$getCertificates();
  }
}
