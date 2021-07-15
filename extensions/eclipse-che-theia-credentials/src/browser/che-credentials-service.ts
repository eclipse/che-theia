/**********************************************************************
 * Copyright (c) 2019-2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { CredentialsChangeEvent, CredentialsService } from '@theia/core/lib/browser/credentials-service';
import { Emitter, Event } from '@theia/core';
import { inject, injectable } from 'inversify';

import { CredentialsServer } from '../common/credentials-protocol';

@injectable()
export class CheCredentialsService implements CredentialsService {
  @inject(CredentialsServer)
  private readonly credentialsServer: CredentialsServer;

  private readonly onDidChangePasswordEmitter = new Emitter<CredentialsChangeEvent>();
  readonly onDidChangePassword: Event<CredentialsChangeEvent> = this.onDidChangePasswordEmitter.event;

  async deletePassword(service: string, account: string): Promise<boolean> {
    const result = await this.credentialsServer.deletePassword(this.getExtensionId(service), account);
    if (result) {
      this.onDidChangePasswordEmitter.fire({ service, account });
    }
    return result;
  }

  findCredentials(service: string): Promise<Array<{ account: string; password: string }>> {
    return this.credentialsServer.findCredentials(this.getExtensionId(service));
  }

  findPassword(service: string): Promise<string | undefined> {
    return this.credentialsServer.findPassword(this.getExtensionId(service));
  }

  async getPassword(service: string, account: string): Promise<string | undefined> {
    const passwordContent = await this.credentialsServer.getPassword(this.getExtensionId(service), account);
    if (passwordContent) {
      return JSON.stringify(passwordContent);
    }
  }

  async setPassword(service: string, account: string, password: string): Promise<void> {
    await this.credentialsServer.setPassword(this.getExtensionId(service), account, JSON.parse(password));
    this.onDidChangePasswordEmitter.fire({ service, account });
  }

  private getExtensionId(service: string): string {
    return service.replace(window.location.hostname + '-', '');
  }
}
