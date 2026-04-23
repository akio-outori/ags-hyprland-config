import app from "ags/gtk3/app"
import { Astal, Gtk, Gdk } from "ags/gtk3"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

// Time and date
const time = createPoll("--:--", 1000, "date '+%H:%M'")
const date = createPoll("", 60000, "date '+%a %b %d'")

// Unified AMD hardware telemetry (single amdgpu_top call per poll).
// Strix Halo APU exposes both CPU Tctl and GPU Edge temp in one JSON dump.
type HwInfo = {
  cpuTemp: string
  gpuTemp: string
  gpuWatt: string
  vramUsedMiB: string
  vramTotalMiB: string
}

const hwInfo = createPoll<HwInfo>(
  { cpuTemp: "0", gpuTemp: "0", gpuWatt: "0", vramUsedMiB: "0", vramTotalMiB: "0" },
  1000,
  ["bash", "-c", `
    amdgpu_top -J -n 1 2>/dev/null | jq -c '{
      cpuTemp: ((.devices[0].Sensors."CPU Tctl".value // 0) | tostring),
      gpuTemp: ((.devices[0].Sensors."Edge Temperature".value // 0) | tostring),
      gpuWatt: ((.devices[0].Sensors."Average Power".value // 0) | tostring),
      vramUsedMiB: ((.devices[0].VRAM."Total VRAM Usage".value // 0) | tostring),
      vramTotalMiB: ((.devices[0].VRAM."Total VRAM".value // 0) | tostring)
    }'
  `],
  (out) => {
    try { return JSON.parse(out) as HwInfo }
    catch { return { cpuTemp: "0", gpuTemp: "0", gpuWatt: "0", vramUsedMiB: "0", vramTotalMiB: "0" } }
  },
)

const ramInfo = createPoll(
  { used: "0", total: "0", percent: "0" },
  2000,
  ["bash", "-c",
    `free -m | awk '/^Mem:/ {used=$2-$7; total=$2; percent=int(used/total*100); print "{\\"used\\": \\"" used "\\", \\"total\\": \\"" total "\\", \\"percent\\": \\"" percent "\\"}"}'`,
  ],
  (out) => {
    try { return JSON.parse(out) } catch { return { used: "0", total: "0", percent: "0" } }
  },
)

const cpuUsage = createPoll("0", 2000, ["bash", "-c",
  "grep 'cpu ' /proc/stat | awk '{usage=int(100-($5/($2+$3+$4+$5+$6+$7+$8))*100)} END {print usage}'",
])

const networkStats = createPoll(
  { down: "0 B", up: "0 B" },
  2000,
  ["bash", "-c", `
    rx1=$(cat /sys/class/net/[ew]*/statistics/rx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    tx1=$(cat /sys/class/net/[ew]*/statistics/tx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    sleep 1
    rx2=$(cat /sys/class/net/[ew]*/statistics/rx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    tx2=$(cat /sys/class/net/[ew]*/statistics/tx_bytes 2>/dev/null | awk '{s+=$1} END {print s}')
    rx=$((rx2 - rx1))
    tx=$((tx2 - tx1))
    echo "{ \\"down\\": \\"$(numfmt --to=iec-i --suffix=B $rx)\\", \\"up\\": \\"$(numfmt --to=iec-i --suffix=B $tx)\\" }"
  `],
  (out) => {
    try { return JSON.parse(out) } catch { return { down: "0 B", up: "0 B" } }
  },
)

const volume = createPoll(
  { level: "0", muted: false as boolean },
  1000,
  ["bash", "-c", `
    vol=$(pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+%' | head -1 | tr -d '%')
    muted=$(pactl get-sink-mute @DEFAULT_SINK@ | grep -q "yes" && echo "true" || echo "false")
    echo "{ \\"level\\": \\"$vol\\", \\"muted\\": $muted }"
  `],
  (out) => {
    try { return JSON.parse(out) } catch { return { level: "0", muted: false } }
  },
)

const updatesCount = createPoll("0", 300000, ["bash", "-c",
  "checkupdates 2>/dev/null | wc -l || paru -Qu 2>/dev/null | wc -l || echo 0",
])

function HardwareMonitor() {
  return (
    <box class="hardware-monitor">
      <button
        class="hw-widget cpu-widget"
        onClicked={() => execAsync("alacritty --class=alacritty-monitor -e htop")}
      >
        <box>
          <label label={cpuUsage.as((v) => `󰍛 CPU ${v}% `)} />
          <label label={hwInfo.as((v) => `${v.cpuTemp}°C`)} />
        </box>
      </button>
      <button
        class="hw-widget gpu-widget"
        onClicked={() => execAsync("amdgpu_top --gui")}
      >
        <label label={hwInfo.as((v) => {
          const usedGiB = (parseInt(v.vramUsedMiB) / 1024).toFixed(1)
          return `󰢮 GPU ${v.gpuWatt}W ${v.gpuTemp}°C ${usedGiB}G`
        })} />
      </button>
      <button
        class="hw-widget ram-widget"
        onClicked={() => execAsync("alacritty --class=alacritty-monitor -e htop")}
      >
        <label label={ramInfo.as((v) => `󰘚 RAM ${v.percent}% ${(parseInt(v.used) / 1024).toFixed(1)}G`)} />
      </button>
    </box>
  )
}

function NetworkMonitor() {
  return (
    <button
      class="network-monitor"
      onClicked={() => execAsync("alacritty --class=alacritty-monitor -e bmon")}
    >
      <label label={networkStats.as((v) => `󰈀 ↓${v.down} ↑${v.up}`)} />
    </button>
  )
}

function VolumeControl() {
  return (
    <button class="volume-control" onClicked={() => execAsync("pavucontrol")}>
      <label label={volume.as((v) => {
        const lvl = parseInt(v.level)
        const icon = v.muted ? "󰖁" : lvl > 50 ? "󰕾" : lvl > 0 ? "󰖀" : "󰕿"
        return `${icon} ${v.level}%`
      })} />
    </button>
  )
}

function Clock() {
  return (
    <box class="clock-widget">
      <button class="time-display" onClicked={() => execAsync("gnome-calendar")}>
        <label label={time.as((t) => `${t} ${date.get()}`)} />
      </button>
    </box>
  )
}

function UpdateNotifier() {
  return (
    <button
      class={updatesCount.as((c) => (parseInt(c) > 0 ? "updates-widget has-updates" : "updates-widget"))}
      onClicked={() => execAsync("alacritty --class=alacritty-monitor -e paru")}
    >
      <label label={updatesCount.as((c) => (parseInt(c) > 0 ? `󰚰 ${c}` : "󰄬"))} />
    </button>
  )
}

function PowerMenu() {
  return (
    <button class="power-menu" onClicked={() => execAsync("wlogout --protocol layer-shell")}>
      <label label="󰐥" />
    </button>
  )
}

function LauncherButton() {
  return (
    <button class="launcher-btn" onClicked={() => execAsync("wofi --show drun --allow-images")}>
      <label label="󱓞" />
    </button>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP } = Astal.WindowAnchor

  return (
    <window
      class="BarEnhanced"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP}
      layer={Astal.Layer.TOP}
      application={app}
    >
      <centerbox class="bar-container">
        <box $type="start" class="left-modules">
          <LauncherButton />
        </box>
        <box $type="center" class="center-modules" />
        <box $type="end" class="right-modules">
          <UpdateNotifier />
          <HardwareMonitor />
          <NetworkMonitor />
          <VolumeControl />
          <Clock />
          <PowerMenu />
        </box>
      </centerbox>
    </window>
  )
}
