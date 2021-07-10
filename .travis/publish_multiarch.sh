#!/bin/bash

set -e
REGISTRY="quay.io"

PUBLISH_IMAGES_LIST=(
  eclipse/che-theia-dev
  eclipse/che-theia
  eclipse/che-theia-endpoint-runtime-binary
  eclipse/che-theia-vsix-installer
)

SHORT_SHA=$(git rev-parse --short HEAD)

for image in "${PUBLISH_IMAGES_LIST[@]}"
  do
    AMEND=""
    AMEND+=" --amend ${REGISTRY}/${image}:${TAG}-${TRAVIS_TAG}-amd64";
    AMEND+=" --amend ${REGISTRY}/${image}:${TAG}-${TRAVIS_TAG}-arm64";
    AMEND+=" --amend ${REGISTRY}/${image}:${TAG}-${TRAVIS_TAG}-ppc64le";
    AMEND+=" --amend ${REGISTRY}/${image}:${TAG}-${TRAVIS_TAG}-s390x";

    docker manifest create ${REGISTRY}/${image}:"${TAG}-${TRAVIS_TAG}" $AMEND
    docker manifest push ${REGISTRY}/${image}:"${TAG}-${TRAVIS_TAG}"

    if [[ "${TAG}" != "next" ]]; then
       docker manifest create ${REGISTRY}/${image}:"latest-${TRAVIS_TAG}" $AMEND
       docker manifest push ${REGISTRY}/${image}:"latest-${TRAVIS_TAG}"
    fi

    if [[ "${TAG}" == "next" ]]; then
       docker manifest create ${REGISTRY}/${image}:"${SHORT_SHA}-${TRAVIS_TAG}" $AMEND
       docker manifest push ${REGISTRY}/${image}:"${SHORT_SHA}-${TRAVIS_TAG}"
    fi

  done
