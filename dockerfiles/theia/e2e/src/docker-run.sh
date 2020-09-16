#!/bin/sh
# Copyright (c) 2018 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0

# (5 + 2 * 30 = 65 seconds) is the default timeout.
: "${WAIT_COUNT:=30}"

echo "Starting Theia..."
rm -rf /projects/logs/*
HOME=/home/theia /entrypoint.sh > /projects/logs/theia.log 2>/projects/logs/theia-error.log&

echo "Cleaning videos folder..."
# Cleanup previous videos
rm -rf /projects/cypress/videos/*

# Find TCP 0.0.0.0:3100 that will be opened by Theia.
sleep 5s
while [ $WAIT_COUNT -gt 0 ]; do
    # Check the listening port
    ss -nlt | grep -Fq ':3100' && break
    # not found
    WAIT_COUNT=$((WAIT_COUNT-1));
    echo "Waiting for booting up Theia..."
    sleep 2s
done

if [ $WAIT_COUNT -eq 0 ]; then
    echo "Timeout. Theia is dead?"
    exit 1
fi

# Run tests
echo "Run the tests"
cd /projects && unset LD_LIBRARY_PATH && /projects/node_modules/.bin/cypress run -c trashAssetsBeforeRuns=false  --browser chrome
