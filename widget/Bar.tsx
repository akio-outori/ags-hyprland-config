import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"

const time = Variable("--:--").poll(1000, "date '+%H:%M'")
const date = Variable("").poll(60000, "date '+%a %b %d'")

// Network stats variables
const networkStats = Variable({ down: "0", up: "0" }).poll(2000, ["bash", "-c", `
    rx1=$(cat /sys/class/net/[ew]*/statistics/rx_bytes | awk '{s+=$1} END {print s}')
    tx1=$(cat /sys/class/net/[ew]*/statistics/tx_bytes | awk '{s+=$1} END {print s}')
    sleep 1
    rx2=$(cat /sys/class/net/[ew]*/statistics/rx_bytes | awk '{s+=$1} END {print s}')
    tx2=$(cat /sys/class/net/[ew]*/statistics/tx_bytes | awk '{s+=$1} END {print s}')
    rx=$((rx2 - rx1))
    tx=$((tx2 - tx1))
    echo "{ \\"down\\": \\"$(numfmt --to=iec $rx)\\", \\"up\\": \\"$(numfmt --to=iec $tx)\\" }"
`], (out) => JSON.parse(out))

// CPU usage variable  
const cpuUsage = Variable("0%").poll(2000, ["bash", "-c", 
    "top -bn1 | grep 'Cpu(s)' | awk '{print 100 - $8\"%\"}'"
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
    return <box className="clock-box">
        <label className="clock" label={bind(time)} />
        <button 
            className="date-btn"
            onClicked="gsimplecal"
        >
            <label className="date" label={bind(date)} />
        </button>
    </box>
}

function NetworkStats() {
    return <button 
        className="network"
        onClicked="alacritty --class=alacritty-monitor -e bmon"
    >
        <label label={bind(networkStats).as(v => {
            // Pad the values to maintain consistent width
            const down = v.down.padEnd(5);
            const up = v.up.padEnd(5);
            return `↓${down} ↑${up}`;
        })} />
    </button>
}

function CpuUsage() {
    return <button 
        className="cpu"
        onClicked="alacritty --class=alacritty-monitor -e htop"
    >
        <label label={bind(cpuUsage).as(v => `CPU: ${v}`)} />
    </button>
}

function VolumeControl() {
    return <button 
        className="volume"
        onClicked="pavucontrol"
    >
        <label label={bind(volume).as(v => `Vol: ${v}%`)} />
    </button>
}

function UpdateWidget() {
    return <button 
        className="updates"
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
        className="Bar"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP}
        layer={Astal.Layer.TOP}
        application={App}>
        <centerbox className="bar-content">
            <box className="left">
                <button 
                    className="launcher"
                    onClicked="wofi --show drun --allow-images"
                >
                    Apps
                </button>
            </box>
            <box className="center">
            </box>
            <box className="right">
                <UpdateWidget />
                <CpuUsage />
                <NetworkStats />
                <VolumeControl />
                <Clock />
                <button 
                    className="power-btn"
                    onClicked="wlogout --protocol layer-shell"
                >
                    Power
                </button>
            </box>
        </centerbox>
    </window>
}