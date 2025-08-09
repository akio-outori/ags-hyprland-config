#!/bin/bash

# Universal Installation Script for AGS Hyprland Config
# Supports: Arch, Fedora, Ubuntu/Debian, openSUSE

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     AGS Hyprland Config - Universal Installer         ║${NC}"
    echo -e "${BLUE}║          Dynamic Wallpaper Theming Setup              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Detect distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_FAMILY=$ID_LIKE
    else
        print_error "Cannot detect distribution"
        exit 1
    fi

    print_info "Detected distribution: $OS"
    
    case $OS in
        arch|manjaro|endeavouros)
            DISTRO="arch"
            PKG_MANAGER="pacman"
            PKG_INSTALL="sudo pacman -S --noconfirm"
            AUR_HELPER=$(command -v paru || command -v yay || echo "")
            ;;
        fedora)
            DISTRO="fedora"
            PKG_MANAGER="dnf"
            PKG_INSTALL="sudo dnf install -y"
            ;;
        ubuntu|debian|pop|mint)
            DISTRO="debian"
            PKG_MANAGER="apt"
            PKG_INSTALL="sudo apt-get install -y"
            ;;
        opensuse*|suse*)
            DISTRO="opensuse"
            PKG_MANAGER="zypper"
            PKG_INSTALL="sudo zypper install -y"
            ;;
        *)
            print_error "Unsupported distribution: $OS"
            echo "Supported: Arch, Fedora, Ubuntu/Debian, openSUSE"
            exit 1
            ;;
    esac
}

# Check if running on Wayland/Hyprland
check_environment() {
    if [ "$XDG_SESSION_TYPE" != "wayland" ]; then
        print_info "Warning: Not running on Wayland. This config is designed for Hyprland."
    fi
    
    if ! command -v hyprctl &> /dev/null; then
        print_info "Hyprland not detected. Installing Hyprland is recommended."
        read -p "Do you want to install Hyprland? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_hyprland
        fi
    else
        print_success "Hyprland detected"
    fi
}

# Install Hyprland
install_hyprland() {
    print_info "Installing Hyprland..."
    
    case $DISTRO in
        arch)
            $PKG_INSTALL hyprland
            ;;
        fedora)
            $PKG_INSTALL hyprland
            ;;
        debian)
            print_info "Adding Hyprland PPA..."
            sudo add-apt-repository -y ppa:hyprland/ppa
            sudo apt-get update
            $PKG_INSTALL hyprland
            ;;
        opensuse)
            $PKG_INSTALL hyprland
            ;;
    esac
}

# Install dependencies
install_dependencies() {
    print_header
    print_info "Installing dependencies for $DISTRO..."
    
    case $DISTRO in
        arch)
            # Core dependencies
            $PKG_INSTALL git base-devel nodejs npm gtk3 gtk-layer-shell \
                         typescript gjs gnome-bluetooth-3.0 upower networkmanager \
                         gobject-introspection libpulse libsoup3 glib2
            
            # AUR packages
            if [ -n "$AUR_HELPER" ]; then
                print_info "Installing AUR packages..."
                $AUR_HELPER -S --noconfirm aylurs-gtk-shell-git wallust swww \
                               ttf-jetbrains-mono-nerd wofi alacritty wlogout
            else
                print_error "No AUR helper found. Please install paru or yay first."
                echo "Install with: git clone https://aur.archlinux.org/paru.git && cd paru && makepkg -si"
                exit 1
            fi
            ;;
            
        fedora)
            # Enable COPR repos
            print_info "Enabling COPR repositories..."
            sudo dnf copr enable -y erikreider/SwayNotificationCenter
            sudo dnf copr enable -y solopasha/hyprland
            
            # Install packages
            $PKG_INSTALL git nodejs npm gtk3 gtk-layer-shell typewriter-fonts \
                        gjs gnome-bluetooth-libs upower NetworkManager \
                        gobject-introspection pulseaudio-libs libsoup3 glib2-devel \
                        alacritty wofi
            
            # Build AGS from source
            print_info "Building AGS from source..."
            build_ags_from_source
            
            # Build wallust from source
            print_info "Building wallust from source..."
            build_wallust_from_source
            
            # Install swww
            install_swww_from_source
            ;;
            
        debian)
            # Update and install dependencies
            sudo apt-get update
            $PKG_INSTALL git nodejs npm libgtk-3-dev libgtk-layer-shell-dev \
                        gjs gir1.2-gtk-3.0 gir1.2-glib-2.0 gir1.2-nm-1.0 \
                        gir1.2-bluetooth-3.0 gir1.2-upowerglib-1.0 \
                        libpulse-dev libsoup-3.0-dev fonts-jetbrains-mono \
                        alacritty wofi
            
            # Build from source
            build_ags_from_source
            build_wallust_from_source
            install_swww_from_source
            ;;
            
        opensuse)
            $PKG_INSTALL git nodejs npm gtk3-devel gtk-layer-shell-devel \
                        typewriter-fonts gjs gobject-introspection \
                        NetworkManager-devel bluez-devel upower-devel \
                        libpulse-devel libsoup-devel alacritty wofi
            
            build_ags_from_source
            build_wallust_from_source
            install_swww_from_source
            ;;
    esac
    
    print_success "Dependencies installed"
}

