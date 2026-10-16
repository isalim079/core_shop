#!/bin/bash

# Replace TouchableOpacity with SmartTouchableOpacity.
# Run from the mobile_app directory.

echo "Starting TouchableOpacity replacement..."

if sed --version >/dev/null 2>&1; then
  sed_inplace() { sed -i "$@"; }
else
  sed_inplace() { sed -i '' "$@"; }
fi

files=$(grep -l "TouchableOpacity" $(find . -name "*.tsx" -o -name "*.ts") | grep -v "SmartTouchableOpacity.tsx" | grep -v "index.ts")

echo "Found $(echo "$files" | wc -l) files to update:"
echo "$files" | head -10

updated=0

for file in $files; do
    echo "Processing: $file"

    if grep -q "SmartTouchableOpacity" "$file"; then
        echo "   Already has SmartTouchableOpacity import"
    elif grep -q "TouchableOpacity" "$file"; then
        sed_inplace 's/import { \([^}]*\)TouchableOpacity\([^}]*\) } from "react-native";/import { \1\2 } from "react-native";/' "$file"
        sed_inplace 's/import { TouchableOpacity } from "react-native";//' "$file"

        if grep -q "from \"react-native\"" "$file"; then
            sed_inplace '/from "react-native";/a\
import { SmartTouchableOpacity } from "../TouchableOpacity";' "$file"
        else
            sed_inplace '1a\
import { SmartTouchableOpacity } from "../TouchableOpacity";' "$file"
        fi
    fi

    sed_inplace 's/<TouchableOpacity/<SmartTouchableOpacity/g' "$file"
    sed_inplace 's/<\/TouchableOpacity>/<\/SmartTouchableOpacity>/g' "$file"
    sed_inplace 's/onPress={onPress}/onPress={onPress || (() => {})}/g' "$file"

    updated=$((updated + 1))
    echo "   Updated: $file"
done

echo ""
echo "Replacement complete. Updated $updated files."
