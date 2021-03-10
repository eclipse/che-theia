/**********************************************************************
 * Copyright (c) 2018-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as che from '@eclipse-che/plugin';
import * as theia from '@theia/plugin';

import { CheTaskImpl, TaskStatus, TaskTerminallKind } from './che-task-impl';

import { CheAuthorityImpl } from './che-authority';
import { CheDevfileImpl } from './che-devfile';
import { CheGithubImpl } from './che-github';
import { CheK8SImpl } from './che-k8s';
import { CheOauthImpl } from './che-oauth';
import { CheOpenshiftImpl } from './che-openshift';
import { CheProductImpl } from './che-product';
import { CheSideCarContentReaderImpl } from './che-sidecar-content-reader';
import { CheSideCarFileSystemImpl } from './che-sidecar-file-system';
import { CheSshImpl } from './che-ssh';
import { CheTelemetryImpl } from './che-telemetry';
import { CheUserImpl } from './che-user';
import { CheVariablesImpl } from './che-variables';
import { CheWorkspaceImpl } from './che-workspace';
import { Disposable } from '@theia/core';
import { K8SRawResponse } from '@eclipse-che/theia-remote-api/lib/common/k8s-service';
import { PLUGIN_RPC_CONTEXT } from '../common/che-protocol';
import { Plugin } from '@theia/plugin-ext/lib/common/plugin-api-rpc';
import { RPCProtocol } from '@theia/plugin-ext/lib/common/rpc-protocol';
import { TaskStatusOptions } from '@eclipse-che/plugin';
import { che as cheApi } from '@eclipse-che/api';

export interface CheApiFactory {
  (plugin: Plugin): typeof che;
}

export function createAPIFactory(rpc: RPCProtocol): CheApiFactory {
  const cheWorkspaceImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_WORKSPACE, new CheWorkspaceImpl(rpc));
  const cheDevfileImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_DEVFILE, new CheDevfileImpl(rpc));
  const cheVariablesImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_VARIABLES, new CheVariablesImpl(rpc));
  const cheTaskImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_TASK, new CheTaskImpl(rpc));
  const cheSshImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_SSH, new CheSshImpl(rpc));
  const cheAuthorityImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_AUTHORITY, new CheAuthorityImpl(rpc));
  const cheGithubImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_GITHUB, new CheGithubImpl(rpc));
  const cheOpenshiftImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_OPENSHIFT, new CheOpenshiftImpl(rpc));
  const cheOauthImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_OAUTH, new CheOauthImpl(rpc));
  const cheK8SImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_K8S, new CheK8SImpl(rpc));
  const cheUserImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_USER, new CheUserImpl(rpc));
  rpc.set(PLUGIN_RPC_CONTEXT.CHE_SIDERCAR_CONTENT_READER, new CheSideCarContentReaderImpl(rpc));
  rpc.set(PLUGIN_RPC_CONTEXT.CHE_SIDECAR_FILE_SYSTEM, new CheSideCarFileSystemImpl(rpc));

  const cheProductImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_PRODUCT, new CheProductImpl(rpc));
  const cheTelemetryImpl = rpc.set(PLUGIN_RPC_CONTEXT.CHE_TELEMETRY, new CheTelemetryImpl(rpc));

  const languageTestAPI = rpc.getProxy(PLUGIN_RPC_CONTEXT.CHE_LANGUAGES_TEST_API_MAIN);

  return function (plugin: Plugin): typeof che {
    const workspace: typeof che.workspace = {
      getCurrentWorkspace(): Promise<cheApi.workspace.Workspace> {
        return cheWorkspaceImpl.getCurrentWorkspace();
      },
      getAll(): Promise<cheApi.workspace.Workspace[]> {
        return cheWorkspaceImpl.getAll();
      },
      getAllByNamespace(namespace: string): Promise<cheApi.workspace.Workspace[]> {
        return cheWorkspaceImpl.getAllByNamespace(namespace);
      },
      getById(workspaceKey: string): Promise<cheApi.workspace.Workspace> {
        return cheWorkspaceImpl.getById(workspaceKey);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create(config: cheApi.workspace.WorkspaceConfig, params: che.KeyValue): Promise<any> {
        return cheWorkspaceImpl.create(config, params);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update(workspaceId: string, workspaceObj: cheApi.workspace.Workspace): Promise<any> {
        return cheWorkspaceImpl.update(workspaceId, workspaceObj);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deleteWorkspace(workspaceId: string): Promise<any> {
        return cheWorkspaceImpl.deleteWorkspace(workspaceId);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      start(workspaceId: string, environmentName: string): Promise<any> {
        return cheWorkspaceImpl.start(workspaceId, environmentName);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startTemporary(config: cheApi.workspace.WorkspaceConfig): Promise<any> {
        return cheWorkspaceImpl.startTemporary(config);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stop(workspaceId: string): Promise<any> {
        return cheWorkspaceImpl.stop(workspaceId);
      },
      getSettings(): Promise<che.KeyValue> {
        return cheWorkspaceImpl.getSettings();
      },
      restartWorkspace(restartWorkspaceOptions?: che.RestartWorkspaceOptions): Promise<boolean> {
        return cheWorkspaceImpl.restartWorkspace(restartWorkspaceOptions);
      },
    };

    const devfile: typeof che.devfile = {
      get(): Promise<che.devfile.Devfile> {
        return cheDevfileImpl.get();
      },
      update(updatedDevfile: che.devfile.Devfile): Promise<void> {
        return cheDevfileImpl.update(updatedDevfile);
      },
      getComponentStatuses(): Promise<che.devfile.DevfileComponentStatus[]> {
        return cheDevfileImpl.getComponentStatuses();
      },
      createWorkspace(devfilePath: string): Promise<void> {
        return cheDevfileImpl.createWorkspace(devfilePath);
      },
    };

    const telemetry: typeof che.telemetry = {
      event(id: string, ownerId: string, properties: [string, string][]): Promise<void> {
        return cheTelemetryImpl.event(id, ownerId, properties);
      },
      addCommandListener(commandId: string, listener: che.TelemetryListener): Promise<void> {
        return cheTelemetryImpl.addCommandListener(commandId, listener);
      },
      getClienAddressInfo(): Promise<che.ClientAddressInfo> {
        return cheTelemetryImpl.getClientAddressInfo();
      },
    };

    const variables: typeof che.variables = {
      registerVariable(variable: che.Variable): Promise<che.Disposable> {
        return cheVariablesImpl.registerVariable(variable);
      },
      resolve(value: string): Promise<string | undefined> {
        return cheVariablesImpl.resolve(value);
      },
    };

    const github: typeof che.github = {
      uploadPublicSshKey(publicKey: string): Promise<void> {
        return cheGithubImpl.uploadPublicSshKey(publicKey);
      },
      getToken(): Promise<string> {
        return cheGithubImpl.getToken();
      },
      getUser(): Promise<che.GithubUser> {
        return cheGithubImpl.getUser();
      },
    };

    const openshift: typeof che.openshift = {
      getToken(): Promise<string> {
        return cheOpenshiftImpl.getToken();
      },
    };

    const oAuth: typeof che.oAuth = {
      getProviders(): Promise<string[]> {
        return cheOauthImpl.getProviders();
      },
      isAuthenticated(provider: string): Promise<boolean> {
        return cheOauthImpl.isAuthenticated(provider);
      },
      isRegistered(provider: string): Promise<boolean> {
        return cheOauthImpl.isRegistered(provider);
      },
    };

    const ssh: typeof che.ssh = {
      deleteKey(service: string, name: string): Promise<void> {
        return cheSshImpl.delete(service, name);
      },
      generate(service: string, name: string): Promise<cheApi.ssh.SshPair> {
        return cheSshImpl.generate(service, name);
      },
      create(sshKeyPair: cheApi.ssh.SshPair): Promise<void> {
        return cheSshImpl.create(sshKeyPair);
      },
      getAll(service: string): Promise<cheApi.ssh.SshPair[]> {
        return cheSshImpl.getAll(service);
      },
      get(service: string, name: string): Promise<cheApi.ssh.SshPair> {
        return cheSshImpl.get(service, name);
      },
    };

    const authority: typeof che.authority = {
      getCertificates(): Promise<Buffer[] | undefined> {
        return cheAuthorityImpl.getCertificates();
      },
    };

    const task: typeof che.task = {
      registerTaskRunner(type: string, runner: che.TaskRunner): Promise<che.Disposable> {
        return cheTaskImpl.registerTaskRunner(type, runner);
      },
      fireTaskExited(event: che.TaskExitedEvent): Promise<void> {
        return cheTaskImpl.fireTaskExited(event);
      },
      addTaskSubschema(schema: che.TaskJSONSchema): Promise<void> {
        return cheTaskImpl.addTaskSubschema(schema);
      },
      setTaskStatus(options: TaskStatusOptions): Promise<void> {
        return cheTaskImpl.setTaskStatus(options);
      },
      onDidStartTask(listener: (event: che.TaskInfo) => void, disposables?: che.Disposable[]): Disposable {
        return cheTaskImpl.onDidStartTask(listener, undefined, disposables);
      },
      onDidEndTask(listener: (event: che.TaskExitedEvent) => void, disposables?: che.Disposable[]): Disposable {
        return cheTaskImpl.onDidEndTask(listener, undefined, disposables);
      },
    };

    const user: typeof che.user = {
      getCurrentUser(): Promise<che.User> {
        return cheUserImpl.getCurrentUser();
      },
      getUserPreferences(filter?: string): Promise<che.Preferences> {
        return cheUserImpl.getUserPreferences(filter);
      },
      updateUserPreferences(update: che.Preferences): Promise<che.Preferences> {
        return cheUserImpl.updateUserPreferences(update);
      },
      replaceUserPreferences(preferences: che.Preferences): Promise<che.Preferences> {
        return cheUserImpl.replaceUserPreferences(preferences);
      },
      deleteUserPreferences(list?: string[]): Promise<void> {
        return cheUserImpl.deleteUserPreferences(list);
      },
    };

    const product: typeof che.product = {
      get icon(): string {
        return cheProductImpl.getIcon();
      },
      get logo(): string | che.Logo {
        return cheProductImpl.getLogo();
      },
      get name(): string {
        return cheProductImpl.getName();
      },
      get welcome(): che.Welcome | undefined {
        return cheProductImpl.getWelcome();
      },
      get links(): che.LinkMap {
        return cheProductImpl.getLinks();
      },
    };

    const languagesTest: typeof che.languages.test = {
      completion(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        context: theia.CompletionContext,
        token: theia.CancellationToken
      ): Promise<theia.CompletionList | undefined> {
        return languageTestAPI.$provideCompletionItems(pluginID, resource, position, context, token);
      },
      implementation(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        token: theia.CancellationToken
      ): Promise<theia.Definition | theia.DefinitionLink[] | undefined> {
        return languageTestAPI.$provideImplementation(pluginID, resource, position, token);
      },
      typeDefinition(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        token: theia.CancellationToken
      ): Promise<theia.Definition | theia.DefinitionLink[] | undefined> {
        return languageTestAPI.$provideTypeDefinition(pluginID, resource, position, token);
      },
      definition(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        token: theia.CancellationToken
      ): Promise<theia.Definition | theia.DefinitionLink[] | undefined> {
        return languageTestAPI.$provideDefinition(pluginID, resource, position, token);
      },
      declaration(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        token: theia.CancellationToken
      ): Promise<theia.Definition | theia.DefinitionLink[] | undefined> {
        return languageTestAPI.$provideDeclaration(pluginID, resource, position, token);
      },
      references(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        context: theia.ReferenceContext,
        token: theia.CancellationToken
      ): Promise<theia.Location[] | undefined> {
        return languageTestAPI.$provideReferences(pluginID, resource, position, context, token);
      },
      signatureHelp(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        context: theia.SignatureHelpContext,
        token: theia.CancellationToken
      ): Promise<theia.SignatureHelp | undefined> {
        return languageTestAPI.$provideSignatureHelp(pluginID, resource, position, context, token);
      },
      hover(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        token: theia.CancellationToken
      ): Promise<theia.Hover | undefined> {
        return languageTestAPI.$provideHover(pluginID, resource, position, token);
      },
      documentHighlights(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        token: theia.CancellationToken
      ): Promise<theia.DocumentHighlight[] | undefined> {
        return languageTestAPI.$provideDocumentHighlights(pluginID, resource, position, token);
      },
      documentFormattingEdits(
        pluginID: string,
        resource: theia.Uri,
        options: theia.FormattingOptions,
        token: theia.CancellationToken
      ): Promise<theia.TextEdit[] | undefined> {
        return languageTestAPI.$provideDocumentFormattingEdits(pluginID, resource, options, token);
      },
      documentRangeFormattingEdits(
        pluginID: string,
        resource: theia.Uri,
        range: theia.Range,
        options: theia.FormattingOptions,
        token: theia.CancellationToken
      ): Promise<theia.TextEdit[] | undefined> {
        return languageTestAPI.$provideDocumentRangeFormattingEdits(pluginID, resource, range, options, token);
      },
      onTypeFormattingEdits(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        ch: string,
        options: theia.FormattingOptions,
        token: theia.CancellationToken
      ): Promise<theia.TextEdit[] | undefined> {
        return languageTestAPI.$provideOnTypeFormattingEdits(pluginID, resource, position, ch, options, token);
      },
      documentLinks(
        pluginID: string,
        resource: theia.Uri,
        token: theia.CancellationToken
      ): Promise<theia.DocumentLink[] | undefined> {
        return languageTestAPI.$provideDocumentLinks(pluginID, resource, token);
      },
      codeLenses(
        pluginID: string,
        resource: theia.Uri,
        token: theia.CancellationToken
      ): Promise<theia.CodeLens[] | undefined> {
        return languageTestAPI.$provideCodeLenses(pluginID, resource, token);
      },
      codeActions(
        pluginID: string,
        resource: theia.Uri,
        rangeOrSelection: theia.Range | theia.Selection,
        context: theia.CodeActionContext,
        token: theia.CancellationToken
      ): Promise<theia.CodeAction[] | undefined> {
        return languageTestAPI.$provideCodeActions(pluginID, resource, rangeOrSelection, context, token);
      },
      documentSymbols(
        pluginID: string,
        resource: theia.Uri,
        token: theia.CancellationToken
      ): Promise<theia.DocumentSymbol[] | undefined> {
        return languageTestAPI.$provideDocumentSymbols(pluginID, resource, token);
      },
      workspaceSymbols(
        pluginID: string,
        query: string,
        token: theia.CancellationToken
      ): Promise<theia.SymbolInformation[]> {
        return languageTestAPI.$provideWorkspaceSymbols(pluginID, query, token);
      },
      foldingRange(
        pluginID: string,
        resource: theia.Uri,
        context: theia.FoldingContext,
        token: theia.CancellationToken
      ): Promise<theia.FoldingRange[] | undefined> {
        return languageTestAPI.$provideFoldingRange(pluginID, resource, context, token);
      },
      documentColors(
        pluginID: string,
        resource: theia.Uri,
        token: theia.CancellationToken
      ): Promise<theia.ColorInformation[]> {
        return languageTestAPI.$provideDocumentColors(pluginID, resource, token);
      },
      renameEdits(
        pluginID: string,
        resource: theia.Uri,
        position: theia.Position,
        newName: string,
        token: theia.CancellationToken
      ): Promise<theia.WorkspaceEdit | undefined> {
        return languageTestAPI.$provideRenameEdits(pluginID, resource, position, newName, token);
      },
    };

    const languages: typeof che.languages = {
      test: languagesTest,
    };

    const k8s: typeof che.k8s = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendRawQuery(requestURL: string, opts: any): Promise<K8SRawResponse> {
        return cheK8SImpl.sendRawQuery(requestURL, opts);
      },
    };

    return <typeof che>{
      workspace,
      devfile,
      variables,
      task,
      ssh,
      authority,
      user,
      product,
      github,
      openshift,
      oAuth,
      telemetry,
      TaskStatus,
      TaskTerminallKind,
      languages,
      k8s,
    };
  };
}
