import { DroppableHandler } from "../droppable.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";
import { AmbientSoundSource } from "@client/documents/_module.mjs";

const { FilePicker } = foundry.applications.apps;

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
            !canvas.activeLayer?.name?.includes("SoundsLayer") ||
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
            ui.notifications.warn(
                game.i18n.localize("Droppables.NoUploadFiles"),
            );
            return false;
        }

        return true;
    }

    retrieveData(): FilesDropData {
        const files = this.#event.dataTransfer?.files || new FileList();

        return {
            files: Array.from(files).filter((file) => {
                return file.type.includes("audio");
            }),
            url: this.#event.dataTransfer?.getData("text"),
        };
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const ambientSoundSources: DeepPartial<AmbientSoundSource>[] = [];

        for (const file of this.data.files) {
            // NOTE: For some reason, it's returning a boolean in the TS type which isn't accurate
            const response = (await FilePicker.uploadPersistent(
                MODULE_ID,
                "sounds",
                file,
            )) as any;
            const topLeft = translateToTopLeftGrid(this.#event);
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

export { SoundsOnCanvasHandler };
