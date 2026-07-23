import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "../shared/files.ts";
import { promptForDocumentTypes } from "../shared/document-type-prompt.ts";

/**
 * Creates an Item from a dropped image, prompting for the item subtype, and assigns the image.
 */
class ItemDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Item";
    protected subdir = "items";

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        const typed = await promptForDocumentTypes({ documentName: "Item", uploadedData: uploaded });

        return typed?.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            type: data.type,
            img: data.filePath,
        }));
    }
}

export { ItemDirectoryHandler };
