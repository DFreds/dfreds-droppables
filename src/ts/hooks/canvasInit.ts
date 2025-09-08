import { DroppableManager } from "../droppable.ts";
import { FolderDropHandler } from "../canvas/folder-drop-handler.ts";
import { TokensOnCanvasHandler } from "../canvas/tokens-on-canvas-handler.ts";
import { Listener } from "./index.ts";
import { TilesOnCanvasHandler } from "../canvas/tiles-on-canvas-handler.ts";
import { SoundsOnCanvasHandler } from "../canvas/sounds-on-canvas-handler.ts";
import { NotesOnCanvasHandler } from "../canvas/notes-on-canvas-handler.ts";
import { SingleActorDropHandler } from "../canvas/single-actor-drop-handler.ts";

const CanvasInit: Listener = {
    listen(): void {
        Hooks.on("canvasInit", (_canvas: any) => {
            const board = document.getElementById("board");
            if (!board) {
                return;
            }

            const defaultOnDrop = board.ondrop;

            board.ondrop = async (event: DragEvent) => {
                const manager = new DroppableManager();

                manager.registerHandler(new SingleActorDropHandler(event));
                manager.registerHandler(new FolderDropHandler(event));
                manager.registerHandler(new TokensOnCanvasHandler(event));
                manager.registerHandler(new TilesOnCanvasHandler(event));
                manager.registerHandler(new SoundsOnCanvasHandler(event));
                manager.registerHandler(new NotesOnCanvasHandler(event));

                const didDrop = await manager.handleDrop();
                if (!didDrop) {
                    defaultOnDrop?.call(board, event);
                }
            };
        });
    },
};

export { CanvasInit };
