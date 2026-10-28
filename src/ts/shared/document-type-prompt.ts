import { MODULE_ID } from "../constants.ts";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

/**
 * Prompts the user to select a subtype for each dropped file for document types that require one
 * (e.g. Actor, Item). Reuses the token drop dialog template.
 *
 * @param options - The prompt options.
 * @param options.documentName - The document type whose subtypes are offered ("Actor" or "Item").
 * @param options.fileNames - The names of the dropped files to choose a type for.
 * @param options.title - The localization key for the dialog title.
 * @returns The chosen type for each file in the same order, or undefined if the dialog was dismissed.
 */
async function promptForDocumentTypes({
    documentName,
    fileNames,
    title = "Droppables.SelectDocumentTypes",
}: {
    documentName: "Actor" | "Item";
    fileNames: string[];
    title?: string;
}): Promise<string[] | undefined> {
    const types = game.documentTypes[documentName].filter((type) => type !== CONST.BASE_DOCUMENT_TYPE);
    const typeLabels = CONFIG[documentName].typeLabels;
    const typeLocalizations = types.reduce((obj: Record<string, string>, typeLabel) => {
        const label = typeLabels[typeLabel] ?? typeLabel;
        obj[typeLabel] = game.i18n.has(label) ? game.i18n.localize(label) : typeLabel;
        return obj;
    }, {});

    const content = await renderTemplate(`modules/${MODULE_ID}/templates/drop-token-files-dialog.hbs`, {
        uploadedData: fileNames.map((fileName) => ({
            fileName,
            types: typeLocalizations,
            selectedType: types[0],
        })),
    });

    let result: string[] | undefined;

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
                    result = Array.from(selects).map((select) => select.value || CONST.BASE_DOCUMENT_TYPE);
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
