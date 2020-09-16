#!/bin/sh

. /entrypoint.sh

cd /projects

# Just try to build the latest theia with current image
git clone -b 'master' --single-branch --depth 1 https://github.com/theia-ide/theia theia
cd theia && yarn
