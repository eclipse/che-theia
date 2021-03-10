/**********************************************************************
 * Copyright (c) 2018-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { CheAuthorityMain, CheAuthorityService } from '../common/che-protocol';

import { interfaces } from 'inversify';

export class CheAuthorityMainImpl implements CheAuthorityMain {
  private readonly cheAuthorityService: CheAuthorityService;

  constructor(container: interfaces.Container) {
    this.cheAuthorityService = container.get<CheAuthorityService>(CheAuthorityService);
  }

  async $getCertificates(): Promise<Buffer[] | undefined> {
    return await this.cheAuthorityService.getCertificates();
  }
}
