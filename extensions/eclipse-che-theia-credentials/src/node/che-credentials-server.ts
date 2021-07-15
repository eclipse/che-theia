/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as k8s from '@kubernetes/client-node';

import { CredentialsServer, PasswordContent } from '../common/credentials-protocol';
import { inject, injectable } from 'inversify';

import { CheK8SServiceImpl } from '@eclipse-che/theia-remote-impl-che-server/lib/node/che-server-k8s-service-impl';
import { CheServerWorkspaceServiceImpl } from '@eclipse-che/theia-remote-impl-che-server/lib/node/che-server-workspace-service-impl';

@injectable()
export class CheCredentialsServer implements CredentialsServer {
  @inject(CheK8SServiceImpl)
  private readonly cheK8SService: CheK8SServiceImpl;

  @inject(CheServerWorkspaceServiceImpl)
  private readonly workspaceService: CheServerWorkspaceServiceImpl;

  private INFRASTRUCTURE_NAMESPACE = 'infrastructureNamespace';

  async deletePassword(service: string, account: string): Promise<boolean> {
    try {
      await this.cheK8SService
        .makeApiClient(k8s.CoreV1Api)
        .deleteNamespacedSecret(this.getSecretName(service), await this.getWorkspaceNamespace());
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async findCredentials(service: string): Promise<Array<{ account: string; password: string }>> {
    const secrets = await this.listNamespacedSecrets();
    return secrets
      .filter(secret => secret.metadata && secret.metadata.name && secret.metadata.name === this.getSecretName(service))
      .map(secret => ({
        account: secret.metadata!.name!.substring(service.length + 1),
        password: secret.data!.password,
      }));
  }

  async findPassword(service: string): Promise<string | undefined> {
    const secrets = await this.listNamespacedSecrets();
    const item = secrets.find(
      secret => secret.metadata && secret.metadata.name && secret.metadata.name === this.getSecretName(service)
    );
    if (item) {
      return item.data!.password;
    }
  }

  async getPassword(service: string, account: string): Promise<PasswordContent | undefined> {
    const secrets = await this.listNamespacedSecrets();
    const item = secrets.find(
      secret => secret.metadata && secret.metadata.name && secret.metadata.name === this.getSecretName(service)
    );
    if (item) {
      return { extensionId: service, content: Buffer.from(item.data![account], 'base64').toString('ascii') };
    }
  }

  async setPassword(service: string, account: string, password: PasswordContent): Promise<void> {
    const secret: k8s.V1Secret = {
      metadata: { name: this.getSecretName(service) },
      data: { [account]: Buffer.from(password.content).toString('base64') },
    };
    await this.cheK8SService
      .makeApiClient(k8s.CoreV1Api)
      .createNamespacedSecret(await this.getWorkspaceNamespace(), secret);
  }

  private getSecretName(service: string): string {
    return service.substring(service.indexOf('/') + 1) + '-credentials';
  }

  private async listNamespacedSecrets(): Promise<k8s.V1Secret[]> {
    const secrets = await this.cheK8SService
      .makeApiClient(k8s.CoreV1Api)
      .listNamespacedSecret(await this.getWorkspaceNamespace());
    return secrets.body.items;
  }

  private async getWorkspaceNamespace(): Promise<string> {
    // grab current workspace
    const workspace = await this.workspaceService.currentWorkspace();
    return workspace.attributes?.[this.INFRASTRUCTURE_NAMESPACE] || workspace.namespace || '';
  }
}
