import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "./util.ts";

/**
 * Creates a Cards document (a deck) from a dropped image, assigning the image.
 */
class CardsDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Cards";
    protected subdir = "cards";

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        return uploaded.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            type: "deck",
            img: data.filePath,
        }));
    }
}

export { CardsDirectoryHandler };
