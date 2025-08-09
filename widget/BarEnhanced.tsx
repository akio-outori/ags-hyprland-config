import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"
import { toggleShortcuts } from "./ShortcutsOverlay"

// Time and date
const time = Variable("--:--").poll(1000, "date '+%H:%M'")
const date = Variable("").poll(60000, "date '+%a %b %d'")

// Hardware monitoring variables
const gpuInfo = Variable({ temp: "0", wattage: "0", mem: "0" }).poll(1000, ["bash", "-c", `
    nvidia-smi --query-gpu=temperature.gpu,power.draw,memory.used,memory.total --format=csv,noheader,nounits | 
    awk -F', ' '{printf "{\\"temp\\": \\"%s\\", \\"wattage\\": \\"%d\\", \\"mem\\": \\"%d/%d\\"}", $1, int($2), $3, $4}'
`], (out) => {
    try {
        const parsed = JSON.parse(out);
        return {
            temp: parsed.temp || "0",
            wattage: parsed.wattage || "0",
            mem: parsed.mem || "0/0"
        };
    } catch {
        return { temp: "0", wattage: "0", mem: "0/0" };
    }
})

const ramInfo = Variable({ used: "0", total: "0", percent: "0" }).poll(2000, ["bash", "-c", `
    free -m | awk '/^Mem:/ {used=$2-$7; total=$2; percent=int(used/total*100); print "{\\"used\\": \\"" used "\\", \\"total\\": \\"" total "\\", \\"percent\\": \\"" percent "\\"}"}'
`], (out) => JSON.parse(out))

const cpuTemp = Variable({ ccd1: "0", ccd2: "0" }).poll(1000, ["bash", "-c", 
    `sensors | grep 'Tccd' | awk '{gsub(/[°C+]/, "", $2); temps[NR]=int($2)} END {print "{\\"ccd1\\": \\"" temps[1] "\\", \\"ccd2\\": \\"" temps[2] "\\"}"}'`
], (out) => JSON.parse(out))

const cpuUsage = Variable("0").poll(2000, ["bash", "-c", 
    "grep 'cpu ' /proc/stat | awk '{usage=int(100-($5/($2+$3+$4+$5+$6+$7+$8))*100)} END {print usage}'"
])

// Network stats with better formatting
const networkStats = Variable({ down: "0 B", up: "0 B" }).poll(2000, ["bash", "-c", `
    rx1=$(cat /sys/class/net/[ew]*/statistics/rx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    tx1=$(cat /sys/class/net/[ew]*/statistics/tx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    sleep 1
    rx2=$(cat /sys/class/net/[ew]*/statistics/rx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    tx2=$(cat /sys/class/net/[ew]*/statistics/tx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    rx=$((rx2 - rx1))
    tx=$((tx2 - tx1))
    echo "{ \\"down\\": \\"$(numfmt --to=iec-i --suffix=B $rx)\\", \\"up\\": \\"$(numfmt --to=iec-i --suffix=B $tx)\\" }"
`], (out) => JSON.parse(out))

// Audio controls
const volume = Variable({ level: "0", muted: false }).poll(1000, ["bash", "-c", `
    vol=$(pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+%' | head -1 | tr -d '%')
    muted=$(pactl get-sink-mute @DEFAULT_SINK@ | grep -q "yes" && echo "true" || echo "false")
    echo "{ \\"level\\": \\"$vol\\", \\"muted\\": $muted }"
`], (out) => JSON.parse(out))

// Updates with better package detection
const updatesCount = Variable("0").poll(300000, ["bash", "-c", 
    "checkupdates 2>/dev/null | wc -l || paru -Qu 2>/dev/null | wc -l || echo 0"
])

// Current workspace (for Hyprland)
const activeWorkspace = Variable("1").poll(500, ["bash", "-c",
    "hyprctl activewindow -j 2>/dev/null | jq -r '.workspace.id // 1'"
])

// Profile mode (programming/gaming) - reads from file to sync with hotkeys
const profileMode = Variable("programming").poll(500, ["bash", "-c", 
    "cat /tmp/ags-profile-mode 2>/dev/null || echo programming"
])

