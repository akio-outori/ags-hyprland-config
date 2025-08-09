import { readFile } from "astal/file"

export interface Config {
  bar: {
    position: string
    height: number
    margin: number
    padding: {
      horizontal: number
      vertical: number
    }
    modules: {
      left: string[]
      center: string[]
      right: string[]
    }
  }
  appearance: {
    fontSize: number
    fontFamily: string
    fontWeight: string
    borderRadius: number
    opacity: number
  }
  modes: Record<string, {
    name: string
    icon: string
    keybind: string
    notification: string
    hideModules?: string[]
    showBattery?: boolean
  }>
  hardware: Record<string, any>
  widgets: Record<string, any>
  wallust: {
    autoReload: boolean
    colorScheme: string
    transitions: {
      enabled: boolean
      duration: string
      easing: string
    }
  }
  advanced: {
    logLevel: string
    experimental: Record<string, boolean>
  }
}

let configCache: Config | null = null

export function loadConfig(): Config {
  if (configCache) return configCache
  
  try {
    const configPath = `${process.env.HOME}/.config/ags/ags-hyprland-config/config.json`
    const content = readFile(configPath)
    configCache = JSON.parse(content)
    console.log("Config loaded successfully")
    return configCache!
  } catch (error) {
    console.error("Failed to load config, using defaults:", error)
    return getDefaultConfig()
  }
}

export function reloadConfig(): Config {
  configCache = null
  return loadConfig()
}

export function getConfig(): Config {
  return configCache || loadConfig()
}

function getDefaultConfig(): Config {
  return {
    bar: {
      position: "top",
      height: 28,
      margin: 8,
      padding: { horizontal: 12, vertical: 4 },
      modules: {
        left: ["launcher", "shortcuts"],
        center: [],
        right: ["updates", "hardware", "network", "volume", "clock", "power"]
      }
    },
    appearance: {
      fontSize: 14,
      fontFamily: "JetBrainsMono Nerd Font",
      fontWeight: "bold",
      borderRadius: 10,
      opacity: 0.9
    },
    modes: {
      programming: {
        name: "Programming",
        icon: "󰅬",
        keybind: "Super+Ctrl+P",
        notification: "Switched to Programming Mode"
      },
      gaming: {
        name: "Gaming",
        icon: "󰮂",
        keybind: "Super+Ctrl+G",
        notification: "Switched to Gaming Mode"
      }
    },
    hardware: {
      cpu: { enabled: true, showTemperature: true, showUsage: true, updateInterval: 2000 },
      gpu: { enabled: true, showTemperature: true, showWattage: true, updateInterval: 1000 },
      ram: { enabled: true, showPercentage: true, showUsed: true, updateInterval: 2000 },
      network: { enabled: true, showSpeed: true, updateInterval: 2000 }
    },
    widgets: {
      clock: { format24h: true, showDate: true },
      volume: { scrollStep: 5 },
      updates: { checkInterval: 300000, hideWhenZero: true },
      power: { useWallustAccent: true }
    },
    wallust: {
      autoReload: true,
      colorScheme: "~/.cache/wallust/ags-colors.scss",
      transitions: { enabled: true, duration: "0.3s", easing: "ease" }
    },
    advanced: {
      logLevel: "info",
      experimental: { systemTray: false, mediaPlayer: false, notificationCenter: false }
    }
  }
}