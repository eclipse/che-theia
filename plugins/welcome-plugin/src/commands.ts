/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as theia from '@theia/plugin';

export namespace Commands {
  export const SHOW_WELCOME: theia.CommandDescription = {
    id: 'welcome:show_welcome',
    label: 'Welcome: Show Welcome...',
  };

  export const ENABLE_WELCOME: theia.CommandDescription = {
    id: 'welcome:enable',
  };

  export const DISABLE_WELCOME: theia.CommandDescription = {
    id: 'welcome:disable',
  };
}
