import { BaseDirectoryHandler } from "./base-directory-handler.ts";
import { UploadedFile, fileNameToDocumentName, isAudioFile } from "../shared/files.ts";

/**
 * Creates a Playlist from dropped audio files, adding each uploaded file as a sound in the playlist.
 */
class PlaylistDirectoryHandler extends BaseDirectoryHandler {
    protected documentName = "Playlist";
    protected subdir = "playlists";

    protected override filePredicate(file: File): boolean {
        return isAudioFile(file);
    }

    protected async buildSources(uploaded: UploadedFile[]): Promise<object[] | undefined> {
        if (!uploaded.length) return [];

        const name =
            this.data.length === 1
                ? fileNameToDocumentName(this.data[0].name)
                : game.i18n.localize("Droppables.NewPlaylist");
        const sounds = uploaded.map((data) => ({ name: fileNameToDocumentName(data.fileName), path: data.filePath }));

        return [{ name, sounds }];
    }
}

export { PlaylistDirectoryHandler };
