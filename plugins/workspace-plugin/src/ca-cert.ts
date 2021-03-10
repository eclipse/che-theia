/**********************************************************************
 * Copyright (c) 2019-2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as che from '@eclipse-che/plugin';
import * as fs from 'fs-extra';

const CA_BUNDLE_PATH = '/tmp/ca-bundle.crt';

export const getCertificate = new Promise<string | undefined>(async resolve => {
  const certificates = await che.authority.getCertificates();

  if (certificates) {
    for (const certificate of certificates) {
      await fs.appendFile(CA_BUNDLE_PATH, certificate);
    }

    resolve(CA_BUNDLE_PATH);
  } else {
    resolve(undefined);
  }
});
