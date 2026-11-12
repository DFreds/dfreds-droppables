import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName } from "../shared/files.ts";

/**
 * Creates a Scene from a dropped image, assigning the image as the scene background.
 */
class SceneDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Scene";
    protected subdir = "scenes";

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        // @ts-expect-error SceneMetadata.defaultLevelId is not typed
        const levelId: string = foundry.documents.Scene.metadata.defaultLevelId;
        return uploaded.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            levels: [
                {
                    _id: levelId,
                    name: game.i18n.localize(foundry.documents.Level.metadata.label),
                    background: { src: data.filePath },
                },
            ],
            initialLevel: levelId,
        }));
    }
}

export { SceneDirectoryHandler };
