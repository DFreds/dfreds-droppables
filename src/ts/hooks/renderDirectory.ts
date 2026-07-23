import { Listener } from "./index.ts";
import { DroppableManager } from "../shared/droppable-manager.ts";
import { JsonImportHandler } from "../sidebar/json-import-handler.ts";
import { ActorDirectoryHandler } from "../sidebar/actor-directory-handler.ts";
import { ItemDirectoryHandler } from "../sidebar/item-directory-handler.ts";
import { JournalDirectoryHandler } from "../sidebar/journal-directory-handler.ts";
import { SceneDirectoryHandler } from "../sidebar/scene-directory-handler.ts";
import { RollTableDirectoryHandler } from "../sidebar/roll-table-directory-handler.ts";
import { CardsDirectoryHandler } from "../sidebar/cards-directory-handler.ts";
import { MacroDirectoryHandler } from "../sidebar/macro-directory-handler.ts";
import { PlaylistDirectoryHandler } from "../sidebar/playlist-directory-handler.ts";

/**
 * Attaches file/JSON drop handling to every document directory in the sidebar. The
 * `renderDocumentDirectory` hook fires for all directory subclasses (Actors, Items, Journal, etc.)
 * because ApplicationV2 fires render hooks for each class in the inheritance chain.
 */
const RenderDirectory: Listener = {
    listen(): void {
        Hooks.on("renderDocumentDirectory", (directory: any, element: any) => {
            // Allow the whole directory area (including empty space) to be a drop target.
            element.ondragover = (event: DragEvent) => event.preventDefault();

            element.ondrop = async (event: DragEvent) => {
                const manager = new DroppableManager();

                // JSON import is registered first so it takes precedence for any directory.
                manager.registerHandler(new JsonImportHandler({ event, directory }));
                manager.registerHandler(new ActorDirectoryHandler({ event, directory }));
                manager.registerHandler(new ItemDirectoryHandler({ event, directory }));
                manager.registerHandler(new JournalDirectoryHandler({ event, directory }));
                manager.registerHandler(new SceneDirectoryHandler({ event, directory }));
                manager.registerHandler(new RollTableDirectoryHandler({ event, directory }));
                manager.registerHandler(new CardsDirectoryHandler({ event, directory }));
                manager.registerHandler(new MacroDirectoryHandler({ event, directory }));
                manager.registerHandler(new PlaylistDirectoryHandler({ event, directory }));

                await manager.handleDrop();
            };
        });
    },
};

export { RenderDirectory };
