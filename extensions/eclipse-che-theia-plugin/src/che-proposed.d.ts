/**********************************************************************
 * Copyright (c) 2018-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

/**
 * This is the place for API experiments and proposals.
 * These API are NOT stable and subject to change. Use it on own risk.
 */

import { che as cheApi } from '@eclipse-che/api'
import * as theia from '@theia/plugin';

declare module '@eclipse-che/plugin' {

    export interface KeyValue {
        [key: string]: string;
    }

    export interface RestartWorkspaceOptions {
        prompt?: boolean;
        promptMessage? : string;
    }

    export namespace workspace {
        export function getCurrentWorkspace(): Promise<cheApi.workspace.Workspace>;
        export function getAll(): Promise<cheApi.workspace.Workspace[]>;
        export function getAllByNamespace(namespace: string): Promise<cheApi.workspace.Workspace[]>;
        export function getById(workspaceId: string): Promise<cheApi.workspace.Workspace>;
        export function create(config: cheApi.workspace.WorkspaceConfig, params: KeyValue): Promise<any>;
        export function update(workspaceId: string, workspace: cheApi.workspace.Workspace): Promise<any>;
        export function deleteWorkspace(workspaceId: string): Promise<any>;
        export function start(workspaceId: string, environmentName: string): Promise<any>;
        export function startTemporary(config: cheApi.workspace.WorkspaceConfig): Promise<any>;
        export function stop(workspaceId: string): Promise<any>;
        export function getSettings(): Promise<KeyValue>;
        /**
         * Restart the current workspace
         * @param restartWorkspaceOptions options to restart
         * @return true if restart will occur
         */
        export function restartWorkspace(restartWorkspaceOptions?: RestartWorkspaceOptions): Promise<boolean>;
    }

    export namespace devfile {

        export interface DevfileComponentStatus {
            name: string;
            isUser: boolean;
            endpoints?: {
                [endpointName: string]: {
                    url?: string;
                };
            };
        }
        export interface DevfileMetadata {
            attributes?: { [attributeName: string]: string };
            description?: string;
            displayName?: string;
            globalMemoryLimit?: string;
            icon?: string;
            name?: string;
            tags?: string[];
            version?: string;
        }

        export interface Devfile {
            apiVersion: string;
            attributes?: { [attributeName: string]: string };
            metadata: DevfileMetadata;
            projects?: DevfileProject[];
            components?: DevfileComponent[];
            commands?: DevfileCommand[];
        }
        export interface DevfileCommandGroup {
            isDefault?: boolean;
            kind: 'build' | 'run' | 'test' | 'debug';
        }

        export interface DevfileCommand {
            apply?: {
                component: string;
                group?: DevfileCommandGroup;
                label?: string;
            };
            composite?: {
                commands: string[];
                group?: DevfileCommandGroup;
                label?: string;
                parallel?: boolean;
            };
            exec?: {
                commandLine?: string;
                component: string;
                env?: DevfileComponentEnv[];
                group?: DevfileCommandGroup;
                hotReloadCapable?: boolean;
                label?: string;
                workingDir?: string;
            };
            vscodeLaunch?: {
                inline?: string;
                uri?: string;
                group?: DevfileCommandGroup;
            };
            vscodeTask?: {
                inline?: string;
                uri?: string;
                group?: DevfileCommandGroup;
            };
            attributes?: { [attributeName: string]: string };
            id: string;
        }

        export interface DevfileComponentVolumeMount {
            name?: string;
            path?: string;
        }

        export interface DevfileComponentEnv {
            name: string;
            value: string;
        }

        export interface DevfileComponentEndpoint {
            attributes?: { [attributeName: string]: string };
            exposure?: 'public' | 'internal' | 'none';
            name: string;
            path?: string;
            protocol?: 'http' | 'https' | 'ws' | 'wss' | 'tcp' | 'udp';
            secure?: boolean;
            targetPort: number;
        }

        export interface DevfileKubernetesComponent {
            inlined?: string;
            uri?: string;
            endpoints?: DevfileComponentEndpoint[];
        }

        export interface DevfileKubernetesComponent {
            inlined?: string;
            uri?: string;
            endpoints?: DevfileComponentEndpoint[];
        }

