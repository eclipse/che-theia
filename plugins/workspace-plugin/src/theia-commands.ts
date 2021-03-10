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
import * as fileuri from './file-uri';
import * as fs from 'fs-extra';
import * as git from './git';
import * as os from 'os';
import * as path from 'path';
import * as ssh from './ssh';
import * as theia from '@theia/plugin';

import { che as cheApi } from '@eclipse-che/api';
import { execute } from './exec';
import { getCertificate } from './ca-cert';

const CHE_TASK_TYPE = 'che';

/**
 * Enumeration ID's of ide actions.
 */
export enum ActionId {
  OPEN_FILE = 'openFile',
  RUN_COMMAND = 'runCommand',
}

function isDevfileProjectConfig(
  project: cheApi.workspace.ProjectConfig | cheApi.workspace.devfile.Project
): project is cheApi.workspace.devfile.Project {
  return (
    !!project.name &&
    !!project.source &&
    !!project.source.type &&
    !!project.source.location &&
    !(project.source as { [index: string]: string })['parameters']
  );
}

export interface TheiaImportCommand {
  /** @returns the path to the imported project */
  execute(): Promise<string>;
}

export function buildProjectImportCommand(
  project: cheApi.workspace.ProjectConfig | cheApi.workspace.devfile.Project,
  projectsRoot: string
): TheiaImportCommand | undefined {
  if (!project.source) {
    return;
  }

  switch (project.source.type) {
    case 'git':
    case 'github':
      return new TheiaGitCloneCommand(project, projectsRoot);
    case 'zip':
      return new TheiaImportZipCommand(project, projectsRoot);
    default:
      const message = `Project type "${project.source.type}" is not supported.`;
      theia.window.showWarningMessage(message);
      console.warn(message);
      return;
  }
}

let output: theia.OutputChannel;

export class TheiaGitCloneCommand implements TheiaImportCommand {
  private projectName: string | undefined;
  private locationURI: string;
  private projectPath: string;
  private checkoutBranch?: string | undefined;
  private checkoutTag?: string | undefined;
  private checkoutStartPoint?: string | undefined;
  private checkoutCommitId?: string | undefined;
  private sparseCheckoutDir: string | undefined;
  private projectsRoot: string;

  constructor(project: cheApi.workspace.ProjectConfig | cheApi.workspace.devfile.Project, projectsRoot: string) {
    if (isDevfileProjectConfig(project)) {
      const source = project.source;
      if (!source || !source.location) {
        throw new Error('Source location is not defined for "' + this.projectName + '" project.');
      }

      this.projectName = project.name;
      this.locationURI = source.location;
      this.projectPath = project.clonePath
        ? path.join(projectsRoot, project.clonePath)
        : path.join(projectsRoot, project.name!);
      this.checkoutBranch = source.branch;
      this.checkoutStartPoint = source.startPoint;
      this.checkoutTag = source.tag;
      this.checkoutCommitId = source.commitId;
      this.sparseCheckoutDir = source.sparseCheckoutDir;
    } else {
      // legacy project config
      if (!project.source || !project.source.parameters) {
        throw new Error('Project with name "' + this.projectName + '" is not defined correctly.');
      }
      const parameters = project.source.parameters;

      this.projectName = project.name;
      this.locationURI = project.source.location!;
      this.projectPath = projectsRoot + project.path;
      this.checkoutBranch = parameters['branch'];
      this.checkoutStartPoint = parameters['startPoint'];
      this.checkoutTag = project.source.parameters['tag'];
      this.checkoutCommitId = project.source.parameters['commitId'];
      this.sparseCheckoutDir = project.source.parameters['keepDir'];
    }

    this.projectsRoot = projectsRoot;
  }

  clone(): PromiseLike<string> {
    return theia.window.withProgress(
      {
        location: theia.ProgressLocation.Notification,
        title: `Cloning ${this.locationURI} ...`,
      },
      (progress, token) => {
        if (this.sparseCheckoutDir) {
          return this.gitSparseCheckout(progress, token);
        } else {
          return this.gitClone(progress, token);
        }
      }
    );
  }

