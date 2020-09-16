# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

# Use upstream image
FROM ${BUILD_ORGANIZATION}/${BUILD_PREFIX}-theia-dev:${BUILD_TAG}

# Export GITHUB_TOKEN into environment variable
ARG GITHUB_TOKEN=''
ENV GITHUB_TOKEN=$GITHUB_TOKEN

# Just try to build the latest theia with current image
RUN git clone -b 'master' --single-branch --depth 1 https://github.com/eclipse-theia/theia theia

# setup extra step
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/post-clone.dockerfile}

# Unset GITHUB_TOKEN environment variable if it is empty.
# This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# For example, vscode ripgrep downloading is an example of such case.
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi && \
    cd theia && yarn

ADD src/test-entrypoint.sh /test-entrypoint.sh

CMD ["/test-entrypoint.sh"]
