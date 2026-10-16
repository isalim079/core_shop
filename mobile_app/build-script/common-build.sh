#!/bin/bash
set -euo pipefail

echo "Cleaning the Android release build..."

cd android
./gradlew clean
./gradlew assembleRelease

echo "Release build completed"
