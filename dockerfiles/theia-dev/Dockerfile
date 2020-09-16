# Copyright (c) 2018-2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

###
# Theia dev Image
#
FROM #{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-image-from.dockerfile}

# Install packages
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/install-dependencies.dockerfile}

# setup yarn (if missing)
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/setup-yarn.dockerfile}

# Add npm global bin directory to the path
ENV HOME=/home/theia-dev \
    PATH=/home/theia-dev/.npm-global/bin:${PATH} \
    # Specify the directory of git (avoid to search at init of Theia)
    USE_LOCAL_GIT=true \
    LOCAL_GIT_DIRECTORY=/usr \
    GIT_EXEC_PATH=/usr/libexec/git-core \
    THEIA_ELECTRON_SKIP_REPLACE_FFMPEG=true \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    YARN_FLAGS=""

# setup extra stuff
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/post-env.dockerfile}

# Define package of the theia generator to use
COPY asset-unpacked-generator ${HOME}/eclipse-che-theia-generator

WORKDIR ${HOME}

# Exposing Theia ports
EXPOSE 3000 3030

# Configure npm and yarn to use home folder for global dependencies
RUN npm config set prefix "${HOME}/.npm-global" && \
    echo "--global-folder \"${HOME}/.yarn-global\"" > ${HOME}/.yarnrc && \
    yarn config set network-timeout 600000 -g && \
    # add eclipse che theia generator
    yarn ${YARN_FLAGS} global add yo generator-code vsce @theia/generator-plugin@0.0.1-1562578105 file:${HOME}/eclipse-che-theia-generator && \
    rm -rf ${HOME}/eclipse-che-theia-generator && \
    # Generate .passwd.template \
    sed -e "s#^theia-dev:x.*#theia-dev:x:\${USER_ID}:\${GROUP_ID}::${HOME}:/bin/bash#g" \
        /etc/passwd > /.passwd.template && \
    sed -e 's#^theia-dev:.*#theia-dev:x:${GROUP_ID}:#g' \
        /etc/group > /.group.template && \
    mkdir /projects && \
    # Change permissions to let any arbitrary user
    for f in "${HOME}" /projects /etc/passwd /etc/group; do \
        echo "Changing permissions on ${f}" && \
        chgrp -R 0 ${f} && \
        chmod -R g+rwX ${f}; \
    done

# post yarn config
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/post-yarn-config.dockerfile}

WORKDIR /projects

COPY src/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

CMD tail -f /dev/null
