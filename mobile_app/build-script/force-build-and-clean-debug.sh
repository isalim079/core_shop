#!/bin/bash
set -euo pipefail

echo "Removing build artifacts..."

rm -rf node_modules
rm -f yarn.lock
rm -f package-lock.json
rm -rf .expo
rm -rf android

echo "Reinstalling dependencies..."
yarn

echo "Running Android prebuild..."
npx expo prebuild --platform android

cd android
./gradlew clean
./gradlew assembleDebug

echo "Debug build completed"
