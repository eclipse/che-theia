FROM quay.io/eclipse/che-custom-nodejs-deasync:12.20.1 as custom-nodejs
FROM ${BUILD_ORGANIZATION}/${BUILD_PREFIX}-theia:${BUILD_TAG} as builder
