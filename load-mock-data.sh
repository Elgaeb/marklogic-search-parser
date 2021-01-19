#!/usr/bin/env bash

./gradlew mlDeleteCollections -Pdatabase=ml-search-parser-content -PthreadCount=4 -PbatchSize=250 -PlogBatches=true -Pcollections=mock
./gradlew mlDeleteCollections -Pdatabase=ml-search-parser-test-content -PthreadCount=4 -PbatchSize=250 -PlogBatches=true -Pcollections=mock
mlcp.sh IMPORT -database ml-search-parser-content -options_file mlcp-mock.options
mlcp.sh IMPORT -database ml-search-parser-test-content -options_file mlcp-mock.options