        export interface DevfileContainerComponent {
            args?: string[];
            command?: string[];
            cpuLimit?: string;
            cpuRequest?: string;
            dedicatedPod?: boolean;
            endpoints?: DevfileComponentEndpoint[];
            env?: DevfileComponentEnv[];
            image: string;
            memoryLimit?: string;
            memoryRequest?: string;
            mountSources?: boolean;
            sourceMapping?: string;
            volumeMounts?: DevfileComponentVolumeMount[];
        }

        export interface DevfileV1PluginComponent {
            id?: string;
            url?: string;
            registryUrl?: string;
            cpuLimit?: string;
            cpuRequest?: string;
            endpoints?: DevfileComponentEndpoint[];
            env?: DevfileComponentEnv[];
            memoryLimit?: string;
            memoryRequest?: string;
            mountSources?: boolean;
            sourceMapping?: string;
            volumeMounts?: DevfileComponentVolumeMount[];
            preferences?: { [preferenceName: string]: unknown };
        }
        export interface DevfileComponent {
            name?: string;
            container?: DevfileContainerComponent;
            kubernetes?: DevfileKubernetesComponent;
            openshift?: DevfileKubernetesComponent;
            plugin?: DevfileV1PluginComponent;
            attributes?: { [attributeName: string]: string };
            volume?: {
                size?: string;
            };
        }

        export interface DevfileProjectInfo {
            checkoutFrom?: {
                remote?: string;
                revision?: string;
            };
            remotes: { [remoteName: string]: string };
        }
        export interface DevfileProject {
            name: string;
            attributes?: { [attributeName: string]: string };
            clonePath?: string;
            git?: DevfileProjectInfo;
            github?: DevfileProjectInfo;
            zip?: {
                location: string;
            };
            sparseCheckoutDirs?: string[];
        }
        export function update(updatedDevfile: Devfile): Promise<void>;
        export function get(): Promise<Devfile>;
        export function getComponentStatuses(): Promise<DevfileComponentStatus[]>;
        export function createWorkspace(devfilePath: string): Promise<void>;
    }

    export interface GithubUser {
        login: string,
        id: number,
        name: string,
        email: string
    }

    export namespace github {
        export function uploadPublicSshKey(publicKey: string): Promise<void>;
        export function getToken(): Promise<string>;
        export function getUser(): Promise<GithubUser>;
    }

    export namespace openshift {
        export function getToken(): Promise<string>;
    }

    export namespace oAuth {
        export function getProviders(): Promise<string[]>;
        /**
         * Returns {@code true} if the current user is authenticated for given oAuth provider.
         * @param provider oAuth provider to Check.
         */
        export function isAuthenticated(provider: string): Promise<boolean>;
        /**
         * Returns {@code true} if the given oAuth provider is registered.
         * Use {@link $getProviders} in single-user mode to find the provider in the list.
         * @param provider oAuth provider to Check.
         */
        export function isRegistered(provider: string): Promise<boolean>;
    }

    export namespace ssh {
        export function generate(service: string, name: string): Promise<cheApi.ssh.SshPair>;

        export function create(sshKeyPair: cheApi.ssh.SshPair): Promise<void>;

        export function get(service: string, name: string): Promise<cheApi.ssh.SshPair>;

        export function getAll(service: string): Promise<cheApi.ssh.SshPair[]>;

        export function deleteKey(service: string, name: string): Promise<void>;
    }

    export namespace authority {
        /**
         * Returns an array containing available certificates.
         * 
         * Includes `/tmp/che/secret/ca.crt` and all certificates from `/public-certs`.
         */
        export function getCertificates(): Promise<Buffer[] | undefined>;
    }

    /**
     * Optionla parameters for telemetry events
     */
    export interface TelemetryListenerParam {
    }

    /**
     * Listener for global command invocation
     */
    export type TelemetryListener = (commandId: string, param?: TelemetryListenerParam) => void;
    export interface ClientAddressInfo {
        ip?: string,
        port?: string
        ipFamily?: number
    }
    export namespace telemetry {
        export function event(id: string, ownerId: string, properties: [string, string][]): Promise<void>;
        /** Fires when a command will starts. */
        export function addCommandListener(commandId: string, listener: TelemetryListener): Promise<void>;
        export function getClienAddressInfo(): Promise<ClientAddressInfo>;
    }

    /**
     * Namespace for variables substitution functionality.
     */
    export namespace variables {
        /**
         * Register a variable.
         *
         * @param variable A variable to register.
         */
        export function registerVariable(variable: Variable): Promise<Disposable>;

        /**
         * Resolve string value.
         *
         * @param value a string value to resolve. If the string contains '${<variable>}' the pattern will be replaced to a variables value.
         */
        export function resolve(value: string): Promise<string | undefined>;

    }