# Build AGS from source
build_ags_from_source() {
    print_info "Building AGS from source..."
    
    # Install build dependencies
    case $DISTRO in
        fedora)
            $PKG_INSTALL meson ninja-build gcc-c++ cmake
            ;;
        debian)
            $PKG_INSTALL meson ninja-build g++ cmake
            ;;
        opensuse)
            $PKG_INSTALL meson ninja gcc-c++ cmake
            ;;
    esac
    
    # Clone and build
    cd /tmp
    git clone --recursive https://github.com/Aylur/ags.git
    cd ags
    npm install
    meson setup build
    meson compile -C build
    sudo meson install -C build
    cd -
    
    print_success "AGS built and installed"
}

# Build wallust from source  
build_wallust_from_source() {
    print_info "Building wallust from source..."
    
    # Install Rust if not present
    if ! command -v cargo &> /dev/null; then
        print_info "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
    fi
    
    # Clone and build wallust
    cd /tmp
    git clone https://github.com/explosion-mental/wallust.git
    cd wallust
    cargo build --release
    sudo cp target/release/wallust /usr/local/bin/
    cd -
    
    print_success "Wallust built and installed"
}

# Install swww from source
install_swww_from_source() {
    print_info "Installing swww..."
    
    # Install Rust if not present
    if ! command -v cargo &> /dev/null; then
        print_info "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
    fi
    
    cd /tmp
    git clone https://github.com/LGFae/swww.git
    cd swww
    cargo build --release
    sudo cp target/release/swww /usr/local/bin/
    sudo cp target/release/swww-daemon /usr/local/bin/
    cd -
    
    print_success "swww installed"
}