  async execute(): Promise<string> {
    if (!git.isSecureGitURI(this.locationURI)) {
      // clone using regular URI
      return this.clone();
    }

    // clone using SSH URI
    let latestError: string | undefined;
    while (true) {
      // test secure login
      try {
        await git.testSecureLogin(this.locationURI);
        // exit the loop when successfull login
        break;
      } catch (error) {
        // let out: theia.OutputChannel = theia.window.createOutputChannel('GIT clone');
        if (!output) {
          output = theia.window.createOutputChannel('GIT');
        }

        output.show(true);
        output.appendLine(error.message);

        latestError = git.getErrorReason(error.message);
      }

      // unable to login
      // Give the user possible actions
      // - retry the login
      // - show SSH options

      const RETRY = 'Retry';
      const ADD_KEY_TO_GITHUB = 'Add Key To GitHub';
      const CONFIGURE_SSH = 'Configure SSH';

      let message = `Failure to clone git project ${this.locationURI}`;
      if (latestError) {
        message += ` ${latestError}`;
      }

      const isSecureGitHubURI = git.isSecureGitHubURI(this.locationURI);
      const buttons = isSecureGitHubURI ? [RETRY, ADD_KEY_TO_GITHUB, CONFIGURE_SSH] : [RETRY, CONFIGURE_SSH];
      const action = await theia.window.showWarningMessage(message, ...buttons);
      if (action === RETRY) {
        // Retry Secure login
        // Do nothing, just continue the loop
        continue;
      } else if (action === ADD_KEY_TO_GITHUB) {
        await ssh.addKeyToGitHub();
        continue;
      } else if (action === CONFIGURE_SSH) {
        await ssh.configure(isSecureGitHubURI);
        continue;
      } else {
        // It seems user closed the popup.
        // Ask the user to retry cloning the project.
        const SKIP = 'Skip';
        const TRY_AGAIN = 'Try Again';
        const tryAgain = await theia.window.showWarningMessage(
          `Cloning of ${this.locationURI} will be skipped`,
          SKIP,
          TRY_AGAIN
        );
        if (tryAgain === TRY_AGAIN) {
          // continue the loop to try again
          continue;
        }
        // skip
        return Promise.reject(new Error(message));
      }

      break;
    }

    return this.clone();
  }

  // Clones git repository
  private async gitClone(
    progress: theia.Progress<{ message?: string; increment?: number }>,
    token: theia.CancellationToken
  ): Promise<string> {
    const args: string[] = ['clone', this.locationURI, this.projectPath];
    if (this.checkoutBranch) {
      args.push('--branch');
      args.push(this.checkoutBranch);
    }

    try {
      await git.execGit(this.projectsRoot, ...args);
      // Figure out what to reset to.
      // The priority order is startPoint > tag > commitId

      const treeish = this.checkoutStartPoint
        ? this.checkoutStartPoint
        : this.checkoutTag
        ? this.checkoutTag
        : this.checkoutCommitId;

      const branch = this.checkoutBranch ? this.checkoutBranch : 'default branch';
      const messageStart = `Project ${this.locationURI} cloned to ${this.projectPath} and checked out ${branch}`;

      if (treeish) {
        git.execGit(this.projectPath, 'reset', '--hard', treeish).then(
          _ => {
            theia.window.showInformationMessage(`${messageStart} which has been reset to ${treeish}.`);
          },
          e => {
            theia.window.showErrorMessage(`${messageStart} but resetting to ${treeish} failed with ${e.message}.`);
            console.log(
              `Couldn't reset to ${treeish} of ${this.projectPath} cloned from ${this.locationURI} and checked out to ${branch}.`,
              e
            );
          }
        );
      } else {
        theia.window.showInformationMessage(`${messageStart}.`);
      }
      return this.projectPath;
    } catch (e) {
      theia.window.showErrorMessage(`Couldn't clone ${this.locationURI}: ${e.message}`);
      console.log(`Couldn't clone ${this.locationURI}`, e);
      throw new Error(e);
    }
  }

