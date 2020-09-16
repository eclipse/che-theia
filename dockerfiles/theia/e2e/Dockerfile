# Copyright (c) 2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

# Use upstream image
FROM ${BUILD_ORGANIZATION}/${BUILD_PARENT_IMAGE}:${BUILD_TAG} as theia
FROM cypress/browsers:node10.16.3-chrome80-ff73

USER root
ENV NOCDN=true

RUN apt-get update && \
    apt-get install -y libx11-dev libxkbfile-dev sudo iproute2
CMD /root/docker-run.sh
RUN yarn global add typescript@3.5.3 node-gyp && node-gyp install

# Add cypress scripts and grab dependencies
COPY src /projects/
RUN cd /projects && yarn

# Add tests
ADD cypress /projects/cypress/

COPY --from=theia /home/theia /home/theia
COPY --from=theia /entrypoint.sh /entrypoint.sh
RUN find /home/theia/ -name "binding.gyp" |  xargs -i sh -c 'cd $(dirname {}) && node-gyp rebuild'

USER theia
CMD /projects/docker-run.sh