# Setup configuration
setup_config() {
    print_info "Setting up AGS configuration..."
    
    # Backup existing config if present
    if [ -d "$HOME/.config/ags" ]; then
        print_info "Backing up existing AGS config..."
        mv "$HOME/.config/ags" "$HOME/.config/ags.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Copy configuration
    cp -r . "$HOME/.config/ags/ags-hyprland-config"
    
    # Create necessary directories
    mkdir -p "$HOME/.config/hypr/scripts"
    mkdir -p "$HOME/.cache/wallust"
    mkdir -p "$HOME/Pictures/Wallpapers/Wallpaper Rotation"
    
    # Setup wallust config
    print_info "Setting up wallust configuration..."
    cp -r config/wallust/* "$HOME/.config/wallust/" 2>/dev/null || true
    
    # Make scripts executable
    chmod +x "$HOME/.config/ags/ags-hyprland-config/"*.sh
    chmod +x "$HOME/.config/hypr/scripts/"*.sh 2>/dev/null || true
    
    print_success "Configuration setup complete"
}

# Setup Hyprland integration
setup_hyprland() {
    print_info "Setting up Hyprland integration..."
    
    # Add to Hyprland config
    HYPR_CONFIG="$HOME/.config/hypr/hyprland.conf"
    
    if [ -f "$HYPR_CONFIG" ]; then
        # Check if already configured
        if ! grep -q "ags-hyprland-config" "$HYPR_CONFIG"; then
            cat >> "$HYPR_CONFIG" << 'EOF'

# AGS Hyprland Config Integration
exec-once = cd ~/.config/ags/ags-hyprland-config && ags run app-enhanced.ts
exec-once = swww-daemon

# Mode switching keybinds
bind = $mainMod CTRL, P, exec, ~/.config/ags/ags-hyprland-config/switch-mode.sh programming
bind = $mainMod CTRL, G, exec, ~/.config/ags/ags-hyprland-config/switch-mode.sh gaming

# Wallpaper switching
bind = $mainMod, W, exec, ~/.config/hypr/scripts/wallpaper-switch.sh
EOF
            print_success "Hyprland configuration updated"
        else
            print_info "Hyprland already configured for AGS"
        fi
    else
        print_error "Hyprland config not found at $HYPR_CONFIG"
        print_info "Please add the following to your Hyprland config manually:"
        echo "exec-once = cd ~/.config/ags/ags-hyprland-config && ags run app-enhanced.ts"
    fi
}

# Install sample wallpapers
install_wallpapers() {
    print_info "Installing sample wallpapers..."
    
    WALLPAPER_DIR="$HOME/Pictures/Wallpapers/Wallpaper Rotation"
    
    # Download some sample wallpapers from unsplash
    if command -v wget &> /dev/null; then
        wget -q -O "$WALLPAPER_DIR/wallpaper1.jpg" "https://source.unsplash.com/random/3840x2160/?nature"
        wget -q -O "$WALLPAPER_DIR/wallpaper2.jpg" "https://source.unsplash.com/random/3840x2160/?mountain"
        wget -q -O "$WALLPAPER_DIR/wallpaper3.jpg" "https://source.unsplash.com/random/3840x2160/?forest"
        print_success "Sample wallpapers downloaded"
    fi
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."
    
    local missing=()
    
    # Check required commands
    command -v ags &> /dev/null || missing+=("ags")
    command -v wallust &> /dev/null || missing+=("wallust")
    command -v swww &> /dev/null || missing+=("swww")
    command -v wofi &> /dev/null || missing+=("wofi")
    
    if [ ${#missing[@]} -eq 0 ]; then
        print_success "All components installed successfully!"
        return 0
    else
        print_error "Missing components: ${missing[*]}"
        return 1
    fi
}

# Main installation flow
main() {
    clear
    print_header
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please don't run this script as root"
        exit 1
    fi
    
    print_info "Starting installation..."
    echo
    
    # Detect distribution
    detect_distro
    
    # Check environment
    check_environment
    
    # Install dependencies
    install_dependencies
    
    # Setup configuration
    setup_config
    
    # Setup Hyprland integration
    setup_hyprland
    
    # Install sample wallpapers
    read -p "Do you want to download sample wallpapers? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_wallpapers
    fi
    
    # Verify installation
    if verify_installation; then
        echo
        print_header
        print_success "Installation complete!"
        echo
        echo -e "${GREEN}Next steps:${NC}"
        echo "1. Restart Hyprland or run: hyprctl reload"
        echo "2. The AGS bar should appear automatically"
        echo "3. Change wallpaper to see dynamic theming in action"
        echo "4. Press Super+Ctrl+P for Programming mode"
        echo "5. Press Super+Ctrl+G for Gaming mode"
        echo
        echo -e "${BLUE}Enjoy your new dynamic themed desktop!${NC}"
    else
        echo
        print_error "Installation completed with errors"
        echo "Please check the missing components and install them manually"
    fi
}

# Run main function
main "$@"