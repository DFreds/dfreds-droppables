import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "../shared/files.ts";

/**
 * Creates a Macro from a dropped image, assigning the image as the macro icon.
 */
class MacroDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Macro";
    protected subdir = "macros";

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        return uploaded.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            type: "script",
            command: "",
            img: data.filePath,
        }));
    }
}

export { MacroDirectoryHandler };
