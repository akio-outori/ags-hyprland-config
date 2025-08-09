import { App } from "astal/gtk3"
import styleEnhanced from "./style-clean-bar.scss"
import BarEnhanced from "./widget/BarEnhanced"

App.start({
    css: styleEnhanced,
    main() {
        App.get_monitors().map(BarEnhanced)
    },
})