import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "../shared/files.ts";
import { promptForDocumentTypes } from "../shared/document-type-prompt.ts";

/**
 * Creates an Item from a dropped image, prompting for the item subtype, and assigns the image.
 */
class ItemDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Item";
    protected subdir = "items";

    protected override async promptForTypes(): Promise<string[] | undefined> {
        return promptForDocumentTypes({ documentName: "Item", fileNames: this.data.map((file) => file.name) });
    }

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        return uploaded.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            type: data.type,
            img: data.filePath,
        }));
    }
}

export { ItemDirectoryHandler };
