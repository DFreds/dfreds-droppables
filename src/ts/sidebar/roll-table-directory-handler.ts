import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "../shared/files.ts";

/**
 * Creates a RollTable from a dropped image, assigning the image.
 */
class RollTableDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "RollTable";
    protected subdir = "tables";

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        return uploaded.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            img: data.filePath,
        }));
    }
}

export { RollTableDirectoryHandler };
