/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import * as theia from '@theia/plugin';

import { inject, injectable } from 'inversify';

import { Deferred } from '../util/deferred';
import { DevfileHandler } from '../devfile/devfile-handler';
import { FeaturedFetcher } from '../fetch/featured-fetcher';
import { FeaturedPluginStrategy } from '../strategy/featured-plugin-strategy';
import { FindFileExtensions } from '../find/find-file-extensions';
import { RecommendPluginOpenFileStrategy } from '../strategy/recommend-plugin-open-file-strategy';
import { RecommendationsPluginAnalysis } from './recommendations-plugin-analysis';
import { VSCodeCurrentExtensions } from '../analyzer/vscode-current-extensions';
import { WorkspaceHandler } from '../workspace/workspace-handler';

/**
 * Plug-in that is suggesting or adding by default recommendations
 * usecases:
 *  - empty workspaces:
 *     - after initial clone on empty workspaces
 *        - set by default if no existing plug-ins
 *        - suggest if existing plug-ins
 *     - check .vscode/extensions.json file
 *  - when opening new files
 */
@injectable()
export class RecommendationsPlugin {
  @inject(FindFileExtensions)
  private findFileExtensions: FindFileExtensions;

  @inject(FeaturedFetcher)
  private featuredFecher: FeaturedFetcher;

  @inject(VSCodeCurrentExtensions)
  private vsCodeCurrentPlugins: VSCodeCurrentExtensions;

  @inject(DevfileHandler)
  private devfileHandler: DevfileHandler;

  @inject(WorkspaceHandler)
  private workspaceHandler: WorkspaceHandler;

  @inject(FeaturedPluginStrategy)
  private featuredPluginStrategy: FeaturedPluginStrategy;

  @inject(RecommendPluginOpenFileStrategy)
  private recommendPluginOpenFileStrategy: RecommendPluginOpenFileStrategy;

  private deferredSetupPromise: Promise<RecommendationsPluginAnalysis>;

  private outputChannel: theia.OutputChannel;

  constructor() {
    this.outputChannel = theia.window.createOutputChannel('Recommendations Plug-in');
  }

  async start(): Promise<void> {
    const disabled = await this.devfileHandler.isRecommendedExtensionsDisabled();
    // if recommendations are disabled, stop there
    if (disabled) {
      this.outputChannel.appendLine('Recommendations Plugin is disabled');
      return;
    }
    this.outputChannel.appendLine('Enabling recommendations Plugin');
    return this.enableRecommendationsPlugin();
  }

  async enableRecommendationsPlugin(): Promise<void> {
    // Bring featured recommendations after projects are cloned
    const workspacePlugin = theia.plugins.getPlugin('@eclipse-che.workspace-plugin');
    if (workspacePlugin && workspacePlugin.exports && workspacePlugin.exports.onDidCloneSources) {
      workspacePlugin.exports.onDidCloneSources(() => this.afterClone());
    }

    // Perform tasks in parallel
    const deferredSetup = new Deferred<RecommendationsPluginAnalysis>();
    this.deferredSetupPromise = deferredSetup.promise;

    // enable the recommendation on file being opened if no plug-in is matching this file extension
    const enableRecommendationsOnFiles = await this.devfileHandler.isRecommendedExtensionsOpenFileEnabled();
    if (enableRecommendationsOnFiles) {
      this.outputChannel.appendLine('Enabling recommendations on opening files');
      this.enableRecommendationsPluginWhenOpeningFiles();
    }

    // fetch all featured plug-ins from plug-in registry.
    const featuredListPromise = this.featuredFecher.fetch();
    // grab all plug-ins and languages
    const vsCodeCurrentPluginsPromise = this.vsCodeCurrentPlugins.analyze();
    // Grab plug-ins used in the devfile
    const devfileHasPluginsPromise = this.devfileHandler.hasPlugins();

    // wait that promises are resolved before resolving the defered
    const [featuredList, vsCodeCurrentPluginsLanguages, devfileHasPlugins] = await Promise.all([
      featuredListPromise,
      vsCodeCurrentPluginsPromise,
      devfileHasPluginsPromise,
    ]);

    this.outputChannel.appendLine('featuredList=' + JSON.stringify(featuredList, undefined, 2));
    this.outputChannel.appendLine(
      'vsCodeCurrentPluginsLanguages.languagesByFileExtensions=' +
        JSON.stringify(Array.from(vsCodeCurrentPluginsLanguages.languagesByFileExtensions.entries()))
    );
    this.outputChannel.appendLine(
      'vsCodeCurrentPluginsLanguages.vscodeExtensionByLanguageId=' +
        JSON.stringify(Array.from(vsCodeCurrentPluginsLanguages.vscodeExtensionByLanguageId.entries()))
    );
    this.outputChannel.appendLine(`devfileHasPlugins=${devfileHasPlugins}`);

    deferredSetup.resolve({
      featuredList,
      vsCodeExtensionsInstalledLanguages: vsCodeCurrentPluginsLanguages,
      devfileHasPlugins,
    });
  }

