# Variant: framework-desktop

Machine-specific overrides for **Framework Desktop** (AMD Ryzen AI Max+ 395 / Radeon 8060S Strix Halo, CachyOS, SDDM).

## What's different from base

| Area | Base | This variant |
|---|---|---|
| GPU telemetry | `nvidia-smi` | `amdgpu_top -J -n 1` (JSON) |
| GPU click action | `nvidia-settings` | `alacritty -e amdgpu_top` |
| CPU temperature | `sensors \| grep Tccd` (dual-CCD Ryzen) | `amdgpu_top` JSON → `CPU Tctl` (monolithic APU, no CCD labels) |
| Battery | N/A | N/A (desktop — no change) |
| Terminal keybind | Implicit in base hyprland.conf | `Super+Return` added (base additions.conf reassigns `Super+Q` to killactive) |

## Override layout

Files under `variants/framework-desktop/` with the same relative path as base files take precedence when `install.sh` (in this folder) is run. Base files untouched.

```
variants/framework-desktop/
├── widget/Bar.tsx              → overrides /widget/Bar.tsx
├── config.json                 → overrides /config.json
├── config/hypr/additions.conf  → overrides /config/hypr/additions.conf
└── install.sh                  → variant-aware installer
```

## Prerequisites

```
paru -S aylurs-gtk-shell-git wallust wlogout hyprlauncher
sudo pacman -S awww pavucontrol brightnessctl playerctl grim slurp \
               wl-clipboard cliphist ttf-jetbrains-mono-nerd noto-fonts-emoji \
               ttf-font-awesome lm_sensors gnome-calendar bmon amdgpu_top jq
```

Note: scripts use `awww` (not `swww`). `waybar` is not required — AGS replaces it.

## Adding more variants later

Mirror this structure under `variants/<name>/` and copy the install.sh pattern.
