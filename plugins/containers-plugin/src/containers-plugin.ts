/**********************************************************************
 * Copyright (c) 2018-2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as che from '@eclipse-che/plugin';
import * as theia from '@theia/plugin';

import {
  CONTAINERS_PLUGIN_RUN_TASK_COMMAND_ID,
  ContainersTreeDataProvider,
  containersTreeTaskLauncherCommandHandler,
} from './containers-tree-data-provider';

import { ContainersService } from './containers-service';

export function start(context: theia.PluginContext): void {
  const treeDataProvider = new ContainersTreeDataProvider();
  const treeDataDisposableFn = theia.Disposable.create(() => {
    treeDataProvider.dispose();
  });
  context.subscriptions.push(treeDataDisposableFn);

  const treeView = theia.window.createTreeView('workspace', { treeDataProvider });

  const containersService = new ContainersService();
  containersService.updateContainers().then(
    async () => {
      // update tree
      treeDataProvider.updateContainersTreeData(containersService.containers);

      // update the title
      const workspace = await che.workspace.getCurrentWorkspace();
      let workspaceName = workspace.name;
      // old devfile v1 ?
      if (!workspaceName && workspace.devfile && workspace.devfile.metadata && workspace.devfile.metadata.name) {
        workspaceName = workspace.devfile.metadata.name;
      }
      treeView.title = workspaceName;
    },
    error => {
      console.error(error);
      theia.window.showErrorMessage(error);
    }
  );

  const containersTreeTaskLauncherCommand = { id: CONTAINERS_PLUGIN_RUN_TASK_COMMAND_ID };
  context.subscriptions.push(
    theia.commands.registerCommand(containersTreeTaskLauncherCommand, containersTreeTaskLauncherCommandHandler)
  );
}

export function stop(): void {}
