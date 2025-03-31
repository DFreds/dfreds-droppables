import {
    CorePageType,
    JournalEntryPageSource,
} from "types/foundry/common/documents/journal-entry-page.js";
import { JournalEntrySource } from "types/foundry/common/documents/journal-entry.js";
import { NoteSource } from "types/foundry/common/documents/note.js";
import { Droppable } from "../droppable.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";

interface NoteUploadData {
    response?: any;
    text?: string;
    type: CorePageType;
    fileName: string;
}

class DroppableNotesOnCanvas extends Droppable<DragEvent, FilesDropData> {
    #settings = new Settings();

    constructor(event: DragEvent) {
        super(event);
    }

    override canHandleDrop(): boolean {
        const isGM = game.user.isGM;

        // Check basic requirements
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.name?.includes("NotesLayer") ||
            !this.data.files.length
        ) {
            return false;
        }

        if (this.data.url) {
            // If a URL exists, just let Foundry handle it for now
            // TODO probably want to eventually handle this
            return false;
        }

        // Check permissions for non-GM users
        if (!isGM) {
            const permissions = [
                {
                    permission: "FILES_UPLOAD",
                    message: "Droppables.NoUploadFiles",
                },
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
                    !game.user.hasPermission(permission as UserPermissionString)
                ) {
                    ui.notifications.warn(game.i18n.localize(message));
                    return false;
                }
            }
        }

        return true;
    }

    override retrieveData(): FilesDropData {
        const files = this.event.dataTransfer?.files || new FileList();

        return {
            files: Array.from(files).filter((file) => {
                return (
                    file.type.includes("image") ||
                    file.type.includes("pdf") ||
                    file.type.includes("video") ||
                    file.type.includes("text")
                );
            }),
            url: this.event.dataTransfer?.getData("text"),
        };
    }

    override async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.event.preventDefault();

        const uploadedData = await this.#uploadData();
        await this.#createJournalAndNotes(uploadedData);

        return true;
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
        let type: CorePageType = "image";
        if (file.type.includes("pdf")) {
            type = "pdf";
        } else if (file.type.includes("video")) {
            type = "video";
        } else if (file.type.includes("text")) {
            type = "text";
        }

        return type;
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
        const journalSource: DeepPartial<JournalEntrySource> = {
            name: canvas.scene?.name,
            pages: journalPageSources,
        };

        const journal = await JournalEntry.create(journalSource);
        const topLeft = translateToTopLeftGrid(this.event);
        const noteSource: DeepPartial<NoteSource> = {
            entryId: journal?.id,
            x: topLeft.x,
            y: topLeft.y,
        };

        await canvas.scene?.createEmbeddedDocuments("Note", [noteSource]);
    }
}

export { DroppableNotesOnCanvas };
