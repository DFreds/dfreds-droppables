import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "../shared/files.ts";
import { promptForDocumentTypes } from "../shared/document-type-prompt.ts";

/**
 * Creates an Actor from a dropped image, prompting for the actor subtype, and assigns the image as
 * both the portrait and the prototype token art.
 */
class ActorDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Actor";
    protected subdir = "actors";

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        const typed = await promptForDocumentTypes({ documentName: "Actor", uploadedData: uploaded });

        return typed?.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            type: data.type,
            img: data.filePath,
            prototypeToken: { texture: { src: data.filePath } },
        }));
    }
}

export { ActorDirectoryHandler };