    export class Variable {

        /**
         * Creates a new variable.
         *
         * @param name The variable's unique name.
         * @param description The variable's human-readable description. Is presented in the user interface.
         * @param value The variable's value that may be resolved later.
         * @param isResolved `true` when there is a value already associated and the variable shouldn't be resolved again, i.e. it's value doesn't depend on the current context.
         */
        constructor(name: string, description: string, value?: string, isResolved?: boolean);

        name: string;

        description: string;

        value?: string;

        resolve(): PromiseLike<string | undefined>;

        readonly isResolved: boolean;

    }

    export interface Disposable {
        dispose(): PromiseLike<void>;
    }

    export namespace task {
        export function registerTaskRunner(type: string, runner: TaskRunner): Promise<Disposable>;
        /** Needs to be executed when the task is finished */
        export function fireTaskExited(event: TaskExitedEvent): Promise<void>;
        /** Add task subschema */
        export function addTaskSubschema(schema: TaskJSONSchema): Promise<void>;

        /** Set task status */
        export function setTaskStatus(options: TaskStatusOptions): Promise<void>;

        /** Fires when a task starts. */
        export const onDidStartTask: theia.Event<TaskInfo>;
        /** Fires when a task is completed. */
        export const onDidEndTask: theia.Event<TaskExitedEvent>;
    }

    export interface TerminalWidgetIdentifier {
        kind: TaskTerminallKind;
        terminalId: number;
    }

    export enum TaskTerminallKind {
        Task = 'task',
        RemoteTask = 'remote-task'
    }

    export enum TaskStatus {
        Success = 'SUCCESS',
        Error = 'ERROR',
        InProgress = 'IN_PROGRESS',
        Unknown = 'UNKNOWN'
    }

    export interface TaskStatusOptions {
        status: TaskStatus;
        terminalIdentifier: TerminalWidgetIdentifier;
    }

    /** A Task Runner knows how to run a Task of a particular type. */
    export interface TaskRunner {
        /** Runs a task based on the given task configuration. */
        run(taskConfig: TaskConfiguration, ctx?: string): Promise<TaskInfo>;
        /** Terminates a task based on the given info. */
        kill(taskInfo: TaskInfo): Promise<void>;
    }

    /** Runtime information about Task. */
    export interface TaskInfo {
        /** internal unique task id */
        readonly taskId: number,
        /** terminal id. Defined if task is run as a terminal process */
        readonly terminalId?: number,
        /** context that was passed as part of task creation, if any */
        readonly ctx?: string,
        /** task config used for launching a task */
        readonly config: TaskConfiguration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        readonly [key: string]: any;
    }

    export interface TaskExitedEvent {
        readonly taskId?: number;
        readonly ctx?: string;

        readonly code?: number;
        readonly signal?: string;

        readonly config?: TaskConfiguration;

        readonly terminalId?: number;
        readonly processId?: number;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        readonly [key: string]: any;
    }

    export enum TaskScope {
        Global = 0,
        Workspace = 1
    }

    export type TaskConfigurationScope = string | TaskScope.Workspace | TaskScope.Global;

    export interface TaskConfiguration {
        /** A label that uniquely identifies a task configuration per source */
        readonly type: string;
        /** A label that uniquely identifies a task configuration */
        readonly label: string;
        /**
         * For a provided task, it is the string representation of the URI where the task is supposed to run from. It is `undefined` for global tasks.
         * For a configured task, it is workspace URI that task belongs to.
         * This field is not supposed to be used in `tasks.json`
         */
        readonly _scope: TaskConfigurationScope;
        /** Additional task type specific properties. */
        readonly [key: string]: any;
    }

    export interface TaskJSONSchema {
        $id?: string;
        type?: string | string[];
        required?: string[];
        properties?: { [key: string]: any };
        additionalProperties?: boolean
    }

    export namespace user {
        export function getCurrentUser(): Promise<User>;
        export function getUserPreferences(): Promise<Preferences>;
        export function getUserPreferences(filter: string | undefined): Promise<Preferences>;
        export function updateUserPreferences(update: Preferences): Promise<Preferences>;
        export function replaceUserPreferences(preferences: Preferences): Promise<Preferences>;
        export function deleteUserPreferences(): Promise<void>;
        export function deleteUserPreferences(list: string[] | undefined): Promise<void>;
    }

