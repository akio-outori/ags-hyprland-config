# Dynamic Theming with Wallust

This setup uses [wallust](https://codeberg.org/explosion-mental/wallust) to automatically generate color schemes from wallpapers and apply them across the desktop.

## How It Works

1. **Wallpaper Analysis**: When a wallpaper changes, wallust analyzes its dominant colors
2. **Template Processing**: Wallust fills color templates for different applications
3. **Live Reload**: Applications automatically pick up the new colors

## Color Flow

```
Wallpaper → Wallust → Templates → Applications
    ↓           ↓          ↓           ↓
  [image]   [analysis]  [configs]  [live reload]
```

## Template System

### AGS Bar (`config/wallust/templates/ags-colors.scss`)
- Generates SCSS variables for the status bar
- Updates bar background, widget colors, text colors
- Applied through CSS import in `config/ags/style.scss`

### Alacritty Terminal (`config/wallust/templates/alacritty-colors.yml`)
- Creates terminal color palette
- Supports 16-color terminal themes
- Applied through YAML import in alacritty config

### Waybar (legacy, included for compatibility)
- CSS custom properties for waybar theming
- Can be used alongside AGS

## Color Variables

### Generated Colors
- `background` / `foreground` - Base colors from wallpaper
- `color0-15` - Full 16-color palette
- `$bar-bg`, `$widget-bg` - Derived colors for UI elements
- `$text`, `$text-dim` - Text colors with contrast
- `$accent`, `$urgent` - Highlight colors

### Custom Color Definitions
Edit `config/wallust/templates/ags-colors.scss` to customize:
```scss
$bar-bg: "{{background}}";           // Bar background
$widget-bg: "{{color0}}";            // Widget backgrounds  
$text: "{{foreground}}";             // Primary text
$accent: "{{color2}}";               // Accent color
$urgent: "{{color1}}";               // Alert/urgent color
```

## Wallust Configuration

### Main Config (`config/wallust/wallust.toml`)
```toml
backend = "fastresize"     # Fast color extraction
color_space = "lch"        # Perceptual color space
palette = "dark"           # Dark theme preference

[templates]
ags = { template = 'ags-colors.scss', target = '~/.cache/wallust/ags-colors.scss' }
alacritty = { template = 'alacritty-colors.yml', target = '~/.cache/wallust/alacritty-colors.yml' }
```

## Adding New Applications

### 1. Create Template
Create `config/wallust/templates/myapp-colors.conf`:
```
# MyApp color config
background={{background}}
foreground={{foreground}}
accent={{color2}}
```

### 2. Add to wallust.toml
```toml
myapp = { template = 'myapp-colors.conf', target = '~/.config/myapp/colors.conf' }
```

### 3. Configure App
Make your application import the generated colors file.

## Color Customization

### Adjusting Color Selection
Modify color assignments in templates. Available variables:
- `{{background}}`, `{{foreground}}` - Base colors
- `{{color0}}` through `{{color15}}` - Full palette
- `{{color0 | rgb}}` - RGB format (comma-separated)
- `{{color0 | hex}}` - Hex format (with #)

### Creating Color Variants
```scss
// Lighter variant
$light-bg: lighten({{background}}, 10%);

// Darker variant  
$dark-accent: darken({{color2}}, 20%);

// With transparency
$transparent-bg: rgba({{background | rgb}}, 0.8);
```

### Testing Colors
Use `wallust run /path/to/image.jpg` to test color generation with specific wallpapers.

## Troubleshooting

### Colors Not Updating
1. Check if template files exist: `ls ~/.cache/wallust/`
2. Verify wallust config: `wallust --help`
3. Regenerate manually: `wallust run ~/Pictures/wallpaper.jpg`
4. Check template syntax for errors

### AGS Bar Colors Wrong
1. Ensure SCSS import path is correct in `style.scss`
2. Check generated file: `cat ~/.cache/wallust/ags-colors.scss`
3. Verify CSS variables are properly interpolated

### Terminal Colors Not Applied
1. Check alacritty import in config file
2. Verify generated YAML: `cat ~/.cache/wallust/alacritty-colors.yml`
3. Ensure live_config_reload is enabled in alacritty

## Advanced Usage

### Multiple Color Schemes
Create different templates for different moods:
- `ags-colors-vibrant.scss` - High saturation
- `ags-colors-muted.scss` - Low saturation  
- `ags-colors-monochrome.scss` - Grayscale

### Conditional Templates
Use wallust's conditional syntax:
```scss
$accent: {{#if (gt saturation 0.5)}}{{color2}}{{else}}{{color8}}{{/if}};
```

### Time-Based Themes  
Combine with cron jobs to change color intensity based on time of day.

## Resources

- [Wallust Documentation](https://codeberg.org/explosion-mental/wallust)
- [Color Theory for UI](https://material.io/design/color/)
- [SCSS Documentation](https://sass-lang.com/documentation/)
- [Alacritty Color Configuration](https://alacritty.org/config-alacritty.html#colors)