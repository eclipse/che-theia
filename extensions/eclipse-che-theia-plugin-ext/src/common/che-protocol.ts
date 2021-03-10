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

import { Event, JsonRpcServer } from '@theia/core';
import { Preferences, User } from '@eclipse-che/theia-remote-api/lib/common/user-service';

import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { CheLanguagesTestAPI } from './che-languages-test-protocol';
import { K8SRawResponse } from '@eclipse-che/theia-remote-api/lib/common/k8s-service';
import { Stat } from '@theia/filesystem/lib/common/files';
import { che as cheApi } from '@eclipse-che/api';
import { createProxyIdentifier } from '@theia/plugin-ext/lib/common/rpc-protocol';

/**
 * Workspace plugin API
 */
export interface CheWorkspace {
  restartWorkspace(restartWorkspaceOptions?: che.RestartWorkspaceOptions): Promise<boolean>;
}

export interface CheWorkspaceMain {
  $getCurrentWorkspace(): Promise<cheApi.workspace.Workspace>;
  // getAll(): Promise<Workspace[]>;
  // getAllByNamespace(namespace: string): Promise<Workspace[]>;
  $getById(workspaceId: string): Promise<cheApi.workspace.Workspace>;
  // create(config: WorkspaceConfig, params: ResourceCreateQueryParams): Promise<any>;
  $update(workspaceId: string, workspace: cheApi.workspace.Workspace): Promise<cheApi.workspace.Workspace>;
  // deleteWorkspace(workspaceId: string): Promise<any>;
  // start(workspaceId: string, environmentName: string): Promise<any>;
  // startTemporary(config: WorkspaceConfig): Promise<any>;
  // stop(workspaceId: string): Promise<any>;
  $getSettings(): Promise<che.KeyValue>;
  $restartWorkspace(machineToken: string, restartWorkspaceOptions?: che.RestartWorkspaceOptions): Promise<boolean>;
}

export interface CheDevfile {}

export interface CheDevfileMain {
  $get(): Promise<che.devfile.Devfile>;
  $getComponentStatuses(): Promise<che.devfile.DevfileComponentStatus[]>;
  $createWorkspace(devfilePath: string): Promise<void>;
  $update(updatedDevfile: che.devfile.Devfile): Promise<void>;
}

export interface CheSsh {}

export interface CheSshMain {
  $generate(service: string, name: string): Promise<cheApi.ssh.SshPair>;
  $create(sshKeyPair: cheApi.ssh.SshPair): Promise<void>;
  $get(service: string, name: string): Promise<cheApi.ssh.SshPair>;
  $getAll(service: string): Promise<cheApi.ssh.SshPair[]>;
  $deleteKey(service: string, name: string): Promise<void>;
}

export interface CheAuthority {}

export interface CheAuthorityMain {
  $getCertificates(): Promise<Buffer[] | undefined>;
}

export interface CheOpenshift {
  getToken(): Promise<string>;
}

export interface CheOpenshiftMain {
  $getToken(): Promise<string>;
}

export interface CheK8S {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendRawQuery(requestURL: string, opts: any): Promise<K8SRawResponse>;
}

export interface CheK8SMain {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $sendRawQuery(requestURL: string, opts: any): Promise<K8SRawResponse>;
}

export interface CheGithub {
  uploadPublicSshKey(publicKey: string): Promise<void>;
  getToken(): Promise<string>;
  getUser(): Promise<che.GithubUser>;
}

export interface CheGithubMain {
  $uploadPublicSshKey(publicKey: string): Promise<void>;
  $getToken(): Promise<string>;
  $getUser(): Promise<che.GithubUser>;
}

export interface CheOauth {
  getProviders(): Promise<string[]>;
  isAuthenticated(provider: string): Promise<boolean>;
  isRegistered(provider: string): Promise<boolean>;
}

export interface CheOauthMain {
  $getProviders(): Promise<string[]>;
  $isAuthenticated(provider: string): Promise<boolean>;
  $isRegistered(provider: string): Promise<boolean>;
}

/**
 * Telemetry plugin API
 */
export interface CheTelemetry {
  $onWillCommandExecute(commandId: string, listner?: che.TelemetryListenerParam): Promise<void>;
}

export interface CheTelemetryMain {
  $event(id: string, ownerId: string, properties: [string, string][]): Promise<void>;
  $getClientAddressInfo(): Promise<che.ClientAddressInfo>;
}

/**
 * Variables plugin API
 */
export interface CheVariables {
  $resolveVariable(variableId: number): Promise<string | undefined>;
}