    export interface User {
        id: string;
        name: string
    }

    export interface Preferences {
        [key: string]: string;
    }

    export interface Logo {
        dark: string,
        light: string
    }

    export interface Welcome {
        title: string | undefined;
        links: string[] | undefined;
    }

    export interface Link {
        name: string;
        url: string;
    }

    export interface LinkMap {
        [tag: string]: Link;
    }

    export namespace product {
        export let icon: string;
        export let logo: string | Logo;
        export let name: string;
        export let welcome: Welcome | undefined;
        export let links: LinkMap;
    }

    export namespace languages {
        export namespace test {
            export function completion(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                context: theia.CompletionContext,
                token: theia.CancellationToken
            ): Promise<theia.CompletionList | undefined>;
            export function implementation(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                token: theia.CancellationToken
            ): Promise<theia.Definition | theia.DefinitionLink[] | undefined>;
            export function typeDefinition(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                token: theia.CancellationToken
            ): Promise<theia.Definition | theia.DefinitionLink[] | undefined>;
            export function definition(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                token: theia.CancellationToken
            ): Promise<theia.Definition | theia.DefinitionLink[] | undefined>;
            export function declaration(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                token: theia.CancellationToken
            ): Promise<theia.Definition | theia.DefinitionLink[] | undefined>;
            export function references(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                context: theia.ReferenceContext,
                token: theia.CancellationToken
            ): Promise<theia.Location[] | undefined>;
            export function signatureHelp(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                context: theia.SignatureHelpContext,
                token: theia.CancellationToken
            ): Promise<theia.SignatureHelp | undefined>;
            export function hover(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                token: theia.CancellationToken
            ): Promise<theia.Hover | undefined>;
            export function documentHighlights(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                token: theia.CancellationToken
            ): Promise<theia.DocumentHighlight[] | undefined>;
            export function documentFormattingEdits(
                pluginID: string,
                resource: theia.Uri,
                options: theia.FormattingOptions,
                token: theia.CancellationToken
            ): Promise<theia.TextEdit[] | undefined>;
            export function documentRangeFormattingEdits(
                pluginID: string,
                resource: theia.Uri,
                range: theia.Range,
                options: theia.FormattingOptions,
                token: theia.CancellationToken
            ): Promise<theia.TextEdit[] | undefined>;
            export function onTypeFormattingEdits(
                pluginID: string,
                resource: theia.Uri,
                position: theia.Position,
                ch: string,
                options: theia.FormattingOptions,
                token: theia.CancellationToken
            ): Promise<theia.TextEdit[] | undefined>;
            export function documentLinks(
                pluginID: string,
                resource: theia.Uri,
                token: theia.CancellationToken
            ): Promise<theia.DocumentLink[] | undefined>;
            export function codeLenses(
                pluginID: string,
                resource: theia.Uri,
                token: theia.CancellationToken
            ): Promise<theia.CodeLens[] | undefined>;
            export function codeActions(
                pluginID: string,
                resource: theia.Uri,
                rangeOrSelection: theia.Range | theia.Selection,
                context: theia.CodeActionContext,
                token: theia.CancellationToken
            ): Promise<theia.CodeAction[] | undefined>;
            export function documentSymbols(
                pluginID: string,
                resource: theia.Uri,
                token: theia.CancellationToken
            ): Promise<theia.DocumentSymbol[] | undefined>;
            export function workspaceSymbols(
                pluginID: string,
                query: string,
                token: theia.CancellationToken
            ): Promise<theia.SymbolInformation[]>;
            export function foldingRange(
                pluginID: string,
                resource: theia.Uri,
                context: theia.FoldingContext,
                token: theia.CancellationToken
            ): Promise<theia.FoldingRange[] | undefined>;
            export function documentColors(
                pluginID: string,
                resource: theia.Uri,
                token: theia.CancellationToken
            ): Promise<theia.ColorInformation[]>;
            export function renameEdits(
                pluginID: string, 
                resource: theia.Uri, 
                position: theia.Position, 
                newName: string, 
                token: theia.CancellationToken
            ): Promise<theia.WorkspaceEdit | undefined>;
        }
    }
  /**
   * Namespace to communicate with Kubernetes API.
   */
  export namespace k8s {
    /** Sends a raw query to the cluster. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function sendRawQuery(requestURL: string, opts: any): Promise<K8SRawResponse>;
  }

  export interface K8SRawResponse {
    statusCode: number;
    data: string;
    error: string;
  }
}
