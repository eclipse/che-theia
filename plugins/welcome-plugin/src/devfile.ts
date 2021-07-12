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

export const WELCOME_ENABLED = 'extensions.welcome';

export async function isWelcomeEnabled(): Promise<boolean> {
  const workspace = await che.workspace.getCurrentWorkspace();
  // always has a devfile now
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const devfile = workspace.devfile!;
  const attributes = devfile.attributes || {};
  const welcome = attributes[WELCOME_ENABLED] || 'true';
  return welcome !== 'false';
}

export async function enableWelcome(enable: boolean): Promise<void> {
  const workspace = await che.workspace.getCurrentWorkspace();
  // always has a devfile now
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const devfile = workspace.devfile!;
  devfile.attributes = devfile.attributes || {};
  devfile.attributes[WELCOME_ENABLED] = '' + enable;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await che.workspace.update(workspace.id!, workspace);
}

export async function isMultiroot(): Promise<boolean> {
  const devfile = await che.devfile.get();
  return devfile.metadata?.attributes?.multiRoot !== 'off';
}
