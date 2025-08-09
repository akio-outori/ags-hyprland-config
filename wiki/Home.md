# AGS Hyprland Config Wiki

Welcome to the AGS Hyprland Config wiki! This bar brings dynamic, wallpaper-based theming to your Hyprland desktop.

## 📸 Screenshots Needed

**Note to Jeff**: We need to capture these screenshots. Make sure to:
1. Close any sensitive terminals/applications
2. Use clean wallpapers without personal photos
3. Hide any personal information in the bar

### Required Screenshots:

#### 1. Hero Shot
- **Filename**: `hero-dark.png`
- **Setup**: Dark wallpaper (space/night theme), bar fully visible, clean desktop
- **Mode**: Programming mode
- **What to show**: Full bar with all widgets visible

#### 2. Light Theme Demo
- **Filename**: `hero-light.png`
- **Setup**: Light/bright wallpaper (clouds/snow), showing contrast
- **Mode**: Programming mode
- **What to show**: How the bar adapts to light backgrounds

#### 3. Gaming Mode
- **Filename**: `gaming-mode.png`
- **Setup**: Gaming-themed wallpaper (cyberpunk/neon)
- **Mode**: Gaming mode (Super+Ctrl+G)
- **What to show**: The accent color background in gaming mode

#### 4. Shortcuts Overlay
- **Filename**: `shortcuts-overlay.png`
- **Setup**: Any wallpaper, shortcuts overlay open
- **What to capture**: The keyboard shortcuts popup window

#### 5. Dynamic Theming GIF
- **Filename**: `theming-demo.gif`
- **Setup**: Record switching between 3-4 different wallpapers
- **Duration**: 10-15 seconds
- **What to show**: How colors change instantly with wallpaper

#### 6. Multiple Wallpaper Examples (Gallery)
Create a grid showing the bar with different wallpapers:
- `theme-forest.png` - Green forest wallpaper
- `theme-ocean.png` - Blue ocean wallpaper  
- `theme-sunset.png` - Orange/red sunset
- `theme-purple.png` - Purple/violet theme
- `theme-minimal.png` - Minimal geometric wallpaper

### How to Take Clean Screenshots

1. **Clean your desktop**:
```bash
# Close all windows
hyprctl dispatch killactive
# Or use Super+Shift+Q to close all
```

2. **Hide sensitive info**:
```bash
# Clear terminal history for screenshots
clear
# Use a test user name if needed
export USER="demo"
```

3. **Take screenshots**:
```bash
# Full screen
grim ~/Pictures/screenshot.png

# Specific region
grim -g "$(slurp)" ~/Pictures/screenshot.png

# With 3 second delay
sleep 3 && grim ~/Pictures/screenshot.png
```

4. **Record GIF**:
```bash
# Install wf-recorder if needed
sudo pacman -S wf-recorder

# Record region as GIF
wf-recorder -g "$(slurp)" -f theming-demo.gif -c gif
# Press Ctrl+C to stop
```

## 📚 Documentation Pages

### [Installation Guide](Installation)
Step-by-step installation for different distributions

### [Configuration](Configuration)
How to customize using config.json

### [Theming Guide](Theming)
Understanding the wallpaper-based theming system

### [Troubleshooting](Troubleshooting)
Common issues and solutions

### [Advanced Usage](Advanced)
Power user features and customization

### [Contributing](Contributing)
How to contribute to the project