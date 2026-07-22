import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "./util.ts";

/**
 * Creates a Scene from a dropped image, assigning the image as the scene background.
 */
class SceneDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Scene";
    protected subdir = "scenes";

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        return uploaded.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            background: { src: data.filePath },
        }));
    }
}

export { SceneDirectoryHandler };
