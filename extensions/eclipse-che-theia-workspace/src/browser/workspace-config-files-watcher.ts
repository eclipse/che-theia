/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as jsYaml from 'js-yaml';

import { FileChangeType, FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from 'inversify';

import { ChePluginManager } from '@eclipse-che/theia-plugin-ext/lib/browser/plugin/che-plugin-manager';
import { DevfileService } from '@eclipse-che/theia-remote-api/lib/common/devfile-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MessageService } from '@theia/core/lib/common/message-service';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';

import debounce = require('lodash.debounce');

/**
 * Abstract watcher allows to track the changes in the project-specific configuration files.
 * A concrete implementation can handle the changes in a specific way.
 */
@injectable()
export abstract class AbstractFileWatcher implements FrontendApplicationContribution {
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  /** File name to watch, e.g. '.vscode/extensions.json'. */
  protected abstract fileName: string;

  /**
   * Called when the frontend application is started.
   */
  async onStart(app: FrontendApplication): Promise<void> {
    this.trackFilesInRoots();
    this.workspaceService.onWorkspaceChanged(() => this.trackFilesInRoots());
  }

  private async trackFilesInRoots(): Promise<void> {
    (await this.workspaceService.roots).forEach(root => {
      const fileURI = root.resource.resolve(this.fileName);
      this.fileService.watch(fileURI);
      const onFileChange = async (event: FileChangesEvent) => {
        if (event.contains(fileURI, FileChangeType.ADDED)) {
          this.handleChange(fileURI, FileChangeType.ADDED);
        } else if (event.contains(fileURI, FileChangeType.UPDATED)) {
          this.handleChange(fileURI, FileChangeType.UPDATED);
        }
      };
      this.fileService.onDidFilesChange(debounce(onFileChange, 1000));
    });
  }

  /**
   * Allows an implementor to handle a file change.
   *
   * @param fileURI an URI of the modified file
   * @param changeType file change type
   */
  protected abstract handleChange(fileURI: URI, changeType: FileChangeType): void;
}

@injectable()
export class DevfileWatcher extends AbstractFileWatcher {
  protected fileName = 'devfile.yaml';

  @inject(DevfileService)
  protected readonly devfileService: DevfileService;

  @inject(ChePluginManager)
  protected readonly chePluginManager: ChePluginManager;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  protected async handleChange(fileURI: URI, changeType: FileChangeType): Promise<void> {
    const message =
      changeType === FileChangeType.ADDED
        ? `A Devfile is found in ${fileURI}. Do you want to update your Workspace?`
        : 'Do you want to update your Workspace with the changed Devfile?';
    const answer = await this.messageService.info(message, 'Yes', 'No');
    if (answer === 'Yes') {
      this.updateWorkspaceWithDevfile(fileURI);
    }
  }

  /**
   * Updates the workspace with the given Devfile.
   *
   * @param devfileURI URI of the Devfile to update the Workspace with
   */
  protected async updateWorkspaceWithDevfile(devfileURI: URI): Promise<void> {
    const content = await this.fileService.readFile(devfileURI);
    const devfile = jsYaml.load(content.value.toString());
    await this.devfileService.updateDevfile(devfile);
    await this.chePluginManager.restartWorkspace();
  }
}

@injectable()
export class ExtensionsJsonWatcher extends AbstractFileWatcher {
  protected fileName = '.vscode/extensions.json';

  @inject(ChePluginManager)
  protected readonly chePluginManager: ChePluginManager;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  protected async handleChange(fileURI: URI, changeType: FileChangeType): Promise<void> {
    const message =
      changeType === FileChangeType.ADDED
        ? `An extensions list is found in ${fileURI}. Do you want to update your Workspace with these extensions?`
        : 'Do you want to update your Workspace with the changed "extensions.json"?';
    const answer = await this.messageService.info(message, 'Yes', 'No');
    if (answer === 'Yes') {
      await this.chePluginManager.restartWorkspace();
    }
  }
}

@injectable()
export class PluginsYamlWatcher extends AbstractFileWatcher {
  protected fileName = '.che/che-theia-plugins.yaml';

  @inject(ChePluginManager)
  protected readonly chePluginManager: ChePluginManager;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  protected async handleChange(fileURI: URI, changeType: FileChangeType): Promise<void> {
    const message =
      changeType === FileChangeType.ADDED
        ? `A plug-ins list is found in ${fileURI}. Do you want to update your Workspace with these plug-ins?`
        : 'Do you want to update your Workspace with the changed "che-theia-plugins.yaml"?';
    const answer = await this.messageService.info(message, 'Yes', 'No');
    if (answer === 'Yes') {
      await this.chePluginManager.restartWorkspace();
    }
  }
}

@injectable()
export class TasksJsonWatcher extends AbstractFileWatcher {
  protected fileName = '.vscode/tasks.json';

  @inject(MessageService)
  protected readonly messageService: MessageService;

  protected async handleChange(fileURI: URI, changeType: FileChangeType): Promise<void> {
    const answer = await this.messageService.info(
      'Do you want to update your Workspace with the "tasks.json" changes?',
      'Yes',
      'No'
    );
    if (answer === 'Yes') {
      // TODO: set the tasks to the project's attributes
    }
  }
}
