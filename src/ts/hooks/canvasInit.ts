import { DroppableFolders } from "../canvas/droppable-folders.ts";
import { DroppableNotesOnCanvas } from "../canvas/droppable-notes-on-canvas.ts";
import { DroppableSoundsOnCanvas } from "../canvas/droppable-sounds-on-canvas.ts";
import { DroppableTilesOnCanvas } from "../canvas/droppable-tiles-on-canvas.ts";
import { DroppableTokensOnCanvas } from "../canvas/droppable-tokens-on-canvas.ts";
import { Listener } from "./index.ts";

const CanvasInit: Listener = {
    listen(): void {
        Hooks.on("canvasInit", (_canvas: any) => {
            const board = document.getElementById("board");
            if (!board) {
                return;
            }

            const defaultOnDrop = board.ondrop;

            // TODO re-investigate #onDrop `dropCanvasData` after updates
            board.ondrop = async (event: DragEvent) => {
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
                    defaultOnDrop?.call(board, event);
                }
            };
        });
    },
};

export { CanvasInit };
