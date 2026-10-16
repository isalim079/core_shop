#!/bin/bash
set -euo pipefail

echo "Cleaning the Android debug build..."

cd android
./gradlew clean
./gradlew assembleDebug

echo "Debug build completed"