export interface CheVariablesMain {
  $registerVariable(variable: Variable): Promise<void>;
  $disposeVariable(id: number): Promise<void>;
  $resolve(value: string): Promise<string | undefined>;
}

export interface CheTask {
  registerTaskRunner(type: string, runner: che.TaskRunner): Promise<che.Disposable>;
  fireTaskExited(event: che.TaskExitedEvent): Promise<void>;
  $runTask(config: che.TaskConfiguration, ctx?: string): Promise<che.TaskInfo>;
  $killTask(taskInfo: che.TaskInfo): Promise<void>;
  $onDidStartTask(taskInfo: che.TaskInfo): Promise<void>;
  $onDidEndTask(event: che.TaskExitedEvent): Promise<void>;
}

export const CheTaskMain = Symbol('CheTaskMain');
export interface CheTaskMain {
  $registerTaskRunner(type: string): Promise<void>;
  $disposeTaskRunner(type: string): Promise<void>;
  $fireTaskExited(event: che.TaskExitedEvent): Promise<void>;
  $addTaskSubschema(schema: che.TaskJSONSchema): Promise<void>;
  $setTaskStatus(options: che.TaskStatusOptions): Promise<void>;
}

export interface CheSideCarContentReader {
  $read(uri: string, options?: { encoding?: string }): Promise<string | undefined>;
}

export interface CheSideCarContentReaderMain {
  $registerContentReader(scheme: string): Promise<void>;
}

export interface CheSideCarFileSystem {
  $stat(resource: string): Promise<Stat>;
  $readFile(resource: string): Promise<BinaryBuffer>;
}

export interface CheSideCarFileSystemMain {
  $registerFileSystemProvider(scheme: string): Promise<void>;
  $disposeFileSystemProvider(scheme: string): Promise<void>;
}

export interface Variable {
  name: string;
  description: string;
  token: number;
}

export interface FactoryDto {
  /** Identifier of this factory instance, it is mandatory and unique. */
  id?: string;

  /** Version of this factory instance, it is mandatory. */
  v: string;

  /** Name of this factory instance, the name is unique for creator. */
  name: string;

  /** Creator of this factory instance. */
  creator: AuthorDto;

  /** Workspace configuration of this factory instance, it is mandatory for every factory. */
  workspace: WorkspaceConfigDto;

  /** Restrictions of this factory instance. */
  policies: PoliciesDto;

  /** Factory button for this instance. */
  button: FactoryButtonDto;

  /** IDE for this factory instance. */
  ide: IdeDto;

  /** Hyperlinks. */
  links?: { [attrName: string]: string };
}

/**
 * Defines the contract for the factory creator instance.
 */
export interface AuthorDto {
  /** Identifier of the user who created factory, it is mandatory */
  userId: string;

  /** Creation time of factory, set by the server (in milliseconds, from Unix epoch, no timezone) */
  created: number;
}

/**
 * Defines the contract for the factory restrictions.
 */
export interface PoliciesDto {
  /** Restrict access if referer header doesn't match this field */
  referer: string;

  /** Restrict access for factories used earlier then author supposes */
  since: number;

  /** Restrict access for factories used later then author supposes */
  until: number;

  /** Workspace creation strategy */
  create: string;
}

export type FactoryButtonTypeDto = 'logo' | 'nologo';

/**
 * Defines factory button.
 */
export interface FactoryButtonDto {
  /** Type of this button instance */
  type: FactoryButtonTypeDto;

  /** Attributes of this button instance */
  attributes: FactoryButtonAttributesDto;
}

/**
 * Defines factory button attributes.
 */
export interface FactoryButtonAttributesDto {
  /** Factory button color */
  color: string;

  /** Factory button counter */
  counter: boolean;

  /** Factory button logo */
  logo: string;

  /** Factory button style */
  style: string;
}

/**
 * Defines the contract for the factory IDE instance.
 */
export interface IdeDto {
  /** Returns configuration of IDE on application loaded event */
  onAppLoaded?: {
    actions?: FactoryActionDto[];
  };

  /** Returns configuration of IDE on application closed event */
  onAppClosed?: {
    actions?: FactoryActionDto[];
  };

  /** Returns configuration of IDE on projects loaded event */
  onProjectsLoaded?: {
    actions?: FactoryActionDto[];
  };
}

/**
 * Defines the contract for the factory action instance.
 */
export interface FactoryActionDto {
  /** IDE specific identifier of action e.g. ('openFile', 'editFile') */
  id: string;

