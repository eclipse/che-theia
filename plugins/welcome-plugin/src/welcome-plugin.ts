/**********************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as theia from '@theia/plugin';

import { enableWelcome, isWelcomeEnabled } from './devfile';

import { Commands } from './commands';
import { Readme } from './readme';
import { WelcomePanel } from './welcome-panel';

export async function start(context: theia.PluginContext): Promise<void> {
  await new WelcomePlugin(context).start();
}

export function stop(): void {}

class WelcomePlugin {
  constructor(protected context: theia.PluginContext) {}

  async start(): Promise<void> {
    const welcome = new WelcomePanel(this.context);

    this.context.subscriptions.push(
      theia.commands.registerCommand(Commands.SHOW_WELCOME, async () => {
        await welcome.show();
      })
    );

    this.context.subscriptions.push(
      theia.commands.registerCommand(Commands.ENABLE_WELCOME, async () => {
        await enableWelcome(true);
      })
    );

    this.context.subscriptions.push(
      theia.commands.registerCommand(Commands.DISABLE_WELCOME, async () => {
        await enableWelcome(false);
      })
    );

    if (theia.window.visibleTextEditors.length > 0) {
      return;
    }

    if (await isWelcomeEnabled()) {
      await welcome.show();
      new Readme(this.context).seekAndOpen();
    }
  }
}
