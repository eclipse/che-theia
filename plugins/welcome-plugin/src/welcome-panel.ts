/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as che from '@eclipse-che/plugin';
import * as path from 'path';
import * as theia from '@theia/plugin';

import { isWelcomeEnabled } from './devfile';

export const welcomePageViewType = 'WelcomePage';

export class WelcomePanel {
  webviewPanel: theia.WebviewPanel | undefined;

  constructor(private context: theia.PluginContext) {}

  async show(): Promise<void> {
    if (this.webviewPanel) {
      this.webviewPanel.reveal();
      return;
    }

    // Open Welcome tab
    this.webviewPanel = theia.window.createWebviewPanel(
      welcomePageViewType,
      che.product.name,
      { viewColumn: theia.ViewColumn.One, preserveFocus: false },
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          theia.Uri.file(path.join(this.context.extensionPath, 'resources')),
          theia.Uri.file(path.join(this.context.extensionPath, 'node_modules/@fortawesome')),
        ],
      }
    );

    await this.render();

    // Handle messages from the webview
    this.webviewPanel.webview.onDidReceiveMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (message: any) => {
        switch (message.command) {
          case 'alert':
            theia.window.showErrorMessage(message.text);
            return;
          case 'executeCommand':
            theia.commands.executeCommand(message.commandName);
            return;
        }
      },
      undefined,
      this.context.subscriptions
    );

    this.webviewPanel.iconPath = theia.Uri.parse(che.product.icon);

    this.webviewPanel.onDidDispose(() => {
      this.webviewPanel = undefined;
    });
  }

  async render(): Promise<void> {
    if (!this.webviewPanel) {
      return;
    }

    // Local path to main script run in the webview
    const scriptPathOnDisk = theia.Uri.file(path.join(this.context.extensionPath, 'resources', 'welcome-page.js'));
    // And the uri we use to load this script in the webview
    const scriptUri = scriptPathOnDisk.with({ scheme: 'theia-resource' });

    // Local path to main script run in the webview
    const cssPathOnDisk = theia.Uri.file(path.join(this.context.extensionPath, 'resources', 'welcome-page.css'));
    // And the uri we use to load this script in the webview
    const cssUri = cssPathOnDisk.with({ scheme: 'theia-resource' });

    // const welcomePage = new WelcomePage();
    // const rendering = await welcomePage.render();

    const html = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="Content-Security-Policy" content="font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline' 'self';">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link rel="stylesheet" type="text/css" href="${cssUri}">
                        </style>
                        <title>Welcome Page</title>
                    </head>
        
                    <body>
                      ${await this.renderBody()}
                      <script src="${scriptUri}"></script>
                    </body>
                    </html>`;

    this.webviewPanel.webview.html = html;
  }

  private async renderBody(): Promise<string> {
    return `<div class='che-welcome-container'>
            ${await this.renderHeader()}
            <div class='flex-grid'>
                <div class='col'>
                    ${await this.renderStart()}
                </div>
            </div>
            <div class='flex-grid'>
                <div class='col'>
                    ${await this.renderOpen()}
                </div>
            </div>
            <div class='flex-grid'>
                <div class='col'>
                    ${await this.renderSettings()}
                </div>
            </div>
            <div class='flex-grid'>
                <div class='col'>
                    ${await this.renderHelp()}
                </div>
            </div>
            <div class='flex-grid'>
                <div class='col'>
                    ${await this.renderControl()}
                </div>
            </div>
        </div>`;
  }

  private async renderHeader(): Promise<string> {
    const logoDark = typeof che.product.logo === 'object' ? che.product.logo.dark : che.product.logo;
    const logoLight = typeof che.product.logo === 'object' ? che.product.logo.light : che.product.logo;

    const welcome =
      che.product.welcome && che.product.welcome.title
        ? `<span class='che-welcome-header-subtitle'>${che.product.welcome.title}</span>`
        : '';

    return `<div class="che-welcome-header">
            <div class="che-welcome-header-title">
                <div class="image-container">
                    <img style='display: none;' class="product-logo-dark" src=${logoDark} />
                    <img style='display: none;' class="product-logo-light" src=${logoLight} />
                </div>
            </div>
            ${welcome}
        </div>`;
  }

  private async renderStart(): Promise<string> {
    // eslint-disable-next-line max-len
    const newFile = `<div class="che-welcome-command-desc">
                     <a href='#' onClick="executeCommand('file.newFile')">New File...</a>
                     ${await this.renderCommandKeyBinding('file.newFile')}</div>`;

    // eslint-disable-next-line max-len
    const gitClone = `<div class="che-welcome-command-desc">
                      <a href='#' onClick="executeCommand('git.clone')">Git Clone...</a>
                      ${await this.renderCommandKeyBinding('git.clone')}</div>`;

    return `<div class='che-welcome-section'>
            <h3 class='che-welcome-section-header'><i class='fa fa-file'></i>New</h3>
            <div class='che-welcome-action-container'>
                ${newFile}
            </div>
            <div class='che-welcome-action-container'>
                ${gitClone}
            </div>

        </div>`;
  }

  private async renderCommandKeyBinding(commandId: string): Promise<string> {
    const availableKeys = await theia.commands.getKeyBinding(commandId);

    if (availableKeys && availableKeys.length > 0) {
      const keybindingSeperator = /<match>\+<\/match>/g;
      const regex = new RegExp(keybindingSeperator);
      const keyMappings = await Promise.all(
        availableKeys.map(async (keyBinding: theia.CommandKeyBinding) => {
          const updatedKeyBinding = keyBinding.value.replace(regex, '+');
          const keys = updatedKeyBinding.split('+');
          if (keys.length > 0) {
            const rows: string[] = [];

            await Promise.all(
              keys.map(async (key: string) => {
                let updatedKey = key;
                if ((await theia.env.getClientOperatingSystem()) === theia.OperatingSystem.OSX) {
                  if (updatedKey === 'ctrlcmd') {
                    updatedKey = '⌘ cmd';
                  } else if (updatedKey === 'alt') {
                    updatedKey = '⎇ alt';
                  }
                }
                if (updatedKey === 'shift') {
                  updatedKey = '⇧ shift';
                }
                rows.push(`<span class="che-welcome-keybinding-key">${updatedKey}</span>`);
              })
            );
            return `<div class="che-welcome-keybinding" title=${availableKeys[0].value}>${rows.join('+')}</div>`;
          }
        })
      );

      return keyMappings.join(' or ');
    }
    return '';
  }

  private async renderControl(): Promise<string> {
    const label = 'Show this page on workspace startup';

    const checked = await isWelcomeEnabled();

    return `<div class='che-welcome-section'>
        <div class='che-welcome-action-container'>
          <input type="checkbox" id="show_on_startup" name="show_on_startup" ${checked ? 'checked' : ''} 
            onchange="executeCommand(this.checked ? 'welcome:enable' : 'welcome:disable')">
          <label for="show_on_startup">${label}</label>
        </div>
      </div>`;
  }

  private async renderOpen(): Promise<string> {
    // eslint-disable-next-line max-len
    const open = `<div class="che-welcome-command-desc"><a href='#' onClick="executeCommand('workspace:open')">Open Files...</a>${await this.renderCommandKeyBinding(
      'workspace:open'
    )}</div>`;
    // eslint-disable-next-line max-len
    const openCommandPalette = `<div class="che-welcome-command-desc"><a href='#' onClick="executeCommand('workbench.action.showCommands')">Open Command Palette...</a>${await this.renderCommandKeyBinding(
      'workbench.action.showCommands'
    )}</div>`;
    return `<div class='che-welcome-section'>
            <h3 class='che-welcome-section-header'><i class='fa fa-folder-open'></i>Open</h3>
            <div class='che-welcome-action-container'>
                ${open}
            </div>
            <div class='che-welcome-action-container'>
                ${openCommandPalette}
            </div>

        </div>`;
  }

  private async renderSettings(): Promise<string> {
    return `<div class='che-welcome-section'>
            <h3 class='che-welcome-section-header'><i class='fa fa-cog'></i>Settings</h3>
            <div class='che-welcome-action-container'>
                <div class="che-welcome-command-desc">
                    <a href='#' onClick="executeCommand('preferences:open')">Open Preferences</a>${await this.renderCommandKeyBinding(
                      'preferences:open'
                    )}
                </div>
            </div>
            <div class='che-welcome-action-container'>

                <div class="che-welcome-command-desc">
                    <a href='#' onClick="executeCommand('keymaps:open')">Open Keyboard Shortcuts</a>${await this.renderCommandKeyBinding(
                      'keymaps:open'
                    )}
                </div>
            </div>
        </div>`;
  }

  private async renderHelp(): Promise<string> {
    const allLinks = che.product.links;

    let html = '';

    if (che.product.welcome && che.product.welcome.links) {
      const tags = che.product.welcome.links;

      tags.forEach(data => {
        const link = allLinks[data];
        if (link) {
          html += `<div class='che-welcome-action-container'>
                                <a href=${link.url} target='_blank'>${link.name}</a>
                            </div>`;
        }
      });
    } else {
      html = Object.keys(allLinks)
        .map(
          tag =>
            `<div class='che-welcome-action-container'>
                    <a href=${allLinks[tag].url} target='_blank'>${allLinks[tag].name}</a>
                </div>`
        )
        .join('');
    }

    return `<div class='che-welcome-section'>
            <h3 class='che-welcome-section-header'><i class='fa fa-question-circle'></i>Help</h3>
            ${html}
        </div>`;
  }
}
