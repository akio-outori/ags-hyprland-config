#!/bin/bash

# HyDE Enhanced Startup Script
echo "Starting HyDE enhanced features..."

# 1. Start swww daemon if not running
if ! swww query &>/dev/null; then
    echo "Starting swww daemon..."
    swww-daemon &
    sleep 2
fi

# 2. Set initial random wallpaper and generate colors
echo "Setting initial wallpaper..."
WALLPAPER=$(find "$HOME/Pictures/Wallpapers/Wallpaper Rotation" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | shuf -n 1)
if [ -n "$WALLPAPER" ]; then
    swww img "$WALLPAPER" --transition-type fade --transition-duration 1 --resize stretch
    # Generate colors and wait for completion
    wallust run "$WALLPAPER"
    # Ensure alacritty colors file exists
    if [ ! -f ~/.cache/wallust/alacritty-colors.yml ]; then
        echo "Regenerating alacritty colors..."
        wallust run "$WALLPAPER"
    fi
fi

# 3. Start AGS bar (after colors are generated)
echo "Starting AGS bar..."
killall -9 ags 2>/dev/null
killall -9 gjs 2>/dev/null
sleep 1  # Ensure clean shutdown and colors are written
ags run &

# 4. Start wallpaper rotation (after a delay to not interfere with initial setup)
(
    sleep 30  # Wait 30 seconds before starting rotation
    echo "Starting wallpaper rotation..."
    ~/.config/hypr/scripts/wallpaper-rotate.sh 600 &
) &

echo "HyDE startup complete!"