  // remove the digits on a given string so it will return for example redhat/java if we give redhat/java11
  removeDigits(content: string): string {
    return content.replace(/[0-9]/g, '');
  }

  // called after projects are cloned (like the first import)
  async afterClone(): Promise<void> {
    // current workspaces
    const workspaceFolders = theia.workspace.workspaceFolders || [];
    this.outputChannel.appendLine(
      `Workspace folders after clone: workspaceFolders=${JSON.stringify(workspaceFolders)}`
    );

    // Grab file extensions used in all projects being in the workspace folder (that have been cloned) (with a timeout)
    const extensionsInCheWorkspace = await this.findFileExtensions.find();
    this.outputChannel.appendLine(`extensionsInCheWorkspace=${extensionsInCheWorkspace}`);

    // need to wait all required tasks done when starting the plug-in are finished
    const workspaceAnalysis = await this.deferredSetupPromise;
    this.outputChannel.appendLine(`workspaceAnalysis=${JSON.stringify(workspaceAnalysis, undefined, 2)}`);

    // convert found file extensions to languages that should be enabled
    const featuredPluginStategyRequest = { ...workspaceAnalysis, extensionsInCheWorkspace };
    let featuredPlugins = await this.featuredPluginStrategy.getFeaturedPlugins(featuredPluginStategyRequest);
    this.outputChannel.appendLine(`featuredPlugins=${JSON.stringify(featuredPlugins, undefined, 2)}`);

    // filter out from featured Plugins the plug-ins already installed in the devfile
    const inDevfilePlugins = await this.devfileHandler.getPlugins();
    this.outputChannel.appendLine(`inDevfilePlugins=${inDevfilePlugins}`);

    // here we need to compare without digits (for example if java8 plug-in is installed but we suggest java11 it should match the same plug-in)
    featuredPlugins = featuredPlugins.filter(
      plugin =>
        !inDevfilePlugins.some(inDevVilePlugin => this.removeDigits(inDevVilePlugin) === this.removeDigits(plugin))
    );
    this.outputChannel.appendLine(`filteredFeaturedPlugins=${featuredPlugins}`);

    // do we have plugins in the devfile ?
    if (featuredPlugins.length === 0) {
      this.outputChannel.appendLine('no featured plugins. exiting');
      return;
    }

    // No devfile plug-ins, we add without asking and we prompt to restart the workspace
    if (!workspaceAnalysis.devfileHasPlugins) {
      this.outputChannel.appendLine('no devfile plug-ins. Install plug-ins');
      await this.installPlugins(featuredPlugins);
    } else {
      // users have existing plug-ins meaning that they probably started with a custom devfile, need to suggest and not add
      this.outputChannel.appendLine('existing plug-ins, prompt user to confirm');
      const yesValue = 'Yes';
      const yesNoItems: theia.MessageItem[] = [{ title: yesValue }, { title: 'No' }];
      const msg = `Do you want to install the recommended extensions ${featuredPlugins} for your workspace ?`;
      const installOrNotExtensions = await theia.window.showInformationMessage(msg, ...yesNoItems);
      // only if yes we install extensions
      if (installOrNotExtensions && installOrNotExtensions.title === yesValue) {
        await this.installPlugins(featuredPlugins);
      }
    }
  }

  // install given plug-ins
  async installPlugins(featuredPlugins: string[]): Promise<void> {
    const uniquePlugins = [...new Set(featuredPlugins)];
    try {
      // add plug-ins
      await this.devfileHandler.addPlugins(uniquePlugins);

      // restart the workspace ?
      await this.workspaceHandler.restart(
        `New featured plug-ins ${uniquePlugins} have been added to your workspace to improve the intellisense. Please restart the workspace to see the changes.`
      );
    } catch (error) {
      theia.window.showInformationMessage('Unable to add featured plugins' + error);
    }
  }

  // display recommendation when opening files
  async enableRecommendationsPluginWhenOpeningFiles(): Promise<void> {
    const workspaceAnalysis = await this.deferredSetupPromise;
    theia.workspace.onDidOpenTextDocument(document =>
      this.recommendPluginOpenFileStrategy.onOpenFile(document, workspaceAnalysis)
    );
  }
}
