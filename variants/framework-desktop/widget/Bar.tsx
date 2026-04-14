import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"

// Time and date
const time = Variable("--:--").poll(1000, "date '+%H:%M'")
const date = Variable("").poll(60000, "date '+%a %b %d'")

// Unified AMD hardware telemetry (single amdgpu_top call per poll)
// Strix Halo APU exposes both CPU Tctl and GPU Edge temp in one JSON dump.
const hwInfo = Variable({
    cpuTemp: "0",
    gpuTemp: "0",
    gpuWatt: "0",
    vramUsedMiB: "0",
    vramTotalMiB: "0",
}).poll(1000, ["bash", "-c", `
    amdgpu_top -J -n 1 2>/dev/null | jq -c '{
        cpuTemp: ((.devices[0].Sensors."CPU Tctl".value // 0) | tostring),
        gpuTemp: ((.devices[0].Sensors."Edge Temperature".value // 0) | tostring),
        gpuWatt: ((.devices[0].Sensors."Average Power".value // 0) | tostring),
        vramUsedMiB: ((.devices[0].VRAM."Total VRAM Usage".value // 0) | tostring),
        vramTotalMiB: ((.devices[0].VRAM."Total VRAM".value // 0) | tostring)
    }'
`], (out) => {
    try {
        return JSON.parse(out)
    } catch {
        return { cpuTemp: "0", gpuTemp: "0", gpuWatt: "0", vramUsedMiB: "0", vramTotalMiB: "0" }
    }
})

const ramInfo = Variable({ used: "0", total: "0", percent: "0" }).poll(2000, ["bash", "-c", `
    free -m | awk '/^Mem:/ {used=$2-$7; total=$2; percent=int(used/total*100); print "{\\"used\\": \\"" used "\\", \\"total\\": \\"" total "\\", \\"percent\\": \\"" percent "\\"}"}'
`], (out) => JSON.parse(out))

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

// Widget Components
function HardwareMonitor() {
    return <box className="hardware-monitor">
        {/* CPU */}
        <button
            className="hw-widget cpu-widget"
            onClicked="alacritty --class=alacritty-monitor -e htop"
        >
            <box>
                <label label={bind(cpuUsage).as(v => `󰍛 CPU ${v}% `)} />
                <label label={bind(hwInfo).as(v => `${v.cpuTemp}°C`)} />
            </box>
        </button>

        {/* GPU */}
        <button
            className="hw-widget gpu-widget"
            onClicked="alacritty --class=alacritty-monitor -e amdgpu_top"
        >
            <label label={bind(hwInfo).as(v => {
                const usedGiB = (parseInt(v.vramUsedMiB) / 1024).toFixed(1)
                return `󰢮 GPU ${v.gpuWatt}W ${v.gpuTemp}°C ${usedGiB}G`
            })} />
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

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP } = Astal.WindowAnchor

    return <window
        className="BarEnhanced"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP}
        layer={Astal.Layer.TOP}
        application={App}>
        <centerbox className="bar-container">
            <box className="left-modules">
                <LauncherButton />
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
