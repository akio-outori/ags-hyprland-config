import { App } from "astal/gtk3"
import styleEnhanced from "./style-minimal-bar.scss"
import BarEnhanced from "./widget/BarEnhanced"
import ShortcutsOverlay from "./widget/ShortcutsOverlay"

App.start({
    css: styleEnhanced,
    main() {
        App.get_monitors().map(BarEnhanced)
        App.get_monitors().map(ShortcutsOverlay)
    },
})