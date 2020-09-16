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
# Builder Image
#
FROM #{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-from.dockerfile}

WORKDIR ${HOME}

# Export GITHUB_TOKEN into environment variable
ARG GITHUB_TOKEN=''
ENV GITHUB_TOKEN=$GITHUB_TOKEN

ARG THEIA_GITHUB_REPO=eclipse-theia/theia

# Define upstream version of theia to use
ARG THEIA_VERSION=master

ARG THEIA_COMMIT_SHA=''

ENV NODE_OPTIONS="--max-old-space-size=4096"

#{IF:DO_REMOTE_CHECK}
# Invalidate cache if any source code has changed
ADD https://${GITHUB_TOKEN}:x-oauth-basic@api.github.com/repos/${THEIA_GITHUB_REPO}/git/${GIT_REF} /tmp/branch_info.json
#ENDIF

# Clone theia
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-clone-theia.dockerfile}
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-post-clone.dockerfile}

# Patch theia
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-patch-theia.dockerfile}
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-post-patch.dockerfile}

# Generate che-theia
ARG CDN_PREFIX=""
ARG MONACO_CDN_PREFIX=""
WORKDIR ${HOME}/theia-source-code

# Add che-theia repository content
COPY asset-che-theia.tar.gz /tmp/asset-che-theia.tar.gz
RUN mkdir -p ${HOME}/theia-source-code/che-theia/ && tar xzf /tmp/asset-che-theia.tar.gz -C ${HOME}/theia-source-code/che-theia/ && rm /tmp/asset-che-theia.tar.gz

# run che-theia init command and alias che-theia repository to use local sources insted of cloning
RUN che-theia init -c ${HOME}/theia-source-code/che-theia/che-theia-init-sources.yml --alias https://github.com/eclipse/che-theia=${HOME}/theia-source-code/che-theia

# cleanup theia folders that we don't need to compile
RUN rm -rf ${HOME}/theia-source-code/examples/browser && \
    rm -rf ${HOME}/theia-source-code/examples/electron && \
    rm -rf ${HOME}/theia-source-code/packages/cpp && \
    rm -rf ${HOME}/theia-source-code/packages/git && \
    rm -rf ${HOME}/theia-source-code/packages/java && \
    rm -rf ${HOME}/theia-source-code/packages/java-debug && \
    rm -rf ${HOME}/theia-source-code/packages/python && \
    rm -rf ${HOME}/theia-source-code/packages/typescript && \
    # Allow the usage of ELECTRON_SKIP_BINARY_DOWNLOAD=1 by using a more recent version of electron \
    sed -i 's|  "resolutions": {|  "resolutions": {\n    "**/electron": "7.0.0",|' ${HOME}/theia-source-code/package.json && \
    # remove all electron-browser module to not compile them
    find . -name "electron-browser"  | xargs rm -rf {} && \
    find . -name "*-electron-module.ts"  | xargs rm -rf {} && \
    rm -rf ${HOME}/theia-source-code/dev-packages/electron/native && \
    echo "" > ${HOME}/theia-source-code/dev-packages/electron/scripts/post-install.js && \
    # Remove linter/formatters of theia
    sed -i 's|concurrently -n compile,lint -c blue,green \\"theiaext compile\\" \\"theiaext lint\\"|concurrently -n compile -c blue \\"theiaext compile\\"|' ${HOME}/theia-source-code/dev-packages/ext-scripts/package.json && \
    # Remove external configs removed
    sed -i -n '/.*packages\/cpp/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/git/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/java/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/java-debug/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/python/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*packages\/typescript/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*examples\/api-samples/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    sed -i -n '/.*examples\/electron/{N;s/.*//;x;d;};x;p;${x;p;}' ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    # change update goal to be the eclipse che assembly
    sed -i 's|.*"prepare:build".*|    \"prepare:build\"\: \"yarn build \&\& lerna run build\", |' ${HOME}/theia-source-code/package.json && \
    cat ${HOME}/theia-source-code/configs/root-compilation.tsconfig.json && \
    find ${HOME}/theia-source-code/che-theia -name "package.json" | xargs sed -i 's|concurrently -n \\"format,lint,compile\\" -c \\"red,green,blue\\" \\"yarn format\\" \\"yarn lint\\" \\"yarn compile\\"|concurrently -n \\"compile\\" -c \\"blue\\" \\"yarn compile\\"|' && \
    # disable linters of che-theia as it's already done before
    find ${HOME}/theia-source-code/che-theia -name "package.json" | xargs sed -i 's|.*"lint:fix".*|    \"lint:fix\"\: \"echo skip linter\", |' && \
    find ${HOME}/theia-source-code/che-theia -name "package.json" | xargs sed -i 's|.*"lint".*|    \"lint\"\: \"echo skip linter\", |'

RUN che-theia cdn --theia="${CDN_PREFIX}" --monaco="${MONACO_CDN_PREFIX}"

# Compile Theia
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-before-compile.dockerfile}

