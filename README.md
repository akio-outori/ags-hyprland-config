# AGS Hyprland Config - Dynamic Wallpaper Theming

🎨 **Your wallpaper IS your theme!** A modern status bar for Hyprland that automatically adapts its entire color scheme based on your wallpaper. Every wallpaper change brings a fresh, perfectly matched interface.

![Dynamic Theming Demo](https://github.com/jeffhallyburton/ags-hyprland-config/wiki/images/theming-demo.gif)

📸 **[View Screenshot Gallery](SCREENSHOTS.md)** - See the bar in action with different wallpapers!

## 🌈 Dynamic Wallpaper Theming

Unlike traditional themes, this bar doesn't come with predefined color schemes. Instead, it intelligently extracts colors from your wallpaper and creates a cohesive, beautiful theme in real-time. Change your wallpaper, and watch your entire interface transform!

### How It Works
1. Set any wallpaper you like
2. Wallust analyzes the image and extracts a color palette
3. The bar instantly updates with perfectly matched colors
4. All widgets, text, and accents coordinate beautifully

## Features

- **🎨 Wallpaper-Driven Theming**: No manual theme selection needed - your wallpaper decides everything
- **Mode Switching**: Toggle between Programming and Gaming modes with different color schemes
  - `Super + Ctrl + P` - Programming Mode
  - `Super + Ctrl + G` - Gaming Mode
- **Interactive Shortcuts Overlay**: Built-in keyboard shortcuts reference (click the keyboard icon)
- **Hardware Monitoring**: Real-time CPU (dual CCD temps), GPU, RAM, and network statistics
- **Clickable Widgets**: 
  - CPU usage opens htop
  - GPU stats opens nvidia-settings
  - Network monitor opens bmon
  - Volume control opens pavucontrol
  - Clock opens calendar
  - App launcher opens wofi
  - Power button opens wlogout menu
- **Smart Updates Widget**: Only shows when system updates are available
- **Clean Minimal Design**: Borderless, modern aesthetic with readable typography
- **Wallpaper Integration**: Seamless integration with swww for wallpaper management

## Screenshots

The bar adapts its colors to match your current wallpaper automatically.

## Quick Start

1. Run the setup script:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/jeffhallyburton/ags-hyprland-config/main/install.sh | bash
   ```

2. Reboot or restart Hyprland

## Manual Installation

### Prerequisites

Required packages:
- `aylurs-gtk-shell` (AGS v2)
- `wallust` (color scheme generator)
- `swww` (wallpaper daemon)
- `alacritty` (terminal with wallust support)
- `hyprland` (window manager)

### Installation Steps

1. **Clone this repository:**
   ```bash
   git clone https://github.com/jeffhallyburton/ags-hyprland-config.git
   cd ags-hyprland-config
   ```

2. **Copy configuration files:**
   ```bash
   cp -r config/ags ~/.config/
   cp -r config/wallust ~/.config/
   cp -r config/hypr/scripts ~/.config/hypr/
   ```

3. **Update Hyprland configuration:**
   - Add the contents of `config/hypr/additions.conf` to your `hyprland.conf`
   - Or copy the provided settings files to `~/.config/hypr/settings/`

4. **Update alacritty configuration:**
   - Modify your `~/.config/alacritty/alacritty.yml` as shown in `config/alacritty/`

5. **Restart Hyprland or reboot**

## Configuration Structure

```
config/
├── ags/                    # AGS status bar configuration
│   ├── app.ts             # Main AGS app entry point
│   ├── style.scss         # Dynamic styling with wallust integration
│   └── widget/
│       └── Bar.tsx        # Status bar widgets and functionality
├── wallust/               # Color scheme generation
│   ├── wallust.toml       # Wallust configuration
│   └── templates/         # Color templates for different apps
│       ├── ags-colors.scss
│       ├── waybar-colors.css
│       └── alacritty-colors.yml
├── hypr/
│   ├── scripts/           # Hyprland automation scripts
│   │   ├── startup.sh     # Boot initialization
│   │   └── wallpaper-switch.sh # Dynamic wallpaper/theming
│   ├── additions.conf     # Hyprland config additions
│   └── settings/          # Individual setting files
└── alacritty/
    └── modifications.yml   # Required alacritty changes
```

## How It Works

1. **Wallpaper Changes**: When wallpapers change, `wallust` analyzes colors
2. **Template Generation**: Wallust generates color files for AGS, alacritty, etc.
3. **Live Reload**: AGS and terminals automatically pick up new colors
4. **Widget Integration**: Clicking widgets opens properly themed applications

## Customization

### Adding New Widgets

Edit `config/ags/widget/Bar.tsx` to add new status bar widgets.

### Changing Colors

Modify `config/wallust/templates/` to customize how colors are applied.

### Wallpaper Rotation

Edit timing in `config/hypr/scripts/startup.sh` (default: 5 minutes).

### Window Rules

Modify `config/hypr/settings/manual_settings.conf` for terminal behavior.

## Troubleshooting

### AGS Won't Start
- Check if all templates exist in `~/.cache/wallust/`
- Run `wallust run [image]` manually to generate templates
- Check AGS logs: `journalctl --user -u ags`

### Colors Not Applying
- Ensure wallust templates are properly configured
- Check file permissions in `~/.cache/wallust/`
- Verify import paths in configuration files

### Terminals Don't Theme
- Confirm alacritty import path is correct
- Check if `~/.cache/wallust/alacritty-colors.yml` exists
- Verify wallust template generates valid YAML

## Contributing

Feel free to submit issues and pull requests to improve this setup!

## Credits

- Built with [AGS](https://github.com/Aylur/ags) by Aylur
- Uses [wallust](https://codeberg.org/explosion-mental/wallust) for color generation
- [swww](https://github.com/Horus645/swww) for wallpaper management
- Designed for [Hyprland](https://hyprland.org/) window manager