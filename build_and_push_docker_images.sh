#!/bin/bash
#
# Copyright (c) 2019 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# See: https://sipb.mit.edu/doc/safe-shell/

set -e
set -o pipefail

# KEEP RIGHT ORDER!!!
DOCKER_FILES_LOCATIONS=(
dockerfiles/theia-dev
dockerfiles/theia
dockerfiles/theia-endpoint-runtime
)

IMAGES_LIST=(
eclipse/che-theia-dev
eclipse/che-theia
eclipse/che-theia-endpoint-runtime
)


# BUILD IMAGES
for image_dir in "${DOCKER_FILES_LOCATIONS[@]}"
    do
        if [ "$image_dir" == "dockerfiles/theia" ]; then
            THEIA_IMAGE_TAG="master"
            bash $(pwd)/$image_dir/build.sh --build-args:GITHUB_TOKEN=${GITHUB_TOKEN},THEIA_VERSION=master --tag:master --branch:master --git-ref:refs\\/heads\\/master 
        elif [ "$image_dir" == "dockerfiles/theia-dev" ]; then
            bash $(pwd)/$image_dir/build.sh --build-arg:GITHUB_TOKEN=${GITHUB_TOKEN} --tag:master
        else
            bash $(pwd)/$image_dir/build.sh
        fi
        if [ $? -ne 0 ]; then
            echo "ERROR:"
            echo "build of '$image_dir' image is failed!"
            exit 1
        fi
    done


if [ "$BUILD_BRANCH" == "master" ]; then
    #PUSH IMAGES
    #docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    for image in "${IMAGES_LIST[@]}"
        do
            if [ "$image" == "eclipse/che-theia" ]; then
                docker tag ${image}:nightly ${image}:${THEIA_IMAGE_TAG}
                echo y | docker push ${image}:${THEIA_IMAGE_TAG}
            elif ["$image" == "eclipse/che-theia-dev" ]; then 
                docker tag ${image}:nightly ${image}:${THEIA_IMAGE_TAG}
                echo y | docker push ${image}:${THEIA_IMAGE_TAG}
            else
                echo y | docker push ${image}:nightly
            fi
        done
else 
    echo "Skip push docker images.";
fi