# Unset GITHUB_TOKEN environment variable if it is empty.
# This is needed for some tools which use this variable and will fail with 401 Unauthorized error if it is invalid.
# For example, vscode ripgrep downloading is an example of such case.
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi && \
    yarn ${YARN_FLAGS}

# Run into production mode
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/builder-before-production.dockerfile}
RUN che-theia production

# Compile plugins
RUN if [ -z $GITHUB_TOKEN ]; then unset GITHUB_TOKEN; fi && \
    cd plugins && ./foreach_yarn

# Add yeoman generator & vscode git plug-ins
COPY asset-untagged-theia_yeoman_plugin.theia /home/theia-dev/theia-source-code/production/plugins/theia_yeoman_plugin.theia


# Use node image
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/build-result-from.dockerfile}

COPY --from=builder /home/theia-dev/theia-source-code/production /che-theia-build

# change permissions
RUN find /che-theia-build -exec sh -c "chgrp 0 {}; chmod g+rwX {}" \; 2>log.txt && \
    # Add missing permissions on shell scripts of plug-ins
    find /che-theia-build/plugins -name "*.sh" | xargs chmod +x

###
# Runtime Image
#

# Use node image
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/runtime-from.dockerfile}

ENV USE_LOCAL_GIT=true \
    HOME=/home/theia \
    SHELL=/bin/bash \
    THEIA_DEFAULT_PLUGINS=local-dir:///default-theia-plugins \
    # Specify the directory of git (avoid to search at init of Theia)
    LOCAL_GIT_DIRECTORY=/usr \
    GIT_EXEC_PATH=/usr/libexec/git-core \
    # Ignore from port plugin the default hosted mode port
    PORT_PLUGIN_EXCLUDE_3130=TRUE \
    YARN_FLAGS=""

# setup extra stuff
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/runtime-post-env.dockerfile}

EXPOSE 3100 3130

COPY --from=build-result /che-theia-build/plugins /default-theia-plugins

#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/runtime-install-dependencies.dockerfile}

# setup yarn (if missing)
#{INCLUDE:docker/${BUILD_IMAGE_TARGET}/runtime-setup-yarn.dockerfile}

 RUN \
    #{INCLUDE:docker/${BUILD_IMAGE_TARGET}/runtime-adduser.sh}
    && echo "%wheel ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers \
    # Create /projects for Che
    && mkdir /projects \
    # Create root node_modules in order to not use node_modules in each project folder
    && mkdir /node_modules \
    && for f in "${HOME}" "/etc/passwd" "/etc/group /node_modules /default-theia-plugins /projects"; do\
           sudo chgrp -R 0 ${f} && \
           sudo chmod -R g+rwX ${f}; \
       done \
    && cat /etc/passwd | sed s#root:x.*#root:x:\${USER_ID}:\${GROUP_ID}::\${HOME}:/bin/bash#g > /.passwd.template \
    && cat /etc/group | sed s#root:x:0:#root:x:0:0,\${USER_ID}:#g > /.group.template \
    # Add yeoman, theia plugin & VS Code generator and typescript (to have tsc/typescript working)
    && yarn global add ${YARN_FLAGS} yo @theia/generator-plugin@0.0.1-1562578105 generator-code typescript@3.5.3 \
    && mkdir -p ${HOME}/.config/insight-nodejs/ \
    && chmod -R 777 ${HOME}/.config/ \
    # Disable the statistics for yeoman
    && echo '{"optOut": true}' > $HOME/.config/insight-nodejs/insight-yo.json \
    #{IF:DO_CLEANUP}
    # Link yarn global modules for yeoman
    && local_modules=$(ls -d1 /usr/*/node_modules 2>/dev/null || ls -d1 /usr/*/*/node_modules) \
    && mv ${local_modules}/* /usr/local/share/.config/yarn/global/node_modules && rm -rf ${local_modules} && ln -s /usr/local/share/.config/yarn/global/node_modules $(dirname ${local_modules})/ \
    # Cleanup tmp folder
    && rm -rf /tmp/* \
    # Cleanup yarn cache
    && yarn cache clean \
    #ENDIF
    # Change permissions to allow editing of files for openshift user
    && for f in "${HOME}" /etc/passwd /etc/group /node_modules /default-theia-plugins /projects; do\
           sudo chgrp -R 0 ${f} && \
           sudo chmod -R g+rwX ${f}; \
       done

COPY --chown=theia:root --from=builder /home/theia-dev/theia-source-code/production /home/theia

USER theia
WORKDIR /projects
COPY src/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
