#!/bin/bash

# Script to switch wallpaper and update color scheme dynamically

# Get the wallpaper (either provided as argument or random)
if [ -n "$1" ]; then
    WALLPAPER="$1"
else
    WALLPAPER=$(find "$HOME/Pictures/Wallpapers/Wallpaper Rotation" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | shuf -n 1)
fi

if [ -z "$WALLPAPER" ] || [ ! -f "$WALLPAPER" ]; then
    echo "No wallpaper found or file doesn't exist"
    exit 1
fi

echo "Switching to wallpaper: $WALLPAPER"

# Set wallpaper with swww (stretch to fill screen)
swww img "$WALLPAPER" --transition-type fade --transition-duration 1 --resize stretch

# Generate new color scheme with wallust
wallust run "$WALLPAPER"

# Force restart AGS to apply new colors
killall -9 ags 2>/dev/null
killall -9 gjs 2>/dev/null
sleep 1
ags run &

echo "Wallpaper and colors updated!"