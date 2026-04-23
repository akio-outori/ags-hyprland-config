# Screenshots Directory

This directory contains screenshots demonstrating the AGS Hyprland Config bar with various wallpapers and modes.

## Screenshot Files

The actual screenshot files are stored locally at:
```
~/Pictures/ags-screenshots/
```

For the public repository, we reference these files but don't include them directly to keep the repo size manageable.

## Available Screenshots

- `hero-dark.png` - Dark wallpaper with bar in programming mode
- `hero-light.png` - Light wallpaper showing adaptive theming
- `gaming-mode.png` - Gaming mode with inverted colors
- `shortcuts-overlay.png` - Keyboard shortcuts overlay window
- `theme-forest.png` - Forest/green themed wallpaper
- `theme-ocean.png` - Ocean/blue themed wallpaper

## Adding Screenshots to GitHub

When you're ready to publish:

1. Create a GitHub release
2. Attach the screenshots from `~/Pictures/ags-screenshots/`
3. Or upload to the wiki's images section
4. Update links in documentation to point to the hosted images

## Taking New Screenshots

```bash
# Full screen
grim ~/Pictures/ags-screenshots/new-screenshot.png

# Specific region
grim -g "$(slurp)" ~/Pictures/ags-screenshots/region.png

# With delay
sleep 3 && grim ~/Pictures/ags-screenshots/delayed.png
```

## Privacy Checklist

Before sharing screenshots:
- [ ] No terminal sessions visible
- [ ] No personal files/folders shown
- [ ] No private notifications
- [ ] No sensitive system information
- [ ] Clean desktop/wallpaper only