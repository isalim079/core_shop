#!/bin/bash
set -euo pipefail

echo "Removing build artifacts..."

rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -rf android

echo "Reinstalling dependencies..."
yarn

echo "Running Android prebuild..."
npx expo prebuild --platform android

cd android
./gradlew clean
./gradlew assembleRelease

echo "Release build completed"
