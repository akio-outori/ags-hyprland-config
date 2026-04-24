import app from "ags/gtk3/app"
import { Astal, Gtk, Gdk } from "ags/gtk3"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"
import { readFile, readFileAsync } from "ags/file"

// --- Poll safety wrapper ---------------------------------------------------
// createPoll's subprocess form has no .catch() and no timeout: any hang or
// non-zero exit leaves the widget silently frozen until AGS is restarted.
// safePoll uses the functional overload and guarantees that a thrown / rejected
// `fn` returns `prev` instead of killing the tick chain.
function safePoll<T>(
  init: T,
  interval: number,
  fn: (prev: T) => Promise<T>,
) {
  return createPoll(init, interval, async (prev: T) => {
    try { return await fn(prev) } catch { return prev }
  })
}

// Run a shell command with a hard timeout. `timeoutSec` must be < interval.
async function execTimed(cmd: string, timeoutSec: number): Promise<string> {
  return execAsync(["bash", "-c", `timeout ${timeoutSec} ${cmd}`])
}

// --- Sysfs discovery (once at startup; indices shift across boots) --------
function findHwmonByName(name: string): string | null {
  for (let i = 0; i < 32; i++) {
    try {
      const n = readFile(`/sys/class/hwmon/hwmon${i}/name`).trim()
      if (n === name) return `/sys/class/hwmon/hwmon${i}`
    } catch { /* missing index, continue */ }
  }
  return null
}

const AMDGPU_HWMON  = findHwmonByName("amdgpu")
const K10TEMP_HWMON = findHwmonByName("k10temp")
const DRM_DEVICE    = "/sys/class/drm/card1/device"

// --- Time / date (trivial; date command rarely hangs) ---------------------
const time = createPoll("--:--", 1000, "date '+%H:%M'")
const date = createPoll("", 60000, "date '+%a %b %d'")

// --- Hardware telemetry (sysfs; no subprocess) ----------------------------
type HwInfo = {
  cpuTemp: string
  gpuTemp: string
  gpuWatt: string
  vramUsedMiB: string
  vramTotalMiB: string
}

async function readHwInfo(prev: HwInfo): Promise<HwInfo> {
  const results = await Promise.all([
    K10TEMP_HWMON
      ? readFileAsync(`${K10TEMP_HWMON}/temp1_input`).then(s => String(Math.round(parseInt(s) / 1000)))
      : Promise.resolve(prev.cpuTemp),
    AMDGPU_HWMON
      ? readFileAsync(`${AMDGPU_HWMON}/temp1_input`).then(s => String(Math.round(parseInt(s) / 1000)))
      : Promise.resolve(prev.gpuTemp),
    AMDGPU_HWMON
      ? readFileAsync(`${AMDGPU_HWMON}/power1_average`).then(s => String(Math.round(parseInt(s) / 1_000_000)))
      : Promise.resolve(prev.gpuWatt),
    readFileAsync(`${DRM_DEVICE}/mem_info_vram_used`).then(s => String(Math.round(parseInt(s) / 1024 / 1024))),
    readFileAsync(`${DRM_DEVICE}/mem_info_vram_total`).then(s => String(Math.round(parseInt(s) / 1024 / 1024))),
  ])
  return {
    cpuTemp: results[0], gpuTemp: results[1], gpuWatt: results[2],
    vramUsedMiB: results[3], vramTotalMiB: results[4],
  }
}

const hwInfo = safePoll<HwInfo>(
  { cpuTemp: "0", gpuTemp: "0", gpuWatt: "0", vramUsedMiB: "0", vramTotalMiB: "0" },
  1000,
  readHwInfo,
)

// --- RAM from /proc/meminfo ----------------------------------------------
type RamInfo = { used: string; total: string; percent: string }

