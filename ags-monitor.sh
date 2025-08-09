#!/bin/bash

# AGS Bar Monitor Script - Auto-restarts AGS if it crashes or is killed

echo "AGS Monitor: Starting AGS bar with auto-restart..."

# Kill any existing AGS instances
killall -9 ags 2>/dev/null
killall -9 gjs 2>/dev/null
sleep 1

# Monitor loop
while true; do
    echo "AGS Monitor: Starting AGS bar..."
    cd ~/.config/ags && ags run app.ts
    
    EXIT_CODE=$?
    echo "AGS Monitor: AGS exited with code $EXIT_CODE"
    
    # Only restart if not intentionally killed with SIGTERM
    if [ $EXIT_CODE -eq 143 ]; then
        echo "AGS Monitor: AGS was terminated, stopping monitor..."
        break
    fi
    
    echo "AGS Monitor: Restarting AGS in 1 second..."
    sleep 1
done