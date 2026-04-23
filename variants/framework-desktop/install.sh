#!/usr/bin/env bash
# Variant installer: framework-desktop
# Overlays variants/framework-desktop/* on top of base repo files.
# Does NOT install packages — prerequisites in variants/framework-desktop/README.md.

set -euo pipefail

VARIANT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$VARIANT_DIR/../.." && pwd)"

echo "🎨 AGS + Hyprland — framework-desktop variant"
echo "   Repo:    $REPO_ROOT"
echo "   Variant: $VARIANT_DIR"
echo

# Sanity check: prereqs
missing=()
for bin in ags wallust awww wofi wlogout amdgpu_top jq; do
    command -v "$bin" >/dev/null 2>&1 || missing+=("$bin")
done
if ((${#missing[@]})); then
    echo "❌ Missing commands: ${missing[*]}"
    echo "   See variants/framework-desktop/README.md for install list."
    exit 1
fi

read -p "Continue with installation? (y/N): " -n 1 -r
echo
[[ $REPLY =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }

# Resolve an overlay path: variant first, then base
overlay() {
    local rel="$1"
    if [ -e "$VARIANT_DIR/$rel" ]; then
        echo "$VARIANT_DIR/$rel"
    elif [ -e "$REPO_ROOT/$rel" ]; then
        echo "$REPO_ROOT/$rel"
    else
        return 1
    fi
}

# Backup
BACKUP_DIR="$HOME/.config/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
for d in ags wallust hypr/scripts; do
    [ -d "$HOME/.config/$d" ] && cp -r "$HOME/.config/$d" "$BACKUP_DIR/" 2>/dev/null || true
done
[ -f "$HOME/.config/hypr/hyprland.conf" ] && cp "$HOME/.config/hypr/hyprland.conf" "$BACKUP_DIR/" || true
echo "💾 Backup → $BACKUP_DIR"

# Dirs
mkdir -p "$HOME/.config/ags/ags-hyprland-config"
mkdir -p "$HOME/.config/wallust"
mkdir -p "$HOME/.config/hypr/scripts"
mkdir -p "$HOME/.cache/wallust"
mkdir -p "$HOME/Pictures/Wallpapers/Wallpaper Rotation"

# --- AGS app: copy full project tree, then overlay variant files ---
echo "📦 Installing AGS project..."
rsync -a --delete \
    --exclude=variants \
    --exclude=.git \
    --exclude=install.sh \
    --exclude=install-universal.sh \
    --exclude=node_modules \
    --exclude=screenshots \
    --exclude=wiki \
    "$REPO_ROOT/" "$HOME/.config/ags/ags-hyprland-config/"

# Overlay variant overrides (Bar.tsx, config.json)
[ -f "$VARIANT_DIR/widget/Bar.tsx" ] && \
    cp "$VARIANT_DIR/widget/Bar.tsx" "$HOME/.config/ags/ags-hyprland-config/widget/Bar.tsx" && \
    echo "   ✓ widget/Bar.tsx (AMD override)"
[ -f "$VARIANT_DIR/config.json" ] && \
    cp "$VARIANT_DIR/config.json" "$HOME/.config/ags/ags-hyprland-config/config.json" && \
    echo "   ✓ config.json (AMD override)"

# AGS 3 project plumbing: node_modules symlinks + generated types
AGS_DIR="$HOME/.config/ags/ags-hyprland-config"
mkdir -p "$AGS_DIR/node_modules"
ln -sfn /usr/share/ags/js "$AGS_DIR/node_modules/ags"
ln -sfn /usr/share/ags/js/node_modules/gnim "$AGS_DIR/node_modules/gnim"
echo "   ✓ node_modules symlinks"

if [ ! -d "$AGS_DIR/@girs" ]; then
    echo "   ⏳ generating type stubs (ags types)..."
    ( cd "$AGS_DIR" && ags types >/dev/null 2>&1 ) && echo "   ✓ @girs generated" || echo "   ⚠ ags types failed (bar may still run)"
fi

# --- Wallust config (base only; no variant override yet) ---
if [ -d "$REPO_ROOT/config/wallust" ]; then
    cp -r "$REPO_ROOT/config/wallust/." "$HOME/.config/wallust/"
    echo "   ✓ wallust config"
fi

# --- Hyprland scripts ---
if [ -d "$REPO_ROOT/config/hypr/scripts" ]; then
    cp "$REPO_ROOT/config/hypr/scripts/"* "$HOME/.config/hypr/scripts/"
    chmod +x "$HOME/.config/hypr/scripts/"*.sh
    # Base startup.sh uses 'cd ~/.config/ags' but the project lives in a
    # subdir. Retarget it.
    sed -i 's|cd ~/.config/ags && ags run app.ts|cd ~/.config/ags/ags-hyprland-config \&\& ags run app.ts|g' \
        "$HOME/.config/hypr/scripts/startup.sh"
    echo "   ✓ hypr/scripts (startup.sh path fixed)"
fi

# --- Hyprland conf: append variant additions (deduped by marker) ---
HYPR_CONF="$HOME/.config/hypr/hyprland.conf"
MARKER="# BEGIN ags-hyprland-config:framework-desktop"
END_MARKER="# END ags-hyprland-config:framework-desktop"
ADDITIONS="$(overlay config/hypr/additions.conf)"

if [ -f "$HYPR_CONF" ]; then
    if grep -qF "$MARKER" "$HYPR_CONF"; then
        # Replace existing block
        tmp="$(mktemp)"
        awk -v s="$MARKER" -v e="$END_MARKER" '
            $0==s {skip=1}
            !skip {print}
            $0==e {skip=0}
        ' "$HYPR_CONF" > "$tmp"
        {
            cat "$tmp"
            echo "$MARKER"
            cat "$ADDITIONS"
            echo "$END_MARKER"
        } > "$HYPR_CONF"
        rm -f "$tmp"
        echo "   ✓ hyprland.conf (block replaced)"
    else
        {
            echo ""
            echo "$MARKER"
            cat "$ADDITIONS"
            echo "$END_MARKER"
        } >> "$HYPR_CONF"
        echo "   ✓ hyprland.conf (block appended)"
    fi
else
    echo "   ⚠️  $HYPR_CONF not found — please add contents of $ADDITIONS manually"
fi

# --- Initial wallust run if a wallpaper exists ---
WP="$(find "$HOME/Pictures/Wallpapers/Wallpaper Rotation" -maxdepth 1 -type f \
        \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' \) 2>/dev/null | head -1 || true)"
if [ -n "$WP" ]; then
    wallust run "$WP" && echo "   ✓ wallust seeded from $(basename "$WP")"
else
    echo "   ℹ️  No wallpapers found. Drop some into ~/Pictures/Wallpapers/Wallpaper Rotation"
    echo "      then: wallust run <path>"
fi

echo
echo "🎉 Done."
echo "Next:"
echo "  1. Reload Hyprland:  hyprctl reload"
echo "  2. Start AGS:        cd ~/.config/ags/ags-hyprland-config && ags run app.ts"
echo "  3. Drop a wallpaper in ~/Pictures/Wallpapers/Wallpaper Rotation"
echo "  4. Alacritty users: add to alacritty.yml (or migrate to alacritty.toml):"
echo "       import: [ ~/.cache/wallust/alacritty-colors.yml ]"
