import DocumentDirectory from "@client/applications/sidebar/document-directory.mjs";
import { DroppableHandler } from "../shared/drop-dispatch.ts";
import { Settings } from "../settings.ts";
import { UploadedFile, getFilesFromEvent, isImageFile, uploadToPersistent } from "../shared/files.ts";
import { getTargetFolderId } from "./util.ts";

/**
 * Shared logic for sidebar handlers that upload one or more media files and create a document of a
 * single type from them. Subclasses declare the document type, storage subdirectory, and how to turn
 * uploaded files into document creation sources.
 */
abstract class BaseDirectoryHandler implements DroppableHandler {
    data: File[];

    protected event: DragEvent;
    protected directory: DocumentDirectory<any>;
    protected settings = new Settings();

    /** The document type this handler creates (must match the directory's document name). */
    protected abstract documentName: string;

    /** The persistent storage subdirectory that uploaded files are written to. */
    protected abstract subdir: string;

    constructor({ event, directory }: { event: DragEvent; directory: DocumentDirectory<any> }) {
        this.event = event;
        this.directory = directory;
        this.data = this.retrieveData();
    }

    /** Predicate for the files this handler accepts. Defaults to images. */
    protected filePredicate(file: File): boolean {
        return isImageFile(file);
    }

    /**
     * Prompts for a subtype for each accepted file before anything is uploaded. Returning undefined
     * aborts the drop (e.g. the user dismissed a dialog). Defaults to no subtypes.
     */
    protected async promptForTypes(): Promise<string[] | undefined> {
        return [];
    }

    /**
     * Builds document creation sources from the uploaded files. Returning undefined aborts creation.
     */
    protected abstract buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined>;

    canHandleDrop(): boolean {
        if (
            !this.settings.sidebarDragUpload ||
            this.directory.documentName !== this.documentName ||
            !this.data.length
        ) {
            return false;
        }

        if (!game.user.isGM && !game.user.hasPermission("FILES_UPLOAD")) {
            ui.notifications.warn(game.i18n.localize("Droppables.NoUploadFiles"));
            return false;
        }

        if (!(this.directory.documentClass as any).canUserCreate(game.user)) {
            ui.notifications.warn(game.i18n.localize("Droppables.NoCreateDocuments"));
            return false;
        }

        return true;
    }

    retrieveData(): File[] {
        return getFilesFromEvent(this.event, (file) => this.filePredicate(file));
    }

    async handleDrop(): Promise<boolean> {
        this.event.preventDefault();

        const types = await this.promptForTypes();
        if (!types) return true;

        const uploaded = await this.uploadAll(types);
        if (!uploaded.length) return true;

        const sources = await this.buildSources(uploaded);
        if (!sources?.length) return true;

        const folder = getTargetFolderId(this.event);
        const withFolder = sources.map((source) => ({ ...source, folder }));

        await (this.directory.documentClass as any).createDocuments(withFolder);

        return true;
    }

    /**
     * Uploads every accepted file to this handler's storage subdirectory.
     *
     * @param types - The chosen subtype for each accepted file, in the same order.
     * @returns The successfully uploaded files paired with their storage paths and subtypes.
     */
    protected async uploadAll(types: string[]): Promise<UploadedFile[]> {
        const uploaded: UploadedFile[] = [];

        for (const [index, file] of this.data.entries()) {
            const filePath = await uploadToPersistent(this.subdir, file);
            if (filePath) {
                uploaded.push({ fileName: file.name, filePath, type: types[index] });
            }
        }

        return uploaded;
    }
}

export { BaseDirectoryHandler };
