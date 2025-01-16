import "../styles/style.scss"; // Keep or else vite will not include this
import { DroppableFolders, FolderDropData } from "./droppable-folders.ts";
import { Settings } from "./settings.ts";
import { libWrapper } from "@static/lib/shim.ts";
import { DroppableTokensOnCanvas } from "./droppable-tokens-on-canvas.ts";
import { DroppableTilesOnCanvas } from "./droppable-tiles-on-canvas.ts";
import { DroppableSoundsOnCanvas } from "./droppable-sounds-on-canvas.ts";
import { DroppableNotesOnCanvas } from "./droppable-notes-on-canvas.ts";
import { MODULE_ID } from "./constants.ts";

Hooks.once("init", async () => {
    const settings = new Settings();
    settings.registerSettings();
});

Hooks.once("setup", async () => {
    libWrapper.register(
        MODULE_ID,
        "Canvas.prototype._onDrop",
        async function (
            this: Canvas,
            wrapped: (event: DragEvent) => any,
            event: DragEvent,
        ) {
            const droppables = [
                new DroppableFolders(event),
                new DroppableTokensOnCanvas(event),
                new DroppableTilesOnCanvas(event),
                new DroppableSoundsOnCanvas(event),
                new DroppableNotesOnCanvas(event),
            ];

            // const url = this.event.dataTransfer?.getData("Text");

            let didDrop = false;
            for (const droppable of droppables) {
                didDrop = await droppable.handleDrop();
                if (didDrop) {
                    break;
                }
            }

            if (!didDrop) {
                wrapped(event);
            }
        },
    );
});

// TODO need to double check this works in v11 when it's updated
Hooks.on("3DCanvasConfig", (config: any) => {
    config.INTERACTIONS.dropFunctions.Folder = async function (
        event: DragEvent,
        data: FolderDropData,
    ) {
        canvas.tokens.activate();
        const droppableFolders = new DroppableFolders(event);
        droppableFolders.data = data;
        await droppableFolders.handleDrop();
    };
});
