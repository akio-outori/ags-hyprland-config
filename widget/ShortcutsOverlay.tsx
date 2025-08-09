import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"

const isVisible = Variable(false)

const shortcuts = [
    { keys: "Super + Q", action: "Close Window" },
    { keys: "Super + 1-9", action: "Switch Workspace" },
    { keys: "Super + Shift + 1-9", action: "Move Window to Workspace" },
    { keys: "Super + V", action: "Toggle Floating" },
    { keys: "Super + F", action: "Toggle Fullscreen" },
    { keys: "Super + Arrow Keys", action: "Move Focus" },
    { keys: "Super + Shift + Arrow", action: "Move Window" },
    { keys: "Super + Mouse Drag", action: "Move/Resize Window" },
    { keys: "Super + Ctrl + P", action: "Programming Mode" },
    { keys: "Super + Ctrl + G", action: "Gaming Mode" },
    { keys: "Escape", action: "Close This Overlay" }
]

function ShortcutRow({ keys, action }: { keys: string, action: string }) {
    return <box className="shortcut-row">
        <label className="shortcut-key" label={keys} />
        <label className="shortcut-action" label={action} />
    </box>
}

export function toggleShortcuts() {
    isVisible.set(!isVisible.get())
}

export default function ShortcutsOverlay(gdkmonitor: Gdk.Monitor) {
    const { CENTER } = Astal.WindowAnchor

    return <window
        className="ShortcutsOverlay"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        anchor={CENTER}
        layer={Astal.Layer.OVERLAY}
        application={App}
        visible={bind(isVisible)}
        onKeyPressEvent={(self, event) => {
            const keyval = event.get_keyval()[1]
            if (keyval === Gdk.KEY_Escape) {
                isVisible.set(false)
                return true
            }
            return false
        }}>
        <box className="shortcuts-container" vertical>
            <box className="shortcuts-header">
                <label className="shortcuts-title" label="Keyboard Shortcuts" />
                <button 
                    className="shortcuts-close"
                    onClicked={() => isVisible.set(false)}
                >
                    <label label="✕" />
                </button>
            </box>
            <scrollable className="shortcuts-scroll" vscroll={Gtk.PolicyType.AUTOMATIC} hscroll={Gtk.PolicyType.NEVER}>
                <box className="shortcuts-list" vertical>
                    {shortcuts.map(s => <ShortcutRow {...s} />)}
                </box>
            </scrollable>
        </box>
    </window>
}