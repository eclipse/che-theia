/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as fs from 'fs-extra';
import * as path from 'path';
import * as theia from '@theia/plugin';

import { isMultiroot } from './devfile';

export class Readme {
  processed: string[] = [];

  constructor(protected context: theia.PluginContext) {}

  async seekAndOpen(): Promise<void> {
    if (await isMultiroot()) {
      this.context.subscriptions.push(
        theia.workspace.onDidChangeWorkspaceFolders(
          event => this.handleReadmeFiles(event.added),
          undefined,
          this.context.subscriptions
        )
      );
    } else {
      const workspacePlugin = theia.plugins.getPlugin('@eclipse-che.workspace-plugin');
      if (workspacePlugin && workspacePlugin.exports) {
        this.context.subscriptions.push(
          workspacePlugin.exports.onDidCloneSources(
            () => this.handleReadmeFiles(),
            undefined,
            this.context.subscriptions
          )
        );
      } else {
        this.handleReadmeFiles();
      }
    }
  }

  async handleReadmeFiles(roots?: theia.WorkspaceFolder[]): Promise<void> {
    roots = roots ? roots : theia.workspace.workspaceFolders;
    if (!roots || roots.length < 1) {
      return;
    }

    for (const root of roots) {
      this.openReadme(root.uri.fsPath);
    }
  }

  async openReadme(projectPath: string): Promise<void> {
    if (this.processed.some(value => value === projectPath)) {
      return;
    }

    this.processed.push(projectPath);

    const readmePath = path.join(projectPath, 'README.md');
    if (await fs.pathExists(projectPath)) {
      const openPath = theia.Uri.parse(`file://${readmePath}?open-handler=code-editor-preview`);
      try {
        const doc = await theia.workspace.openTextDocument(openPath);
        if (doc) {
          await theia.window.showTextDocument(doc);
        }
      } catch (err) {
        // Ignore the error.
        // `theia.window.showTextDocument` throws an error with message `Failed to show text document`
        // But works as expected.
        // It's because `?open-handler=code-editor-preview` was added at the end of the URI
        // to open preview instead of the editor
      }
    }
  }
}
