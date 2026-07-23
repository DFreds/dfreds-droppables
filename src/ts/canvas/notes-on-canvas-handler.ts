import { JournalEntrySource, NoteSource } from "@client/documents/_module.mjs";
import { USER_PERMISSIONS } from "@common/constants.mjs";
import { CorePageType, JournalEntryPageSource } from "@common/documents/journal-entry-page.mjs";
import { Settings } from "../settings.ts";
import { DroppableHandler } from "../shared/droppable-manager.ts";
import {
    determineFileType,
    determineUrlType,
    getFileNameFromUrl,
    getFilesFromEvent,
    isJournalFile,
    uploadToPersistent,
} from "../shared/files.ts";
import { FilesDropData } from "../types.ts";
import { translateToTopLeftGrid } from "./util.ts";

interface NoteUploadData {
    filePath?: string;
    text?: string;
    type: CorePageType;
    fileName: string;
}

class NotesOnCanvasHandler implements DroppableHandler<FilesDropData> {
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
        const urlType = url ? determineUrlType(url) : undefined;

        // Check basic requirements
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.hookName?.includes("NotesLayer") ||
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
                if (!game.user.hasPermission(permission as keyof typeof USER_PERMISSIONS)) {
                    ui.notifications.warn(game.i18n.localize(message));
                    return false;
                }
            }
        }

        return true;
    }

    retrieveData(): FilesDropData {
        return {
            files: getFilesFromEvent(this.#event, isJournalFile),
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
        const urlType = url ? determineUrlType(url) : undefined;

        if (url && urlType) {
            return [
                {
                    filePath: url,
                    type: urlType,
                    fileName: getFileNameFromUrl(url, "Dropped Media"),
                },
            ];
        }

        return this.#uploadData();
    }

    async #uploadData(): Promise<NoteUploadData[]> {
        const uploadedData: NoteUploadData[] = [];

        for (const file of this.data.files) {
            const type = determineFileType(file);

            if (type === "text") {
                const text = await new Promise<string | undefined>((resolve) => {
                    const reader = new FileReader();
                    reader.addEventListener("load", async () => {
                        resolve(reader.result?.toString());
                    });
                    reader.readAsText(file);
                });

                uploadedData.push({
                    text,
                    type,
                    fileName: file.name,
                });
            } else {
                const filePath = await uploadToPersistent("notes", file);

                uploadedData.push({
                    filePath,
                    type,
                    fileName: file.name,
                });
            }
        }

        return uploadedData;
    }

    async #createJournalAndNotes(uploadedData: NoteUploadData[]) {
        const journalPageSources: DeepPartial<JournalEntryPageSource>[] = uploadedData.map((data) => {
            return {
                name: data.fileName,
                type: data.type,
                src: data.filePath,
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
            name: game.i18n.localize("Droppables.JournalSceneName", {
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
