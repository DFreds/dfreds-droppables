import { MODULE_ID } from "../constants.ts";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;
const { FilePicker } = foundry.applications.apps;

/**
 * Data describing a single uploaded file that is ready to be turned into a document.
 */
interface UploadedFile {
    fileName: string;
    filePath: string;
}

/**
 * Determines whether a dropped file is a JSON export.
 */
function isJsonFile(file: File): boolean {
    return file.type.includes("json") || file.name.toLowerCase().endsWith(".json");
}

/**
 * Returns the files from a drag event that match the given predicate.
 */
function getMatchingFiles(event: DragEvent, predicate: (file: File) => boolean): File[] {
    const files = event.dataTransfer?.files ?? new FileList();
    return Array.from(files).filter(predicate);
}

/**
 * Finds the ID of the directory folder that a drop landed on or within, if any, so that newly
 * created documents can be nested in that folder.
 */
function getTargetFolderId(event: DragEvent): string | undefined {
    const target = event.target as HTMLElement | null;
    const folder = target?.closest<HTMLElement>("[data-folder-id]");
    return folder?.dataset.folderId || undefined;
}

/**
 * Uploads a file to the module's persistent storage under the given subdirectory and returns the
 * resulting file path.
 */
async function uploadToPersistent(subdir: string, file: File): Promise<string | undefined> {
    const response = await FilePicker.uploadPersistent(MODULE_ID, subdir, file);
    return typeof response === "object" && response ? response.path : undefined;
}

/**
 * Strips the extension from a file name to use as a document name.
 */
function fileNameToDocumentName(fileName: string): string {
    const withoutExtension = fileName.split(".").slice(0, -1).join(".");
    return withoutExtension || fileName;
}

/**
 * Prompts the user to select a subtype for each uploaded file for document types that require one
 * (e.g. Actor, Item). Reuses the token drop dialog template. Returns the uploaded files annotated
 * with the chosen type, or undefined if the dialog was dismissed.
 */
async function promptForDocumentTypes({
    documentName,
    uploadedData,
}: {
    documentName: "Actor" | "Item";
    uploadedData: UploadedFile[];
}): Promise<(UploadedFile & { type: string })[] | undefined> {
    const types = game.documentTypes[documentName].filter((type) => type !== CONST.BASE_DOCUMENT_TYPE);
    const typeLabels = CONFIG[documentName].typeLabels;
    const typeLocalizations = types.reduce((obj: Record<string, string>, typeLabel) => {
        const label = typeLabels[typeLabel] ?? typeLabel;
        obj[typeLabel] = game.i18n.has(label) ? game.i18n.localize(label) : typeLabel;
        return obj;
    }, {});

    const content = await renderTemplate(`modules/${MODULE_ID}/templates/drop-token-files-dialog.hbs`, {
        uploadedData: uploadedData.map((data) => ({
            fileName: data.fileName,
            response: { path: data.filePath },
            types: typeLocalizations,
            selectedType: types[0],
        })),
    });

    let result: (UploadedFile & { type: string })[] | undefined;

    try {
        await DialogV2.prompt({
            window: {
                title: game.i18n.localize("Droppables.SelectDocumentTypes"),
                controls: [],
            },
            content,
            ok: {
                label: game.i18n.localize("Droppables.Confirm"),
                callback: (_event, _button, dialog) => {
                    const selects = dialog.element.querySelectorAll<HTMLSelectElement>('select[name="type"]');
                    result = Array.from(selects).map((select) => ({
                        fileName: select.dataset.fileName ?? "Unknown",
                        filePath: select.dataset.filePath ?? "",
                        type: select.value || CONST.BASE_DOCUMENT_TYPE,
                    }));
                },
            },
        });
    } catch {
        // The dialog was dismissed without confirming; abort creation.
        return undefined;
    }

    return result;
}

export type { UploadedFile };
export {
    isJsonFile,
    getMatchingFiles,
    getTargetFolderId,
    uploadToPersistent,
    fileNameToDocumentName,
    promptForDocumentTypes,
};
