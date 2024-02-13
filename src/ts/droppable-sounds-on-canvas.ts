import { id as MODULE_ID } from "@static/module.json";
import { AmbientSoundSource } from "types/foundry/common/documents/ambient-sound.js";
import { Droppable } from "./droppable.ts";
import { FilesDropData } from "./types.ts";
import { translateToTopLeftGrid } from "./util.ts";

class DroppableSoundsOnCanvas extends Droppable<DragEvent, FilesDropData> {
    constructor(event: DragEvent) {
        super(event);
    }

    override canHandleDrop(): boolean {
        const isGM = game.user.isGM;

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
                "You do not have permission to upload files.",
            );
            return false;
        }

        const hasFiles = this.data.files.length > 0;
        if (!hasFiles) {
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
        };
    }

    override async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.event.preventDefault();

        const ambientSoundSources: DeepPartial<AmbientSoundSource>[] = [];

        for (const file of this.data.files) {
            const response = await FilePicker.uploadPersistent(
                MODULE_ID,
                "sounds",
                file,
            );
            const topLeft = translateToTopLeftGrid(this.event);
            const ambientSoundSource: DeepPartial<AmbientSoundSource> = {
                path: response.path,
                x: topLeft[0],
                y: topLeft[1],
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
