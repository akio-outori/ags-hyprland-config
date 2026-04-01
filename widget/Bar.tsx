import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"

const time = Variable("--:--").poll(1000, "date '+%H:%M'")
const date = Variable("").poll(60000, "date '+%a %b %d'")

// Network stats variables
const networkStats = Variable({ down: "0", up: "0" }).poll(2000, ["bash", "-c", `
    rx1=$(cat /sys/class/net/[ew]*/statistics/rx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    tx1=$(cat /sys/class/net/[ew]*/statistics/tx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    sleep 1
    rx2=$(cat /sys/class/net/[ew]*/statistics/rx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    tx2=$(cat /sys/class/net/[ew]*/statistics/tx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    rx=$((rx2 - rx1))
    tx=$((tx2 - tx1))
    echo "{ \\"down\\": \\"$(numfmt --to=iec $rx)\\", \\"up\\": \\"$(numfmt --to=iec $tx)\\" }"
`], (out) => JSON.parse(out))

// CPU usage variable
const cpuUsage = Variable("0%").poll(2000, ["bash", "-c",
    "top -bn1 | grep 'Cpu(s)' | awk '{print 100 - $8\"%\"}'"
])

// GPU usage variable
const gpuUsage = Variable("0%").poll(2000, ["bash", "-c",
    "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null || echo 0"
], (out) => `${out.trim()}%`)

// CPU temperature variable
const cpuTemp = Variable("0°C").poll(2000, ["bash", "-c",
    "sensors | grep -E '^CPU:.*°C' | awk '{print $2}' | tr -d '+' || echo '0°C'"
])

// GPU temperature variable
const gpuTemp = Variable("0°C").poll(2000, ["bash", "-c",
    "nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null | awk '{print $1\"°C\"}' || echo '0°C'"
])

// Volume variable
const volume = Variable("0").poll(1000, ["bash", "-c",
    "pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+%' | head -1 | tr -d '%'"
])

// Updates available check
const updatesCount = Variable("0").poll(300000, ["bash", "-c",
    "checkupdates 2>/dev/null | wc -l || echo 0"
])

function Clock() {
    return <box className="clock-widget">
        <button
            className="time-display"
            onClicked="gsimplecal"
        >
            <label label={bind(time).as(t => `${t}  ${bind(date).get()}`)} />
        </button>
    </box>
}

function NetworkStats() {
    return <button
        className="network-monitor"
        onClicked="alacritty --class=alacritty-monitor -e bmon"
    >
        <label label={bind(networkStats).as(v => {
            const down = v.down.padEnd(5);
            const up = v.up.padEnd(5);
            return `↓${down} ↑${up}`;
        })} />
    </button>
}

function CpuUsage() {
    return <button
        className="hw-widget"
        onClicked="alacritty --class=alacritty-monitor -e htop"
    >
        <label label={bind(cpuUsage).as(v => `CPU: ${v} ${bind(cpuTemp).get()}`)} />
    </button>
}

function GpuUsage() {
    return <button
        className="hw-widget"
        onClicked="nvidia-settings"
    >
        <label label={bind(gpuUsage).as(v => `GPU: ${v} ${bind(gpuTemp).get()}`)} />
    </button>
}

function VolumeControl() {
    return <button
        className="volume-control"
        onClicked="pavucontrol"
    >
        <label label={bind(volume).as(v => `Vol: ${v}%`)} />
    </button>
}

function UpdateWidget() {
    return <button
        className="updates-widget"
        onClicked="alacritty --class=alacritty-monitor -e garuda-update"
    >
        <label label={bind(updatesCount).as(v => {
            const count = parseInt(v);
            if (count > 0) {
                return `⬆ ${count}`;
            }
            return "✓";
        })} />
    </button>
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP } = Astal.WindowAnchor

    return <window
        className="BarEnhanced"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP}
        application={App}>
        <centerbox className="bar-container">
            <box className="left-modules">
                <button
                    className="launcher-btn"
                    onClicked="wofi --show drun --allow-images"
                >

                </button>
            </box>
            <box className="center-modules">
            </box>
            <box className="right-modules">
                <UpdateWidget />
                <CpuUsage />
                <GpuUsage />
                <NetworkStats />
                <VolumeControl />
                <Clock />
                <button
                    className="power-menu"
                    onClicked="wlogout --protocol layer-shell"
                >
                    ⏻
                </button>
            </box>
        </centerbox>
    </window>
}
