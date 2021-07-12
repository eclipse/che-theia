/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import '../../src/browser/style/index.css';

import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { Container, ContainerModule, interfaces } from 'inversify';
import {
  DevfileWatcher,
  ExtensionsJsonWatcher,
  PluginsYamlWatcher,
  TasksJsonWatcher,
} from './workspace-config-files-watcher';
import { FileTree, FileTreeModel, FileTreeWidget, createFileTreeContainer } from '@theia/filesystem/lib/browser';
import {
  FrontendApplicationContribution,
  Tree,
  TreeDecoratorService,
  TreeModel,
  TreeProps,
} from '@theia/core/lib/browser';
import {
  NavigatorDecoratorService,
  NavigatorTreeDecorator,
} from '@theia/navigator/lib/browser/navigator-decorator-service';

import { CheFileNavigatorWidget } from './che-navigator-widget';
import { CheWorkspaceContribution } from './che-workspace-contribution';
import { CheWorkspaceController } from './che-workspace-controller';
import { ExplorerContribution } from './explorer-contribution';
import { FILE_NAVIGATOR_PROPS } from '@theia/navigator/lib/browser/navigator-container';
import { FileNavigatorModel } from '@theia/navigator/lib/browser/navigator-model';
import { FileNavigatorTree } from '@theia/navigator/lib/browser/navigator-tree';
import { FileNavigatorWidget } from '@theia/navigator/lib/browser/navigator-widget';
import { QuickOpenCheWorkspace } from './che-quick-open-workspace';
import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(QuickOpenCheWorkspace).toSelf().inSingletonScope();
  bind(CheWorkspaceController).toSelf().inSingletonScope();
  bind(CheWorkspaceContribution).toSelf().inSingletonScope();
  for (const identifier of [CommandContribution, MenuContribution]) {
    bind(identifier).toService(CheWorkspaceContribution);
  }

  bind(ExplorerContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).to(ExplorerContribution);

  rebind(FileNavigatorWidget).toDynamicValue(ctx => createFileNavigatorWidget(ctx.container));

  const devWorkspaceName = process.env['DEVWORKSPACE_NAME'];
  if (devWorkspaceName) {
    bind(DevfileWatcher).toSelf().inSingletonScope();
    bind(ExtensionsJsonWatcher).toSelf().inSingletonScope();
    bind(PluginsYamlWatcher).toSelf().inSingletonScope();
    bind(TasksJsonWatcher).toSelf().inSingletonScope();
    [DevfileWatcher, ExtensionsJsonWatcher, PluginsYamlWatcher, TasksJsonWatcher].forEach(component => {
      bind(FrontendApplicationContribution).to(component);
    });
  }
});

export function createFileNavigatorContainer(parent: interfaces.Container): Container {
  const child = createFileTreeContainer(parent);

  child.unbind(FileTree);
  child.bind(FileNavigatorTree).toSelf();
  child.rebind(Tree).toService(FileNavigatorTree);

  child.unbind(FileTreeModel);
  child.bind(FileNavigatorModel).toSelf();
  child.rebind(TreeModel).toService(FileNavigatorModel);

  child.unbind(FileTreeWidget);
  child.bind(CheFileNavigatorWidget).toSelf();

  child.rebind(TreeProps).toConstantValue(FILE_NAVIGATOR_PROPS);

  child.bind(NavigatorDecoratorService).toSelf().inSingletonScope();
  child.rebind(TreeDecoratorService).toService(NavigatorDecoratorService);
  bindContributionProvider(child, NavigatorTreeDecorator);

  return child;
}

export function createFileNavigatorWidget(parent: interfaces.Container): CheFileNavigatorWidget {
  return createFileNavigatorContainer(parent).get(CheFileNavigatorWidget);
}
