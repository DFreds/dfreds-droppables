import DocumentDirectory from "@client/applications/sidebar/document-directory.mjs";
import { CorePageType } from "@common/documents/journal-entry-page.mjs";
import { SidebarDroppableHandler } from "./sidebar-droppable-manager.ts";
import { Settings } from "../settings.ts";
import { fileNameToDocumentName, getMatchingFiles, getTargetFolderId, uploadToPersistent } from "./util.ts";

interface JournalPageData {
    fileName: string;
    type: CorePageType;
    src?: string;
    text?: string;
}

/**
 * Creates a JournalEntry from each dropped file. Images, PDFs, and videos are uploaded and become a
 * page of the matching type; text files are read inline into a text page. Mirrors the file handling
 * of the canvas notes handler, but creates directory entries instead of canvas notes.
 */
class JournalDirectoryHandler implements SidebarDroppableHandler<File[]> {
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
        if (!this.#settings.sidebarDragUpload || this.#directory.documentName !== "JournalEntry" || !this.data.length) {
            return false;
        }

        // Only image/pdf/video files need to be uploaded; text is read inline.
        const needsUpload = this.data.some((file) => !file.type.includes("text"));
        if (needsUpload && !game.user.isGM && !game.user.hasPermission("FILES_UPLOAD")) {
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
        return getMatchingFiles(this.#event, (file) => {
            return (
                file.type.includes("image") ||
                file.type.includes("pdf") ||
                file.type.includes("video") ||
                file.type.includes("text")
            );
        });
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const folder = getTargetFolderId(this.#event);
        const entrySources = [];

        for (const file of this.data) {
            const page = await this.#buildPage(file);
            entrySources.push({
                name: fileNameToDocumentName(file.name),
                folder,
                pages: [
                    {
                        name: fileNameToDocumentName(file.name),
                        type: page.type,
                        src: page.src,
                        text: { content: page.text },
                    },
                ],
            });
        }

        await (this.#directory.documentClass as any).createDocuments(entrySources);

        return true;
    }

    async #buildPage(file: File): Promise<JournalPageData> {
        const type = this.#determineFileType(file);

        if (type === "text") {
            const text = await file.text();
            return { fileName: file.name, type, text };
        }

        const src = await uploadToPersistent("journals", file);
        return { fileName: file.name, type, src };
    }

    #determineFileType(file: File): CorePageType {
        if (file.type.includes("pdf")) {
            return "pdf";
        }
        if (file.type.includes("video")) {
            return "video";
        }
        if (file.type.includes("text")) {
            return "text";
        }

        return "image";
    }
}

export { JournalDirectoryHandler };
