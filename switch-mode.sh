#!/bin/bash

# Switch AGS profile mode
MODE=$1

if [ "$MODE" = "programming" ]; then
    echo "programming" > /tmp/ags-profile-mode
    notify-send "Profile Mode" "Switched to Programming Mode" -t 2000
elif [ "$MODE" = "gaming" ]; then
    echo "gaming" > /tmp/ags-profile-mode
    notify-send "Profile Mode" "Switched to Gaming Mode" -t 2000
else
    echo "Usage: $0 [programming|gaming]"
    exit 1
fi

# Signal AGS to update (if needed)
pkill -SIGUSR1 ags || true