  /** Properties of this action instance */
  properties?: {
    name?: string;
    file?: string;
    greetingTitle?: string;
    greetingContentUrl?: string;
  };
}

export interface WorkspaceConfigDto {
  name?: string;
  description?: string;
  defaultEnv: string;
  environments: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [environmentName: string]: any;
  };
  projects: ProjectConfigDto[];
  commands?: CommandDto[];
  links?: LinkDto[];
}

export interface ProjectConfigDto {
  name: string;
  path: string;
  description?: string;
  mixins?: string[];
  attributes?: { [attrName: string]: string[] };
  source?: SourceStorageDto;
  problems?: ProjectProblemDto;
}

export interface SourceStorageDto {
  type: string;
  location: string;
  parameters: { [attrName: string]: string };
}

export interface ProjectProblemDto {
  code: number;
  message: string;
}

export interface CommandDto {
  name: string;
  commandLine: string;
  type: string;
  attributes?: { [attrName: string]: string };
}

export interface LinkDto {
  href: string;
  rel?: string;
  method: string;
  produces?: string;
  consumes?: string;
  parameters?: LinkParameterDto[];
  requestBody?: RequestBodyDescriptor;
}

export interface WorkspaceDto {
  id?: string;
  config: WorkspaceConfigDto;
  status: string | WorkspaceStatus;
  namespace?: string;
  temporary?: boolean;
  attributes?: WorkspaceAttributesDto;
  runtime?: RuntimeDto;
  links?: { [attrName: string]: string };
}

export type WorkspaceStatus = 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED';

export interface RuntimeDto {
  activeEnv: string;
  machines: { [attrName: string]: MachineDto };
  owner: string;
  warnings?: WarningDto;
}

export interface MachineDto {
  status: string | MachineStatus;
  servers: { [attrName: string]: ServerDto };
  attributes?: { [attrName: string]: string };
}

export type MachineStatus = 'STARTING' | 'RUNNING' | 'STOPPED' | 'FAILED';

export interface ServerDto {
  url: string;
  status: string | ServerStatus;
  attributes?: { [attrName: string]: string };
}

export type ServerStatus = 'RUNNING' | 'STOPPED' | 'UNKNOWN';

export interface WarningDto {
  code: number;
  message: string;
}

export interface WorkspaceAttributesDto {
  created: number;
  updated?: number;
  stackId?: string;
  errorMessage?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [propName: string]: string | number | any;
}

export interface LinkParameterDto {
  name: string;
  defaultValue?: string;
  description?: string;
  type: LinkParameterType;
  required: boolean;
  valid: string[];
}

export type LinkParameterType = 'String' | 'Number' | 'Boolean' | 'Array' | 'Object';

export interface RequestBodyDescriptor {
  description: string;
}