// Widget Components
function ProfileSwitch() {
    return <box className="profile-switch">
        <button 
            className={bind(profileMode).as(m => m === "programming" ? "profile-btn active" : "profile-btn")}
            onClicked={() => profileMode.set("programming")}
        >
            <label label="󰅬" />
        </button>
        <button 
            className={bind(profileMode).as(m => m === "gaming" ? "profile-btn active" : "profile-btn")}
            onClicked={() => profileMode.set("gaming")}
        >
            <label label="󰮂" />
        </button>
    </box>
}

function WorkspaceIndicator() {
    const workspaces = [1, 2, 3, 4, 5];
    
    return <box className="workspaces">
        {workspaces.map(ws => (
            <button
                className={bind(activeWorkspace).as(active => 
                    active === ws.toString() ? "workspace-btn active" : "workspace-btn"
                )}
                onClicked={`hyprctl dispatch workspace ${ws}`}
            >
                <label label={ws.toString()} />
            </button>
        ))}
    </box>
}

function HardwareMonitor() {
    return <box className="hardware-monitor">
        {/* CPU */}
        <button 
            className="hw-widget cpu-widget"
            onClicked="alacritty --class=alacritty-monitor -e htop"
        >
            <box>
                <label label={bind(cpuUsage).as(v => `󰍛 CPU ${v}% `)} />
                <label label={bind(cpuTemp).as(v => `${v.ccd1}°/${v.ccd2}°C`)} />
            </box>
        </button>

        {/* GPU */}
        <button 
            className="hw-widget gpu-widget"
            onClicked="nvidia-settings"
        >
            <label label={bind(gpuInfo).as(v => `󰢮 GPU ${v.wattage}W ${v.temp}°C`)} />
        </button>

        {/* RAM */}
        <button 
            className="hw-widget ram-widget"
            onClicked="alacritty --class=alacritty-monitor -e htop"
        >
            <label label={bind(ramInfo).as(v => `󰘚 RAM ${v.percent}% ${(parseInt(v.used)/1024).toFixed(1)}G`)} />
        </button>
    </box>
}

function NetworkMonitor() {
    return <button 
        className="network-monitor"
        onClicked="alacritty --class=alacritty-monitor -e bmon"
    >
        <label label={bind(networkStats).as(v => `󰈀 ↓${v.down} ↑${v.up}`)} />
    </button>
}

function VolumeControl() {
    return <button 
        className="volume-control"
        onClicked="pavucontrol"
    >
        <label label={bind(volume).as(v => 
            `${v.muted ? "󰖁" : v.level > 50 ? "󰕾" : v.level > 0 ? "󰖀" : "󰕿"} ${v.level}%`
        )} />
    </button>
}

function Clock() {
    return <box className="clock-widget">
        <button 
            className="time-display"
            onClicked="gnome-calendar"
        >
            <label label={bind(time).as(t => `${t} ${bind(date).get()}`)} />
        </button>
    </box>
}

function UpdateNotifier() {
    return <button 
        className={bind(updatesCount).as(count => 
            parseInt(count) > 0 ? "updates-widget has-updates" : "updates-widget"
        )}
        onClicked="alacritty --class=alacritty-monitor -e paru"
    >
        <label label={bind(updatesCount).as(count => 
            parseInt(count) > 0 ? `󰚰 ${count}` : "󰄬"
        )} />
    </button>
}

function PowerMenu() {
    return <button 
        className="power-menu"
        onClicked="wlogout --protocol layer-shell"
    >
        <label label="󰐥" />
    </button>
}

function LauncherButton() {
    return <button 
        className="launcher-btn"
        onClicked="wofi --show drun --allow-images"
    >
        <label label="󱓞" />
    </button>
}

function ShortcutsButton() {
    return <button 
        className="shortcuts-btn"
        onClicked={() => toggleShortcuts()}
    >
        <label label="󰌌" />
    </button>
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP } = Astal.WindowAnchor

    return <window
        className="BarEnhanced"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP}
        layer={Astal.Layer.TOP}
        application={App}>
        <centerbox className={bind(profileMode).as(mode => `bar-container ${mode}-mode`)}>
            <box className="left-modules">
                <LauncherButton />
                <ShortcutsButton />
            </box>
            
            <box className="center-modules">
            </box>
            
            <box className="right-modules">
                <UpdateNotifier />
                <HardwareMonitor />
                <NetworkMonitor />
                <VolumeControl />
                <Clock />
                <PowerMenu />
            </box>
        </centerbox>
    </window>
}