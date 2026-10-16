#!/bin/bash

# Generate app icons from assets/images/logo.png

echo "App Icon Generator for Core Shop"
echo "================================"

if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Install it first:"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

if [ ! -f "assets/images/logo.png" ]; then
    echo "Logo file not found at assets/images/logo.png"
    exit 1
fi

echo "Logo file found"
echo "Generating app icons..."

cp assets/images/icon.png assets/images/icon-backup.png 2>/dev/null || echo "No original icon to backup"

echo "Generating main app icon (1024x1024)..."
convert assets/images/logo.png -resize 1024x1024 -background white -gravity center -extent 1024x1024 assets/images/icon.png

echo "Generating Android adaptive icon foreground..."
convert assets/images/logo.png -resize 432x432 -background transparent -gravity center -extent 432x432 assets/images/adaptive-icon.png

echo "Generating web favicon (32x32)..."
convert assets/images/logo.png -resize 32x32 -background white -gravity center -extent 32x32 assets/images/favicon.png

echo "Generating iOS icon sizes..."
mkdir -p assets/images/ios-icons

sizes=(20 29 40 58 60 76 80 87 120 152 167 180 1024)

for size in "${sizes[@]}"; do
    echo "   Generating ${size}x${size}..."
    convert assets/images/logo.png -resize ${size}x${size} -background white -gravity center -extent ${size}x${size} assets/images/ios-icons/icon-${size}.png
done

echo ""
echo "App icons generated."
echo "   assets/images/icon.png (1024x1024)"
echo "   assets/images/adaptive-icon.png (432x432)"
echo "   assets/images/favicon.png (32x32)"
echo "   assets/images/ios-icons/"