export const PLUGIN_RPC_CONTEXT = {
  CHE_WORKSPACE: createProxyIdentifier<CheWorkspace>('CheWorkspace'),
  CHE_WORKSPACE_MAIN: createProxyIdentifier<CheWorkspaceMain>('CheWorkspaceMain'),

  CHE_DEVFILE: createProxyIdentifier<CheDevfile>('CheDevfile'),
  CHE_DEVFILE_MAIN: createProxyIdentifier<CheDevfileMain>('CheDevfileMain'),

  CHE_TELEMETRY: createProxyIdentifier<CheTelemetry>('CheTelemetry'),
  CHE_TELEMETRY_MAIN: createProxyIdentifier<CheTelemetryMain>('CheTelemetryMain'),

  CHE_VARIABLES: createProxyIdentifier<CheVariables>('CheVariables'),
  CHE_VARIABLES_MAIN: createProxyIdentifier<CheVariablesMain>('CheVariablesMain'),
  CHE_TASK: createProxyIdentifier<CheTask>('CheTask'),
  CHE_TASK_MAIN: createProxyIdentifier<CheTaskMain>('CheTaskMain'),

  CHE_SSH: createProxyIdentifier<CheSsh>('CheSsh'),
  CHE_SSH_MAIN: createProxyIdentifier<CheSshMain>('CheSshMain'),

  CHE_AUTHORITY: createProxyIdentifier<CheAuthority>('CheAuthority'),
  CHE_AUTHORITY_MAIN: createProxyIdentifier<CheAuthorityMain>('CheAuthorityMain'),

  CHE_GITHUB: createProxyIdentifier<CheGithub>('CheGithub'),
  CHE_GITHUB_MAIN: createProxyIdentifier<CheGithubMain>('CheGithubMain'),

  CHE_OAUTH: createProxyIdentifier<CheOauth>('CheOauth'),
  CHE_OAUTH_MAIN: createProxyIdentifier<CheOauthMain>('CheOauthMain'),

  CHE_OPENSHIFT: createProxyIdentifier<CheOpenshift>('CheOpenshift'),
  CHE_OPENSHIFT_MAIN: createProxyIdentifier<CheOpenshiftMain>('CheOpenshiftMain'),

  CHE_K8S: createProxyIdentifier<CheK8S>('CheK8S'),
  CHE_K8S_MAIN: createProxyIdentifier<CheK8SMain>('CheK8SMain'),

  CHE_USER: createProxyIdentifier<CheUser>('CheUser'),
  CHE_USER_MAIN: createProxyIdentifier<CheUserMain>('CheUserMain'),

  CHE_PRODUCT: createProxyIdentifier<CheProduct>('CheProduct'),
  CHE_PRODUCT_MAIN: createProxyIdentifier<CheProductMain>('CheProductMain'),

  CHE_SIDERCAR_CONTENT_READER: createProxyIdentifier<CheSideCarContentReader>('CheSideCarContentReader'),
  CHE_SIDERCAR_CONTENT_READER_MAIN: createProxyIdentifier<CheSideCarContentReaderMain>('CheSideCarContentReaderMain'),

  CHE_SIDECAR_FILE_SYSTEM: createProxyIdentifier<CheSideCarFileSystem>('CheSideCarFileSystem'),
  CHE_SIDECAR_FILE_SYSTEM_MAIN: createProxyIdentifier<CheSideCarFileSystemMain>('CheSideCarFileSystemMain'),

  CHE_LANGUAGES_TEST_API_MAIN: createProxyIdentifier<CheLanguagesTestAPI>('CheLanguagesTestAPI'),
};

// Theia RPC protocol

export const CHE_AUTHORITY_SERVICE_PATH = '/che-authority-service';

export const CheAuthorityService = Symbol('CheAuthorityService');
export interface CheAuthorityService {
  getCertificates(): Promise<Buffer[] | undefined>;
}

export const CHE_TASK_SERVICE_PATH = '/che-task-service';

export const CheTaskService = Symbol('CheTaskService');
export interface CheTaskService extends JsonRpcServer<CheTaskClient> {
  registerTaskRunner(type: string): Promise<void>;
  disposeTaskRunner(type: string): Promise<void>;
  disconnectClient(client: CheTaskClient): void;
  fireTaskExited(event: che.TaskExitedEvent): Promise<void>;
}

export const CheTaskClient = Symbol('CheTaskClient');
export interface CheTaskClient {
  runTask(taskConfig: che.TaskConfiguration, ctx?: string): Promise<che.TaskInfo>;
  killTask(taskInfo: che.TaskInfo): Promise<void>;
  addRunTaskHandler(func: (config: che.TaskConfiguration, ctx?: string) => Promise<che.TaskInfo>): void;
  onKillEvent: Event<che.TaskInfo>;
}

export interface CheUser {}

export interface CheUserMain {
  $getCurrentUser(): Promise<User>;
  $getUserPreferences(filter?: string): Promise<Preferences>;
  $updateUserPreferences(preferences: Preferences): Promise<Preferences>;
  $replaceUserPreferences(preferences: Preferences): Promise<Preferences>;
  $deleteUserPreferences(list?: string[]): Promise<void>;
}

export interface CheProduct {}

export interface CheProductMain {
  $getProduct(): Promise<Product>;
}

export const CHE_PRODUCT_SERVICE_PATH = '/che-product-service';

export const CheProductService = Symbol('CheProductService');

export interface CheProductService {
  /**
   * Returns the product info.
   */
  getProduct(): Promise<Product>;
}

export interface Product {
  // Product icon
  icon: string;
  // Product logo. Provides images for dark and white themes
  logo: string | che.Logo;
  // Product name
  name: string;
  // Welcome page
  welcome: che.Welcome | undefined;
  // Helpful links
  links: che.LinkMap;
}

export type ContentReaderFunc = (uri: string, options?: { encoding?: string }) => Promise<string | undefined>;

export const CheSideCarContentReaderRegistry = Symbol('CheSideCarContentReaderRegistry');

export interface CheSideCarContentReaderRegistry {
  register(scheme: string, f: ContentReaderFunc): void;
  unregister(scheme: string): void;
  get(scheme: string): ContentReaderFunc | undefined;
}
