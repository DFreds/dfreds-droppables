import { libWrapper } from "@static/lib/shim.ts";
import { DroppableFolders } from "../canvas/droppable-folders.ts";
import { DroppableTokensOnCanvas } from "../canvas/droppable-tokens-on-canvas.ts";
import { DroppableTilesOnCanvas } from "../canvas/droppable-tiles-on-canvas.ts";
import { DroppableSoundsOnCanvas } from "../canvas/droppable-sounds-on-canvas.ts";
import { DroppableNotesOnCanvas } from "../canvas/droppable-notes-on-canvas.ts";
import { MODULE_ID } from "../constants.ts";
import { Listener } from "./index.ts";

const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", async () => {
            if (BUILD_MODE === "development") {
                CONFIG.debug.hooks = true;
            }

            libWrapper.register(
                MODULE_ID,
                "Canvas.prototype._onDrop",
                async function (
                    this: Canvas,
                    wrapped: (event: DragEvent) => any,
                    event: DragEvent,
                ) {
                    const canvasDroppables = [
                        new DroppableFolders(event),
                        new DroppableTokensOnCanvas(event),
                        new DroppableTilesOnCanvas(event),
                        new DroppableSoundsOnCanvas(event),
                        new DroppableNotesOnCanvas(event),
                    ];

                    // const url = this.event.dataTransfer?.getData("Text");

                    let didDrop = false;
                    for (const droppable of canvasDroppables) {
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
    },
};

export { Setup };
