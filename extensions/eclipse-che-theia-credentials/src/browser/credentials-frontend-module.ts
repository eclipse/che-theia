/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { CREDENTIALS_SERVICE_PATH, CredentialsServer } from '../common/credentials-protocol';

import { CheCredentialsService } from './che-credentials-service';
import { ContainerModule } from 'inversify';
import { CredentialsService } from '@theia/core/lib/browser/credentials-service';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(CheCredentialsService).toSelf().inSingletonScope();
  rebind(CredentialsService).to(CheCredentialsService).inSingletonScope();
  bind(CredentialsServer)
    .toDynamicValue(context =>
      context.container.get(WebSocketConnectionProvider).createProxy<CredentialsServer>(CREDENTIALS_SERVICE_PATH)
    )
    .inSingletonScope();
});
