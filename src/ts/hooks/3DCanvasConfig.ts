import { CanvasDropData } from "../canvas/actor-placement.ts";
import { FolderDropHandler } from "../canvas/folder-drop-handler.ts";
import { Listener } from "./index.ts";

const ThreeDCanvasConfig: Listener = {
    listen(): void {
        Hooks.on("3DCanvasConfig", (config: any) => {
            config.INTERACTIONS.dropFunctions.Folder = async function (event: DragEvent, data: CanvasDropData) {
                canvas.tokens.activate();
                const droppableFolders = new FolderDropHandler(event);
                droppableFolders.data = data;
                await droppableFolders.handleDrop();
            };
        });
    },
};

export { ThreeDCanvasConfig };
