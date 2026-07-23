import { MODULE_ID } from "../constants.ts";
import { UploadedFile } from "./files.ts";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

/**
 * Prompts the user to select a subtype for each uploaded file for document types that require one
 * (e.g. Actor, Item). Reuses the token drop dialog template.
 *
 * @param options - The prompt options.
 * @param options.documentName - The document type whose subtypes are offered ("Actor" or "Item").
 * @param options.uploadedData - The uploaded files to annotate with a chosen type.
 * @param options.title - The localization key for the dialog title.
 * @returns The uploaded files annotated with the chosen type, or undefined if the dialog was dismissed.
 */
async function promptForDocumentTypes({
    documentName,
    uploadedData,
    title = "Droppables.SelectDocumentTypes",
}: {
    documentName: "Actor" | "Item";
    uploadedData: UploadedFile[];
    title?: string;
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
                title: game.i18n.localize(title),
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

export { promptForDocumentTypes };
