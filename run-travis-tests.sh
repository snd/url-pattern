#!/usr/bin/env bash

# e = fail on error
# v = verbose
set -ev

if [ $ZUUL = 'true' ]; then
  npm run test-zuul;
elif [ $COVERAGE = 'true' ]; then
  npm run test-with-codecov;
else
  npm test;
fi
