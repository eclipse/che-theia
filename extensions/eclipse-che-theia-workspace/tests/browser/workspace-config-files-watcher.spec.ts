/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import 'reflect-metadata';

import { AbstractFileWatcher, DevfileWatcher } from '../../src/browser/workspace-config-files-watcher';

import { ChePluginManager } from '@eclipse-che/theia-plugin-ext/lib/browser/plugin/che-plugin-manager';
import { Container } from '@theia/core/shared/inversify';
import { DevfileService } from '@eclipse-che/theia-remote-api/lib/common/devfile-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { FrontendApplication } from '@theia/core/lib/browser';
import { MessageService } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceService } from '@theia/workspace/lib/browser';

describe('Test workspace config files watchers', function () {
  let container: Container;

  let fileService: FileService;
  let workspaceService: WorkspaceService;

  const fileServiceWatchMethod = jest.fn();
  const workspaceServiceOnWorkspaceChangedMethod = jest.fn();

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();

    container = new Container();

    fileService = ({
      watch: fileServiceWatchMethod,
    } as unknown) as FileService;

    workspaceService = ({
      onWorkspaceChanged: workspaceServiceOnWorkspaceChangedMethod,
    } as unknown) as WorkspaceService;

    container.bind(FileService).toConstantValue(fileService);
    container.bind(WorkspaceService).toConstantValue(workspaceService);
  });

  describe('Test DevfileWatcher', function () {
    let devfileWatcher: AbstractFileWatcher;

    const devfileServiceUpdateDevfileMethod = jest.fn();
    const chePluginManagerRestartWorkspaceMethod = jest.fn();
    const messageServiceInfoMethod = jest.fn();

    beforeEach(() => {
      const devfileService = ({
        updateDevfile: devfileServiceUpdateDevfileMethod,
      } as unknown) as DevfileService;

      const chePluginManager = ({
        restartWorkspace: chePluginManagerRestartWorkspaceMethod,
      } as unknown) as ChePluginManager;

      const messageService = ({
        info: messageServiceInfoMethod,
      } as unknown) as MessageService;

      container.bind(DevfileService).toConstantValue(devfileService);
      container.bind(ChePluginManager).toConstantValue(chePluginManager);
      container.bind(MessageService).toConstantValue(messageService);
      container.bind(DevfileWatcher).toSelf().inSingletonScope();
      devfileWatcher = container.get(DevfileWatcher);
    });

    test('shouldWatch', async () => {
      const resolveFn = jest.fn();
      const resource = ({
        resolve: resolveFn,
      } as unknown) as URI;
      resolveFn.mockReturnValue(resource);

      const roots: FileStat[] = [
        {
          name: 'testFile',
          isDirectory: false,
          isFile: true,
          isSymbolicLink: false,
          resource: resource,
        },
      ];

      Object.defineProperty(workspaceService, 'roots', {
        get: jest.fn(() => roots),
      });

      await devfileWatcher.onStart({} as FrontendApplication);

      expect(fileServiceWatchMethod.mock.calls.length).toEqual(1);
      expect(fileServiceWatchMethod).toHaveBeenCalledWith(resource);
    });
  });
});
