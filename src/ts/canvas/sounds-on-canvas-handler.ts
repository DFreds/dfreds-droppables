import { AmbientSoundSource } from "@client/documents/_module.mjs";
import { AudioFilePath } from "@common/constants.mjs";
import { Settings } from "../settings.ts";
import { DroppableHandler } from "../shared/droppable-manager.ts";
import { getFilesFromEvent, isAudioFile, uploadToPersistent } from "../shared/files.ts";
import { FilesDropData } from "../types.ts";
import { translateToTopLeftGrid } from "./util.ts";

class SoundsOnCanvasHandler implements DroppableHandler<FilesDropData> {
    data: FilesDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        // Early exit conditions
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.hookName?.includes("SoundsLayer") ||
            !this.data.files.length
        ) {
            return false;
        }

        if (this.data.url) {
            // If a URL exists, just let Foundry handle it for now
            // TODO probably want to eventually handle this
            return false;
        }

        // Check upload permissions for non-GM users
        if (!game.user.isGM && !game.user.hasPermission("FILES_UPLOAD")) {
            ui.notifications.warn(game.i18n.localize("Droppables.NoUploadFiles"));
            return false;
        }

        return true;
    }

    retrieveData(): FilesDropData {
        return {
            files: getFilesFromEvent(this.#event, isAudioFile),
            url: this.#event.dataTransfer?.getData("text"),
        };
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const ambientSoundSources: DeepPartial<AmbientSoundSource>[] = [];

        for (const file of this.data.files) {
            const path = await uploadToPersistent("sounds", file);
            const topLeft = translateToTopLeftGrid(this.#event);
            const ambientSoundSource: DeepPartial<AmbientSoundSource> = {
                path: path as AudioFilePath,
                x: topLeft.x,
                y: topLeft.y,
                radius: 10,
                easing: true,
                repeat: true,
                volume: 1.0,
            };

            ambientSoundSources.push(ambientSoundSource);
        }

        await canvas.scene?.createEmbeddedDocuments("AmbientSound", ambientSoundSources);

        return true;
    }
}

export { SoundsOnCanvasHandler };
