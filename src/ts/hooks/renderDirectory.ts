import { Listener } from "./index.ts";
import { dispatchDrop } from "../shared/drop-dispatch.ts";
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
                await dispatchDrop([
                    // JSON import is first so it takes precedence for any directory.
                    new JsonImportHandler({ event, directory }),
                    new ActorDirectoryHandler({ event, directory }),
                    new ItemDirectoryHandler({ event, directory }),
                    new JournalDirectoryHandler({ event, directory }),
                    new SceneDirectoryHandler({ event, directory }),
                    new RollTableDirectoryHandler({ event, directory }),
                    new CardsDirectoryHandler({ event, directory }),
                    new MacroDirectoryHandler({ event, directory }),
                    new PlaylistDirectoryHandler({ event, directory }),
                ]);
            };
        });
    },
};

export { RenderDirectory };
