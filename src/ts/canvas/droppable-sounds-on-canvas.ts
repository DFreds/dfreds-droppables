import { AmbientSoundSource } from "types/foundry/common/documents/ambient-sound.js";
import { Droppable } from "../droppable.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";

class DroppableSoundsOnCanvas extends Droppable<DragEvent, FilesDropData> {
    #settings = new Settings();

    constructor(event: DragEvent) {
        super(event);
    }

    override canHandleDrop(): boolean {
        const isGM = game.user.isGM;

        if (!this.#settings.canvasDragUpload) {
            return false;
        }

        const isSoundLayer =
            canvas.activeLayer?.name?.includes("SoundsLayer") ?? false;
        if (!isSoundLayer) {
            return false;
        }

        const isAllowedToUpload = game.user.hasPermission(
            CONST.USER_PERMISSIONS.FILES_UPLOAD,
        );
        if (!isGM && !isAllowedToUpload) {
            ui.notifications.warn(
                game.i18n.localize(EN_JSON.Droppables.NoUploadFiles),
            );
            return false;
        }

        const hasFiles = this.data.files.length > 0;
        if (!hasFiles) {
            return false;
        }

        const hasUrl = !!this.data.url;
        if (hasUrl) {
            // If a URL exists, just let Foundry handle it for now
            // TODO probably want to eventually handle this
            return false;
        }

        return true;
    }

    override retrieveData(): FilesDropData {
        const files = this.event.dataTransfer?.files || new FileList();

        return {
            files: Array.from(files).filter((file) => {
                return file.type.includes("audio");
            }),
            url: this.event.dataTransfer?.getData("text"),
        };
    }

    override async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.event.preventDefault();

        const ambientSoundSources: DeepPartial<AmbientSoundSource>[] = [];

        for (const file of this.data.files) {
            // NOTE: For some reason, it's returning a boolean in the TS type which isn't accurate
            const response = (await FilePicker.uploadPersistent(
                MODULE_ID,
                "sounds",
                file,
            )) as any;
            const topLeft = translateToTopLeftGrid(this.event);
            const ambientSoundSource: DeepPartial<AmbientSoundSource> = {
                path: response.path,
                x: topLeft.x,
                y: topLeft.y,
                radius: 10,
                easing: true,
                repeat: true,
                volume: 1.0,
            };

            ambientSoundSources.push(ambientSoundSource);
        }

        await canvas.scene?.createEmbeddedDocuments(
            "AmbientSound",
            ambientSoundSources,
        );

        return true;
    }
}

export { DroppableSoundsOnCanvas };
