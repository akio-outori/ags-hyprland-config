# Theming Guide - Wallpaper is Everything

## How Dynamic Theming Works

This bar doesn't use traditional themes. Instead, it creates a unique theme for every wallpaper you use. Here's the magic behind it:

### The Process

1. **You change your wallpaper** → 
2. **Wallust analyzes the image** → 
3. **Extracts dominant and accent colors** → 
4. **Generates a complete color scheme** → 
5. **AGS instantly applies the new colors**

![Theming Process Diagram](images/theming-process.png)

## Color Extraction

Wallust intelligently extracts colors to create a cohesive theme:

- **Background**: Darkest color for bar background
- **Foreground**: Lightest color for text
- **Accent**: Most vibrant color for highlights
- **Secondary**: Complementary colors for widgets

## Wallpaper Tips for Best Results

### Great Wallpapers
✅ **High contrast images** - Clear distinction between elements
✅ **Vibrant colors** - Creates interesting accent colors
✅ **Clean compositions** - Not too busy or cluttered
✅ **Nature scenes** - Forests, oceans, mountains work beautifully
✅ **Abstract art** - Geometric patterns and gradients
✅ **Minimal designs** - Simple but colorful

### Wallpapers to Avoid
❌ **Low contrast** - Everything looks washed out
❌ **Monochrome** - Limited color palette
❌ **Busy patterns** - Can create chaotic themes
❌ **Text-heavy** - Interferes with bar readability

## Examples Gallery

### Forest Theme
![Forest Theme](images/theme-forest.png)
- Deep green backgrounds
- Natural earth tone accents
- Perfect for long coding sessions

### Ocean Theme
![Ocean Theme](images/theme-ocean.png)
- Cool blue tones
- Calming and professional
- Great for focus work

### Sunset Theme
![Sunset Theme](images/theme-sunset.png)
- Warm oranges and reds
- Energizing and vibrant
- Perfect for creative work

### Cyberpunk Theme
![Cyberpunk Theme](images/theme-cyberpunk.png)
- Neon accents
- High contrast
- Ideal for gaming mode

## Customizing Color Generation

While the automatic theming is the star, you can influence how colors are generated:

### Wallust Configuration

Edit `~/.config/wallust/wallust.toml`:

```toml
[config]
backend = "kmeans"  # or "median", "wal"
color_space = "Lab"  # or "RGB", "HSL"
threshold = 20       # Color difference threshold

[templates]
ags = "~/.config/wallust/templates/ags-colors.scss"
```

### Force Specific Colors

You can override specific colors in `~/.cache/wallust/ags-colors.scss`:

```scss
// After wallust generation, you can override:
$accent: #FF6B6B !important;  // Force red accent
$text: #FFFFFF !important;     // Force white text
```

## Mode-Specific Theming

Different modes interpret the wallpaper colors differently:

### Programming Mode
- Uses cooler tones from the palette
- Reduces saturation for less eye strain
- Emphasizes readability

### Gaming Mode
- Uses warmer, more vibrant colors
- Inverted color scheme (accent becomes background)
- Higher contrast for quick glancing

### Focus Mode (Coming Soon)
- Minimal color usage
- Reduced opacity
- Hidden non-essential widgets

## Wallpaper Rotation

Set up automatic wallpaper rotation to enjoy different themes throughout the day:

```bash
# Add to Hyprland config
exec-once = ~/.config/hypr/scripts/wallpaper-rotate.sh 600
```

This changes wallpaper (and theme) every 10 minutes.

## Terminal Integration

Your terminal can also use the same colors:

### Alacritty
The installer sets this up automatically. Colors are at:
`~/.cache/wallust/alacritty-colors.yml`

### Kitty
```bash
# Add to kitty.conf
include ~/.cache/wallust/kitty-colors.conf
```

## Creating Theme Packs

You can create wallpaper packs that work especially well:

1. Create a folder: `~/Pictures/Wallpapers/Ocean-Pack/`
2. Add curated wallpapers with similar color palettes
3. Share with the community!

## Troubleshooting Theming

### Colors not updating?
```bash
# Regenerate colors manually
wallust run ~/Pictures/current-wallpaper.jpg
# Restart AGS
ags quit && cd ~/.config/ags/ags-hyprland-config && ags run app-enhanced.ts
```

### Colors look wrong?
- Try a different wallust backend
- Check if wallpaper has enough color variety
- Ensure wallpaper isn't too dark/light

### Want to keep current theme?
```bash
# Save current color scheme
cp ~/.cache/wallust/ags-colors.scss ~/.config/ags/saved-themes/my-theme.scss
```

## Share Your Themes!

Found a wallpaper that creates an amazing theme? Share it!

1. Take a screenshot of your bar
2. Include the wallpaper
3. Post in Issues with tag `theme-showcase`

The best themes will be featured in our gallery!