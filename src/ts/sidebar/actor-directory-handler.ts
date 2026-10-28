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

    protected override async promptForTypes(): Promise<string[] | undefined> {
        return promptForDocumentTypes({ documentName: "Actor", fileNames: this.data.map((file) => file.name) });
    }

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        return uploaded.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            type: data.type,
            img: data.filePath,
            prototypeToken: { texture: { src: data.filePath } },
        }));
    }
}

export { ActorDirectoryHandler };
