import { CanvasDroppableHandler } from "../canvas-droppable-manager.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";
import { CorePageType, JournalEntryPageSource } from "@common/documents/journal-entry-page.mjs";
import { JournalEntrySource, NoteSource } from "@client/documents/_module.mjs";
import { USER_PERMISSIONS } from "@common/constants.mjs";

const { FilePicker } = foundry.applications.apps;

interface NoteUploadData {
    response?: any;
    text?: string;
    type: CorePageType;
    fileName: string;
}

class NotesOnCanvasHandler implements CanvasDroppableHandler<FilesDropData> {
    data: FilesDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        const isGM = game.user.isGM;
        const url = this.#getDropUrl();
        const urlType = url ? this.#determineUrlType(url) : undefined;

        // Check basic requirements
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.name?.includes("NotesLayer") ||
            (!this.data.files.length && !urlType)
        ) {
            return false;
        }

        // Check permissions for non-GM users
        if (!isGM) {
            const permissions = [
                // Only require file upload permission when we actually need to upload files.
                ...(!urlType && this.data.files.length
                    ? [
                        {
                            permission: "FILES_UPLOAD",
                            message: "Droppables.NoUploadFiles",
                        },
                    ]
                    : []),
                {
                    permission: "JOURNAL_CREATE",
                    message: "Droppables.NoCreateJournals",
                },
                {
                    permission: "NOTE_CREATE",
                    message: "Droppables.NoCreateNotes",
                },
            ];

            for (const { permission, message } of permissions) {
                if (
                    !game.user.hasPermission(permission as keyof typeof USER_PERMISSIONS)
                ) {
                    ui.notifications.warn(game.i18n.localize(message));
                    return false;
                }
            }
        }

        return true;
    }

    retrieveData(): FilesDropData {
        const files = this.#event.dataTransfer?.files || new FileList();

        return {
            files: Array.from(files).filter((file) => {
                return file.type.includes("image") ||
                    file.type.includes("pdf") ||
                    file.type.includes("video") ||
                    file.type.includes("text");
            }),
            url: this.#event.dataTransfer?.getData("text"),
        };
    }

    #getDropUrl(): string | undefined {
        const url = this.data.url?.trim();
        return url ? url : undefined;
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const uploadedData = await this.#getUploadData();
        await this.#createJournalAndNotes(uploadedData);

        return true;
    }

    async #getUploadData(): Promise<NoteUploadData[]> {
        const url = this.#getDropUrl();
        const urlType = url ? this.#determineUrlType(url) : undefined;

        if (url && urlType) {
            return [{
                response: { path: url },
                type: urlType,
                fileName: this.#getFileNameFromUrl(url),
            }];
        }

        return this.#uploadData();
    }

    async #uploadData(): Promise<NoteUploadData[]> {
        const uploadedData: NoteUploadData[] = [];

        for (const file of this.data.files) {
            const type = this.#determineFileType(file);

            if (type === "text") {
                const text = await new Promise<string | undefined>(
                    (resolve) => {
                        const reader = new FileReader();
                        reader.addEventListener("load", async () => {
                            resolve(reader.result?.toString());
                        });
                        reader.readAsText(file);
                    },
                );

                uploadedData.push({
                    text,
                    type,
                    fileName: file.name,
                });
            } else {
                const response = await FilePicker.uploadPersistent(
                    MODULE_ID,
                    "journals",
                    file,
                );

                uploadedData.push({
                    response,
                    type,
                    fileName: file.name,
                });
            }
        }

        return uploadedData;
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

    #determineUrlType(url: string): CorePageType | undefined {
        const lower = url.toLowerCase();

        // Basic extension-based detection; this mirrors the types we accept for files.
        if (/\.(apng|avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/.test(lower)) {
            return "image";
        }

        if (/\.(m4v|mp4|ogv|webm)$/.test(lower)) {
            return "video";
        }

        return undefined;
    }

    #getFileNameFromUrl(url: string): string {
        try {
            const parsed = new URL(url);
            const pathName = parsed.pathname ?? "";
            const last = pathName.split("/").filter(Boolean).at(-1);
            return last ? decodeURIComponent(last) : "Dropped Media";
        } catch {
            // Not a valid absolute URL; fall back to a simple best-effort name.
            const last = url.split(/[\\/]/).filter(Boolean).at(-1);
            return last ? last : "Dropped Media";
        }
    }

    async #createJournalAndNotes(uploadedData: NoteUploadData[]) {
        const journalPageSources: DeepPartial<JournalEntryPageSource>[] =
            uploadedData.map((data) => {
                return {
                    name: data.fileName,
                    type: data.type,
                    src: data.response?.path,
                    text: {
                        content: data.text,
                    },
                };
            });

        const dateTime = new Date().toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const journalSource: DeepPartial<JournalEntrySource> = {
            name: game.i18n.format("Droppables.JournalSceneName", {
                name: canvas.scene?.name ?? "",
                dateTime,
            }),
            pages: journalPageSources,
        };

        const journal = await JournalEntry.create(journalSource);
        const topLeft = translateToTopLeftGrid(this.#event);
        const noteSource: DeepPartial<NoteSource> = {
            entryId: journal?.id,
            x: topLeft.x,
            y: topLeft.y,
        };

        await canvas.scene?.createEmbeddedDocuments("Note", [noteSource]);
    }
}

export { NotesOnCanvasHandler };
