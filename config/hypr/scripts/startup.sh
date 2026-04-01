#!/bin/bash

# HyDE Enhanced Startup Script
echo "Starting HyDE enhanced features..."

# 1. Start awww daemon if not running
if ! awww query &>/dev/null; then
    echo "Starting awww daemon..."
    awww-daemon &
    sleep 2
fi

# 2. Set initial random wallpaper and generate colors
echo "Setting initial wallpaper..."
WALLPAPER=$(find "$HOME/Pictures/Wallpapers/Wallpaper Rotation" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | shuf -n 1)
if [ -n "$WALLPAPER" ]; then
    awww img "$WALLPAPER" --transition-type fade --transition-duration 1 --resize stretch
    # Generate colors and wait for completion
    wallust run "$WALLPAPER"
    # Ensure alacritty colors file exists
    if [ ! -f ~/.cache/wallust/alacritty-colors.yml ]; then
        echo "Regenerating alacritty colors..."
        wallust run "$WALLPAPER"
    fi
fi

# 3. Start AGS bar with auto-restart (after colors are generated)
echo "Starting AGS bar with auto-restart..."
killall -9 ags 2>/dev/null
killall -9 gjs 2>/dev/null
sleep 1  # Ensure clean shutdown and colors are written
# Start AGS with a monitor that will restart it if it crashes
while true; do
    cd ~/.config/ags && ags run app.ts --gtk 3
    echo "AGS crashed or stopped, restarting in 1 second..."
    sleep 1
done &

# 4. Start wallpaper rotation (after a delay to not interfere with initial setup)
(
    sleep 30  # Wait 30 seconds before starting rotation
    echo "Starting wallpaper rotation..."
    ~/.config/hypr/scripts/wallpaper-rotate.sh 600 &
) &

echo "HyDE startup complete!"