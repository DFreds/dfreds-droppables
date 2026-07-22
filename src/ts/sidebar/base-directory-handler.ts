import DocumentDirectory from "@client/applications/sidebar/document-directory.mjs";
import { SidebarDroppableHandler } from "./sidebar-droppable-manager.ts";
import { Settings } from "../settings.ts";
import { UploadedFile, getMatchingFiles, getTargetFolderId, uploadToPersistent } from "./util.ts";

const IMAGE_TYPES = "image";

/**
 * Shared logic for sidebar handlers that upload one or more media files and create a document of a
 * single type from them. Subclasses declare the document type, storage subdirectory, and how to turn
 * uploaded files into document creation sources.
 */
abstract class BaseDirectoryHandler implements SidebarDroppableHandler<File[]> {
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
        return file.type.includes(IMAGE_TYPES);
    }

    /**
     * Builds document creation sources from the uploaded files. May prompt the user (e.g. for a
     * subtype). Returning undefined aborts creation (e.g. the user dismissed a dialog).
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
        return getMatchingFiles(this.event, (file) => this.filePredicate(file));
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.event.preventDefault();

        const uploaded = await this.uploadAll();
        const sources = await this.buildSources(uploaded);
        if (!sources?.length) return true;

        const folder = getTargetFolderId(this.event);
        const withFolder = sources.map((source) => ({ ...source, folder }));

        await (this.directory.documentClass as any).createDocuments(withFolder);

        return true;
    }

    protected async uploadAll(): Promise<UploadedFile[]> {
        const uploaded: UploadedFile[] = [];

        for (const file of this.data) {
            const filePath = await uploadToPersistent(this.subdir, file);
            if (filePath) {
                uploaded.push({ fileName: file.name, filePath });
            }
        }

        return uploaded;
    }
}

export { BaseDirectoryHandler };
