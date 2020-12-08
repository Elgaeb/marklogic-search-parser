#!/usr/bin/env bash

bclear
nearleyc search.ne -o build/search.js
echo "$@" | nearley-test build/search.js