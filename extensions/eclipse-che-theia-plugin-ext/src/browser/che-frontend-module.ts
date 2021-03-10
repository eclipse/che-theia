/**********************************************************************
 * Copyright (c) 2018-2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import '../../src/browser/style/che-plugins.css';
import '../../src/browser/style/tasks.css';

import {
  CHE_AUTHORITY_SERVICE_PATH,
  CHE_PRODUCT_SERVICE_PATH,
  CHE_TASK_SERVICE_PATH,
  CheAuthorityService,
  CheProductService,
  CheSideCarContentReaderRegistry,
  CheTaskClient,
  CheTaskService,
} from '../common/che-protocol';
import { CHE_PLUGIN_SERVICE_PATH, ChePluginService, ChePluginServiceClient } from '../common/che-plugin-protocol';
import { CheSideCarContentReaderRegistryImpl, CheSideCarResourceResolver } from './che-sidecar-resource';
import { CommandContribution, ResourceResolver } from '@theia/core/lib/common';
import { ContainerModule, interfaces } from 'inversify';
import { WebSocketConnectionProvider, WidgetFactory } from '@theia/core/lib/browser';

import { CheApiProvider } from './che-api-provider';
import { CheDebugConfigurationManager } from './che-debug-configuration-manager';
import { CheLanguagesMainTestImpl } from './che-languages-test-main';
import { ChePluginCommandContribution } from './plugin/che-plugin-command-contribution';
import { ChePluginFrontentService } from './plugin/che-plugin-frontend-service';
import { ChePluginHandleRegistry } from './che-plugin-handle-registry';
import { ChePluginManager } from './plugin/che-plugin-manager';
import { ChePluginMenu } from './plugin/che-plugin-menu';
import { ChePluginServiceClientImpl } from './plugin/che-plugin-service-client';
import { ChePluginView } from './plugin/che-plugin-view';
import { ChePluginViewContribution } from './plugin/che-plugin-view-contribution';
import { CheTaskClientImpl } from './che-task-client';
import { CheTaskResolver } from './che-task-resolver';
import { CheTaskTerminalWidgetManager } from './che-task-terminal-widget-manager';
import { CheWebviewEnvironment } from './che-webview-environment';
import { ContainerPicker } from './container-picker';
import { DebugConfigurationManager } from '@theia/debug/lib/browser/debug-configuration-manager';
import { LanguagesMainFactory } from '@theia/plugin-ext';
import { MainPluginApiProvider } from '@theia/plugin-ext/lib/common/plugin-ext-api-contribution';
import { PluginFrontendViewContribution } from '@theia/plugin-ext/lib/main/browser/plugin-frontend-view-contribution';
import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';
import { TaskConfigurationsService } from './task-config-service';
import { TaskService } from '@theia/task/lib/browser';
import { TaskStatusHandler } from './task-status-handler';
import { TaskTerminalWidgetManager } from '@theia/task/lib/browser/task-terminal-widget-manager';
import { WebviewEnvironment } from '@theia/plugin-ext/lib/main/browser/webview/webview-environment';
import { bindChePluginPreferences } from './plugin/che-plugin-preferences';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(CheApiProvider).toSelf().inSingletonScope();
  bind(MainPluginApiProvider).toService(CheApiProvider);

  bind(CheTaskClient).to(CheTaskClientImpl).inSingletonScope();
  bind(CheTaskService)
    .toDynamicValue(ctx => {
      const provider = ctx.container.get(WebSocketConnectionProvider);
      const client: CheTaskClient = ctx.container.get(CheTaskClient);
      return provider.createProxy<CheTaskService>(CHE_TASK_SERVICE_PATH, client);
    })
    .inSingletonScope();

  bindChePluginPreferences(bind);

  bind(ChePluginServiceClientImpl).toSelf().inSingletonScope();
  bind(ChePluginServiceClient).toService(ChePluginServiceClientImpl);
  bind(ChePluginService)
    .toDynamicValue(ctx => {
      const provider = ctx.container.get(WebSocketConnectionProvider);
      const client: ChePluginServiceClient = ctx.container.get(ChePluginServiceClient);
      return provider.createProxy<ChePluginService>(CHE_PLUGIN_SERVICE_PATH, client);
    })
    .inSingletonScope();

  rebind(WebviewEnvironment).to(CheWebviewEnvironment).inSingletonScope();

  bind(ChePluginFrontentService).toSelf().inSingletonScope();
  bind(ChePluginManager).toSelf().inSingletonScope();

  rebind(PluginFrontendViewContribution).to(ChePluginViewContribution);

  bind(ChePluginMenu).toSelf().inSingletonScope();

  bind(ChePluginView).toSelf();
  bind(WidgetFactory).toDynamicValue(ctx => ({
    id: ChePluginViewContribution.PLUGINS_WIDGET_ID,
    createWidget: () => ctx.container.get(ChePluginView),
  }));

  bind(ChePluginCommandContribution).toSelf().inSingletonScope();
  bind(CommandContribution).toService(ChePluginCommandContribution);

  bind(CheAuthorityService)
    .toDynamicValue(ctx => {
      const provider = ctx.container.get(WebSocketConnectionProvider);
      return provider.createProxy<CheAuthorityService>(CHE_AUTHORITY_SERVICE_PATH);
    })
    .inSingletonScope();

  bind(CheProductService)
    .toDynamicValue(ctx => {
      const provider = ctx.container.get(WebSocketConnectionProvider);
      return provider.createProxy<CheProductService>(CHE_PRODUCT_SERVICE_PATH);
    })
    .inSingletonScope();

  bind(CheSideCarContentReaderRegistry).to(CheSideCarContentReaderRegistryImpl).inSingletonScope();
  bind(CheSideCarResourceResolver).toSelf().inSingletonScope();
  bind(ResourceResolver).toService(CheSideCarResourceResolver);

  bind(TaskStatusHandler).toSelf().inSingletonScope();

  bind(TaskConfigurationsService).toSelf().inSingletonScope();
  rebind(TaskService).toService(TaskConfigurationsService);

  bind(CheTaskResolver).toSelf().inSingletonScope();
  bind(ContainerPicker).toSelf().inSingletonScope();

  bind(CheTaskTerminalWidgetManager).toSelf().inSingletonScope();
  rebind(TaskTerminalWidgetManager).toService(CheTaskTerminalWidgetManager);

  bind(ChePluginHandleRegistry).toSelf().inSingletonScope();
  bind(CheLanguagesMainTestImpl).toSelf().inTransientScope();
  rebind(LanguagesMainFactory).toFactory((context: interfaces.Context) => (rpc: RPCProtocol) => {
    const child = context.container.createChild();
    child.bind(RPCProtocol).toConstantValue(rpc);
    return child.get(CheLanguagesMainTestImpl);
  });

  bind(CheDebugConfigurationManager).toSelf().inSingletonScope();
  rebind(DebugConfigurationManager).to(CheDebugConfigurationManager).inSingletonScope();
});
