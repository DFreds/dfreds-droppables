import {
    DroppableFolders,
    FolderDropData,
} from "../canvas/droppable-folders.ts";
import { Listener } from "./index.ts";

const ThreeDCanvasConfig: Listener = {
    listen(): void {
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
    },
};

export { ThreeDCanvasConfig };
