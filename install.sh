#!/bin/bash

# AGS + Hyprland Dynamic Theming Setup Script
# https://github.com/akio-outori/ags-hyprland-config

set -e

echo "🎨 AGS + Hyprland Dynamic Theming Setup"
echo "========================================"

# Check if running on Arch-based system
if ! command -v pacman &> /dev/null; then
    echo "❌ This script is designed for Arch-based systems"
    exit 1
fi

# Function to install packages
install_packages() {
    echo "📦 Installing required packages..."
    
    # Check for yay (AUR helper)
    if ! command -v yay &> /dev/null; then
        echo "⚠️  yay not found. Installing packages with pacman only."
        echo "   You may need to install aylurs-gtk-shell manually from AUR"
        sudo pacman -S --needed --noconfirm \
            wallust swww alacritty hyprland git
    else
        yay -S --needed --noconfirm \
            aylurs-gtk-shell wallust swww alacritty hyprland git
    fi
}

# Function to backup existing configs
backup_configs() {
    echo "💾 Backing up existing configurations..."
    
    BACKUP_DIR="$HOME/.config/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    for config in ags wallust hypr/scripts alacritty; do
        if [ -d "$HOME/.config/$config" ]; then
            echo "   Backing up ~/.config/$config"
            cp -r "$HOME/.config/$config" "$BACKUP_DIR/"
        fi
    done
    
    echo "   Backup created at: $BACKUP_DIR"
}

# Function to install configurations
install_configs() {
    echo "⚙️  Installing configurations..."
    
    # Create directories
    mkdir -p ~/.config/{ags,wallust,hypr/scripts}
    mkdir -p ~/.cache/wallust
    
    # Copy AGS config
    cp -r config/ags/* ~/.config/ags/
    echo "   ✓ AGS configuration installed"
    
    # Copy wallust config
    cp -r config/wallust/* ~/.config/wallust/
    echo "   ✓ Wallust configuration installed"
    
    # Copy Hyprland scripts
    cp config/hypr/scripts/* ~/.config/hypr/scripts/
    chmod +x ~/.config/hypr/scripts/*.sh
    echo "   ✓ Hyprland scripts installed"
    
    # Setup alacritty
    if [ -f ~/.config/alacritty/alacritty.yml ]; then
        echo "   ⚠️  Please manually update ~/.config/alacritty/alacritty.yml"
        echo "      See config/alacritty/modifications.yml for required changes"
    fi
}

# Function to setup wallpapers directory
setup_wallpapers() {
    echo "🖼️  Setting up wallpapers directory..."
    
    mkdir -p "$HOME/Pictures/Wallpapers/Wallpaper Rotation"
    
    if [ -z "$(ls -A "$HOME/Pictures/Wallpapers/Wallpaper Rotation" 2>/dev/null)" ]; then
        echo "   📁 Created wallpaper directory: ~/Pictures/Wallpapers/Wallpaper Rotation"
        echo "   🎯 Add your wallpaper images to this directory"
    else
        echo "   ✓ Wallpaper directory already exists with images"
    fi
}

# Function to add hyprland config
update_hyprland_config() {
    echo "🪟 Updating Hyprland configuration..."
    
    HYPR_CONF="$HOME/.config/hypr/hyprland.conf"
    
    if [ -f "$HYPR_CONF" ]; then
        # Check if our additions are already present
        if grep -q "startup.sh" "$HYPR_CONF"; then
            echo "   ✓ Hyprland config already updated"
        else
            echo "" >> "$HYPR_CONF"
            echo "# AGS + Wallust Dynamic Theming Setup" >> "$HYPR_CONF"
            cat config/hypr/additions.conf >> "$HYPR_CONF"
            echo "   ✓ Added AGS config to hyprland.conf"
        fi
    else
        echo "   ⚠️  No hyprland.conf found. Please add contents of config/hypr/additions.conf manually"
    fi
}

# Function to generate initial colors
generate_initial_colors() {
    echo "🎨 Generating initial color scheme..."
    
    # Find a wallpaper to use
    WALLPAPER=$(find "$HOME/Pictures/Wallpapers/Wallpaper Rotation" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | head -1)
    
    if [ -n "$WALLPAPER" ]; then
        wallust run "$WALLPAPER"
        echo "   ✓ Generated color scheme from: $(basename "$WALLPAPER")"
    else
        echo "   ⚠️  No wallpapers found. Please add images to ~/Pictures/Wallpapers/Wallpaper Rotation"
        echo "      Then run: wallust run /path/to/your/wallpaper.jpg"
    fi
}

# Main installation flow
main() {
    echo
    read -p "Continue with installation? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Installation cancelled"
        exit 0
    fi
    
    install_packages
    backup_configs  
    install_configs
    setup_wallpapers
    update_hyprland_config
    generate_initial_colors
    
    echo
    echo "🎉 Installation complete!"
    echo
    echo "Next steps:"
    echo "1. Add wallpaper images to ~/Pictures/Wallpapers/Wallpaper Rotation"
    echo "2. Update ~/.config/alacritty/alacritty.yml (see config/alacritty/modifications.yml)"
    echo "3. Restart Hyprland or reboot"
    echo "4. Use Super+W to switch wallpapers and test theming"
    echo
    echo "Keybindings:"
    echo "- Super+W: Switch wallpaper"  
    echo "- Click CPU widget: Opens htop"
    echo "- Click Network widget: Opens bmon"
    echo "- Click Date: Opens calendar"
    echo
    echo "Repository: https://github.com/akio-outori/ags-hyprland-config"
}

main "$@"