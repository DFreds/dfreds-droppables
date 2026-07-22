import DocumentDirectory from "@client/applications/sidebar/document-directory.mjs";
import { SidebarDroppableHandler } from "./sidebar-droppable-manager.ts";
import { Settings } from "../settings.ts";
import { getMatchingFiles, getTargetFolderId, isJsonFile } from "./util.ts";

const { readTextFromFile } = foundry.utils;

/**
 * Imports dropped JSON exports as new documents of the directory's type, using Foundry's built-in
 * import mechanism (the same one behind a directory's "Import Data" button). Applies to every
 * directory, so it is registered before the media handlers.
 */
class JsonImportHandler implements SidebarDroppableHandler<File[]> {
    data: File[];

    #event: DragEvent;
    #directory: DocumentDirectory<any>;
    #settings = new Settings();

    constructor({ event, directory }: { event: DragEvent; directory: DocumentDirectory<any> }) {
        this.#event = event;
        this.#directory = directory;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        if (!this.#settings.sidebarDragUpload || !this.data.length) {
            return false;
        }

        if (!(this.#directory.documentClass as any).canUserCreate(game.user)) {
            ui.notifications.warn(game.i18n.localize("Droppables.NoCreateDocuments"));
            return false;
        }

        return true;
    }

    retrieveData(): File[] {
        return getMatchingFiles(this.#event, isJsonFile);
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const documentClass = this.#directory.documentClass as any;
        const folder = getTargetFolderId(this.#event);

        for (const file of this.data) {
            try {
                const json = await readTextFromFile(file);
                const imported = await documentClass.fromImport(JSON.parse(json));
                await documentClass.create({ ...imported.toObject(), folder }, { keepId: false });
            } catch (error) {
                console.error(error);
                ui.notifications.error(game.i18n.localize("Droppables.ImportFailed", { fileName: file.name }));
            }
        }

        return true;
    }
}

export { JsonImportHandler };
