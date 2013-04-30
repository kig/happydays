#!/bin/bash

bin/build.sh &&

cd build &&

../bin/poemyou_put images/* js/* index.html

