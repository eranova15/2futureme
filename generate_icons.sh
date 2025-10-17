#!/bin/bash

# 2FutureMe PWA Icon Generator
# This script creates all required icon sizes from the SVG source

echo "🎨 Generating PWA icons for 2FutureMe..."

# Check if we have the necessary tools
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick 'convert' not found. Installing..."
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y imagemagick
    elif command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo "❌ Please install ImageMagick manually"
        exit 1
    fi
fi

# Create icons directory if it doesn't exist
mkdir -p assets/icons

# Icon sizes needed for PWA
sizes=(72 96 128 144 152 192 384 512)

# Generate PNG icons from SVG
for size in "${sizes[@]}"; do
    echo "🔧 Generating ${size}x${size} icon..."
    convert -background none -size ${size}x${size} assets/icons/icon.svg assets/icons/icon-${size}x${size}.png
    
    if [ $? -eq 0 ]; then
        echo "✅ Created icon-${size}x${size}.png"
    else
        echo "❌ Failed to create icon-${size}x${size}.png"
    fi
done

# Create favicon
echo "🔧 Generating favicon..."
convert -background none -size 32x32 assets/icons/icon.svg favicon.ico
if [ $? -eq 0 ]; then
    echo "✅ Created favicon.ico"
else
    echo "❌ Failed to create favicon.ico"
fi

# Create Apple touch icon
echo "🔧 Generating Apple touch icon..."
convert -background none -size 180x180 assets/icons/icon.svg assets/icons/apple-touch-icon.png
if [ $? -eq 0 ]; then
    echo "✅ Created apple-touch-icon.png"
else
    echo "❌ Failed to create apple-touch-icon.png"
fi

# Create shortcut icons
echo "🔧 Generating shortcut icons..."

# Voice shortcut icon
cat > assets/icons/voice-shortcut.svg << 'EOF'
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="44" fill="#667eea"/>
  <rect x="40" y="28" width="16" height="26" rx="8" fill="#ffffff"/>
  <circle cx="48" cy="28" r="8" fill="#ffffff"/>
  <path d="M 58 36 Q 68 42 58 48" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M 62 32 Q 76 40 62 52" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>
EOF

# Photo shortcut icon  
cat > assets/icons/photo-shortcut.svg << 'EOF'
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="44" fill="#667eea"/>
  <rect x="24" y="32" width="48" height="32" rx="4" fill="#ffffff"/>
  <circle cx="48" cy="48" r="8" fill="#667eea"/>
  <rect x="32" y="24" width="8" height="8" rx="2" fill="#ffffff"/>
</svg>
EOF

# Vault shortcut icon
cat > assets/icons/vault-shortcut.svg << 'EOF'
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="44" fill="#667eea"/>
  <rect x="28" y="36" width="40" height="28" rx="2" fill="#ffffff"/>
  <rect x="32" y="32" width="32" height="4" rx="2" fill="#ffffff"/>
  <circle cx="56" cy="50" r="4" fill="#667eea"/>
  <rect x="44" y="56" width="8" height="2" fill="#667eea"/>
</svg>
EOF

# Convert shortcut SVGs to PNG
convert -background none -size 96x96 assets/icons/voice-shortcut.svg assets/icons/voice-shortcut-96x96.png
convert -background none -size 96x96 assets/icons/photo-shortcut.svg assets/icons/photo-shortcut-96x96.png  
convert -background none -size 96x96 assets/icons/vault-shortcut.svg assets/icons/vault-shortcut-96x96.png

echo "✅ Shortcut icons created"

# Create badge icon for notifications
cat > assets/icons/badge.svg << 'EOF'
<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="36" r="32" fill="#667eea"/>
  <text x="36" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">2F</text>
</svg>
EOF

convert -background none -size 72x72 assets/icons/badge.svg assets/icons/badge-72x72.png

echo "✅ Badge icon created"

# Verify all icons were created
echo ""
echo "📋 Icon verification:"
for size in "${sizes[@]}"; do
    if [ -f "assets/icons/icon-${size}x${size}.png" ]; then
        echo "✅ icon-${size}x${size}.png"
    else
        echo "❌ icon-${size}x${size}.png"
    fi
done

echo ""
echo "🎉 PWA icon generation complete!"
echo "📁 Icons saved in assets/icons/"