const ramInfo = safePoll<RamInfo>(
  { used: "0", total: "0", percent: "0" },
  2000,
  async () => {
    const txt = await readFileAsync("/proc/meminfo")
    const kv: Record<string, number> = {}
    for (const line of txt.split("\n")) {
      const m = line.match(/^(\w+):\s+(\d+)/)
      if (m) kv[m[1]] = parseInt(m[2])
    }
    // Match `free`: used = MemTotal - MemAvailable (values are kB; we want MiB)
    const totalMiB = Math.round(kv.MemTotal / 1024)
    const usedMiB  = Math.round((kv.MemTotal - kv.MemAvailable) / 1024)
    const percent  = totalMiB > 0 ? Math.round((usedMiB / totalMiB) * 100) : 0
    return { used: String(usedMiB), total: String(totalMiB), percent: String(percent) }
  },
)

// --- CPU % from /proc/stat (delta vs previous read) ----------------------
type CpuPrev = { total: number; idle: number }
let cpuPrev: CpuPrev | null = null

const cpuUsage = safePoll<string>("0", 2000, async () => {
  const txt = await readFileAsync("/proc/stat")
  const line = txt.split("\n")[0]                    // "cpu  user nice sys idle iowait irq softirq steal ..."
  const f = line.trim().split(/\s+/).slice(1).map(Number)
  const idle = f[3] + (f[4] || 0)                    // idle + iowait
  const total = f.reduce((a, b) => a + b, 0)
  if (!cpuPrev) { cpuPrev = { total, idle }; return "0" }
  const dTotal = total - cpuPrev.total
  const dIdle  = idle  - cpuPrev.idle
  cpuPrev = { total, idle }
  if (dTotal <= 0) return "0"
  return String(Math.round(100 * (1 - dIdle / dTotal)))
})

// --- Network rx/tx delta from /sys/class/net -----------------------------
type NetInfo = { down: string; up: string }
type NetPrev = { rx: number; tx: number; t: number }
let netPrev: NetPrev | null = null

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const u = ["K", "M", "G", "T"]
  let x = n / 1024, i = 0
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++ }
  return `${x.toFixed(x < 10 ? 1 : 0)} ${u[i]}iB`
}

async function sumIfaceBytes(stat: "rx_bytes" | "tx_bytes"): Promise<number> {
  const ifs = await execAsync(["bash", "-c", "ls /sys/class/net/ | grep -E '^(e|w)'"])
  let sum = 0
  for (const ifn of ifs.trim().split("\n").filter(Boolean)) {
    try {
      const v = await readFileAsync(`/sys/class/net/${ifn}/statistics/${stat}`)
      sum += parseInt(v)
    } catch { /* interface gone, skip */ }
  }
  return sum
}

const networkStats = safePoll<NetInfo>(
  { down: "0 B", up: "0 B" },
  2000,
  async () => {
    const [rx, tx] = await Promise.all([sumIfaceBytes("rx_bytes"), sumIfaceBytes("tx_bytes")])
    const now = Date.now()
    if (!netPrev) { netPrev = { rx, tx, t: now }; return { down: "0 B", up: "0 B" } }
    const dt = Math.max(1, (now - netPrev.t) / 1000)
    const dRx = Math.max(0, rx - netPrev.rx) / dt
    const dTx = Math.max(0, tx - netPrev.tx) / dt
    netPrev = { rx, tx, t: now }
    return { down: `${humanBytes(Math.round(dRx))}/s`, up: `${humanBytes(Math.round(dTx))}/s` }
  },
)

// --- Volume via pactl (no sysfs; subprocess with 1 s timeout) ------------
type VolInfo = { level: string; muted: boolean }

const volume = safePoll<VolInfo>(
  { level: "0", muted: false },
  1000,
  async () => {
    const out = await execTimed(
      `vol=$(pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+%' | head -1 | tr -d '%'); ` +
      `m=$(pactl get-sink-mute @DEFAULT_SINK@ | grep -q yes && echo true || echo false); ` +
      `echo "{\\"level\\":\\"$vol\\",\\"muted\\":$m}"`,
      1,
    )
    return JSON.parse(out)
  },
)

// --- Pacman updates (checkupdates locks DB; 30 s timeout) ----------------
const updatesCount = safePoll<string>(
  "0",
  300_000,
  async () => {
    const out = await execTimed("checkupdates 2>/dev/null | wc -l", 30)
    return out.trim() || "0"
  },
)

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
