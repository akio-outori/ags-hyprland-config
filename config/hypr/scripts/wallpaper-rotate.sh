#!/bin/bash

# Wallpaper rotation script for awww
WALLPAPER_DIR="$HOME/Pictures/Wallpapers/Wallpaper Rotation"
INTERVAL=${1:-300}  # Default 5 minutes (300 seconds), or pass custom interval

# Check if awww daemon is running
if ! awww query &>/dev/null; then
    awww-daemon &
    sleep 1
fi

echo "Starting wallpaper rotation every $INTERVAL seconds..."
echo "Wallpaper directory: $WALLPAPER_DIR"

while true; do
    # Get random wallpaper from directory
    WALLPAPER=$(find "$WALLPAPER_DIR" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | shuf -n 1)
    
    if [ -n "$WALLPAPER" ]; then
        echo "Setting wallpaper: $(basename "$WALLPAPER")"
        
        # Set wallpaper with nice transition
        awww img "$WALLPAPER" \
            --transition-type wave \
            --transition-pos 0.8,0.9 \
            --transition-step 90 \
            --transition-duration 2
        
        # Generate colors with wallust (optional - comment out if too slow)
        wallust run "$WALLPAPER" &>/dev/null
        
        # Reload waybar to apply new colors (optional)
        killall -SIGUSR2 waybar &>/dev/null
    fi
    
    sleep "$INTERVAL"
done