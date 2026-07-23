import DocumentDirectory from "@client/applications/sidebar/document-directory.mjs";
import { DroppableHandler } from "../shared/droppable-manager.ts";
import { Settings } from "../settings.ts";
import { fileNameToDocumentName, getFilesFromEvent, isAudioFile, uploadToPersistent } from "../shared/files.ts";
import { getTargetFolderId } from "./util.ts";

/**
 * Creates a Playlist from dropped audio files, adding each uploaded file as a sound in the playlist.
 */
class PlaylistDirectoryHandler implements DroppableHandler<File[]> {
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
        if (!this.#settings.sidebarDragUpload || this.#directory.documentName !== "Playlist" || !this.data.length) {
            return false;
        }

        if (!game.user.isGM && !game.user.hasPermission("FILES_UPLOAD")) {
            ui.notifications.warn(game.i18n.localize("Droppables.NoUploadFiles"));
            return false;
        }

        if (!(this.#directory.documentClass as any).canUserCreate(game.user)) {
            ui.notifications.warn(game.i18n.localize("Droppables.NoCreateDocuments"));
            return false;
        }

        return true;
    }

    retrieveData(): File[] {
        return getFilesFromEvent(this.#event, isAudioFile);
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const sounds = [];
        for (const file of this.data) {
            const path = await uploadToPersistent("playlists", file);
            if (path) {
                sounds.push({ name: fileNameToDocumentName(file.name), path });
            }
        }

        if (!sounds.length) return true;

        const name =
            this.data.length === 1
                ? fileNameToDocumentName(this.data[0].name)
                : game.i18n.localize("Droppables.NewPlaylist");

        await (this.#directory.documentClass as any).createDocuments([
            {
                name,
                folder: getTargetFolderId(this.#event),
                sounds,
            },
        ]);

        return true;
    }
}

export { PlaylistDirectoryHandler };
