/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

export const CREDENTIALS_SERVICE_PATH = '/services/credentials';
export const CredentialsServer = Symbol('CredentialsServer');

export interface PasswordContent {
  extensionId: string;
  content: string;
}

export interface CredentialsServer {
  setPassword(service: string, account: string, passwordData: PasswordContent): Promise<void>;
  getPassword(service: string, account: string): Promise<PasswordContent | undefined>;
  deletePassword(service: string, account: string): Promise<boolean>;
  findPassword(service: string): Promise<string | undefined>;
  findCredentials(service: string): Promise<Array<{ account: string; password: string }>>;
}
