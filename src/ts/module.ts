import "../styles/style.scss"; // Keep or else vite will not include this
import { Droppable } from "./droppable.ts";
import { Settings } from "./settings.ts";
import { id as MODULE_ID } from "@static/module.json";
import { libWrapper } from "@static/lib/shim.ts";

Hooks.once("init", () => {
    new Settings().registerSettings();
});

Hooks.once("setup", () => {
    const droppable = new Droppable();

    // https://github.com/ruipin/fvtt-lib-wrapper/#134-shim
    // Note: Don't simply pass in the function onCanvasDrop, or you lose 'this' referring to Droppable
    libWrapper.register(
        MODULE_ID,
        "Canvas.prototype._onDrop",
        function (
            this: Canvas,
            wrapped: (event: DragEvent) => any,
            event: DragEvent,
        ) {
            droppable.onCanvasDrop(wrapped, event);
        },
    );
});

// TODO need to double check this works in v11 when it's updated
Hooks.on("3DCanvasConfig", (config: any) => {
    config.INTERACTIONS.dropFunctions.Folder = async function (
        event: any,
        data: any,
    ) {
        canvas.tokens.activate();
        const droppable = new Droppable();
        droppable.handleDrop({ event, data, errorCallback: () => {} });
    };
});