  // Gets only specified directory from given repository
  private async gitSparseCheckout(
    progress: theia.Progress<{ message?: string; increment?: number }>,
    token: theia.CancellationToken
  ): Promise<string> {
    if (!this.sparseCheckoutDir) {
      throw new Error('Parameter "sparseCheckoutDir" is not set for "' + this.projectName + '" project.');
    }

    const commitReference = this.checkoutStartPoint
      ? this.checkoutStartPoint
      : this.checkoutTag
      ? this.checkoutTag
      : this.checkoutCommitId
      ? this.checkoutCommitId
      : this.checkoutBranch
      ? this.checkoutBranch
      : 'master';
    await fs.ensureDir(this.projectPath);

    await git.sparseCheckout(this.projectPath, this.locationURI, this.sparseCheckoutDir, commitReference);

    theia.window.showInformationMessage(
      `Sources by template ${this.sparseCheckoutDir} of ${this.locationURI} was cloned to ${this.projectPath}.`
    );
    return this.projectPath;
  }
}

export class TheiaImportZipCommand implements TheiaImportCommand {
  private locationURI: string | undefined;
  private projectDir: string;
  private tmpDir: string;
  private zipfile: string;
  private zipfilePath: string;

  constructor(project: cheApi.workspace.ProjectConfig | cheApi.workspace.devfile.Project, projectsRoot: string) {
    if (isDevfileProjectConfig(project)) {
      const source = project.source;

      this.locationURI = source!.location;
      this.projectDir = path.join(projectsRoot, project.name!);
      this.tmpDir = fs.mkdtempSync(path.join(`${os.tmpdir()}${path.sep}`, 'workspace-plugin-'));
      this.zipfile = `${project.name}.zip`;
      this.zipfilePath = path.join(this.tmpDir, this.zipfile);
    } else {
      // legacy project config
      theia.window.showErrorMessage('Legacy workspace config is not supported. Please use devfile instead.');
    }
  }

  async execute(): Promise<string> {
    const importZip = async (
      progress: theia.Progress<{ message?: string; increment?: number }>,
      token: theia.CancellationToken
    ): Promise<string> => {
      try {
        // download
        const curlArgs = ['-sSL', '--output', this.zipfilePath];

        // with certificate
        const cert = await getCertificate;
        if (cert) {
          curlArgs.push('--cacert', cert);
        }

        curlArgs.push(this.locationURI!);
        await execute('curl', curlArgs);

        // expand
        fs.mkdirSync(this.projectDir);
        const unzipArgs = ['-q', '-n', '-d', this.projectDir, this.zipfilePath];
        await execute('unzip', unzipArgs);

        // clean
        fs.unlinkSync(this.zipfilePath);
        const zipfileParentDir = path.resolve(this.zipfilePath, '..');
        if (zipfileParentDir.indexOf(os.tmpdir() + path.sep) === 0) {
          fs.rmdirSync(zipfileParentDir);
        }
        return this.projectDir;
      } catch (e) {
        theia.window.showErrorMessage(`Couldn't import ${this.locationURI}: ${e.message}`);
        console.error(`Couldn't import ${this.locationURI}`, e);
        throw new Error(e);
      }
    };

    return theia.window.withProgress(
      {
        location: theia.ProgressLocation.Notification,
        title: `Importing ${this.locationURI} ...`,
      },
      (progress, token) => importZip(progress, token)
    );
  }
}

export class TheiaCommand {
  constructor(
    protected readonly id: string,
    protected readonly properties?: {
      name?: string;
      file?: string;
      greetingTitle?: string;
      greetingContentUrl?: string;
    }
  ) {}

  execute(): PromiseLike<void> {
    if (this.id === ActionId.OPEN_FILE) {
      if (this.properties && this.properties.file) {
        const fileLocation = fileuri.convertToFileURI(this.properties.file);
        return theia.commands.executeCommand('file-search.openFile', fileLocation).then(
          () => {},
          e => {
            theia.window.showErrorMessage(`Could not open file: ${e.message}`);
            console.log('Could not open file ', e);
          }
        );
      }
    }

    if (this.id === ActionId.RUN_COMMAND) {
      if (this.properties) {
        return theia.commands
          .executeCommand('task:run', CHE_TASK_TYPE, this.properties.name, che.TaskScope.Global)
          .then(
            () => {
              theia.window.showInformationMessage('Executed che command succesfully');
            },
            e => {
              theia.window.showErrorMessage(`Could not execute Che command: ${e.message}`);
              console.log('Could not execute Che command', e);
            }
          );
      }
    }

    return new Promise(() => {
      console.error('action nor openfile nor run command');
    });
  }
}
