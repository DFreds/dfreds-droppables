import { id as MODULE_ID } from "@static/module.json";
import { TileSource } from "types/foundry/common/documents/tile.js";
import { Droppable } from "./droppable.ts";
import { FilesDropData } from "./types.ts";
import { Settings } from "./settings.ts";
import { translateToTopLeftGrid } from "./util.ts";

class DroppableTilesOnCanvas extends Droppable<DragEvent, FilesDropData> {
    #settings = new Settings();

    constructor(event: DragEvent) {
        super(event);
    }

    override canHandleDrop(): boolean {
        const isGM = game.user.isGM;

        if (!this.#settings.canvasDragUpload) {
            return false;
        }

        const isTileLayer =
            canvas.activeLayer?.name?.includes("TilesLayer") ?? false;
        if (!isTileLayer) {
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
                return (
                    file.type.includes("image") || file.type.includes("video")
                );
            }),
        };
    }

    override async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.event.preventDefault();

        const overhead =
            ui.controls.controls
                .find((control) => control.name === "tiles")
                ?.tools.find((tool) => tool.name === "foreground")?.active ??
            false;
        const tileSources: DeepPartial<TileSource>[] = [];
        for (const file of this.data.files) {
            // NOTE: For some reason, it's returning a boolean in the TS type which isn't accurate
            const response = (await FilePicker.uploadPersistent(
                MODULE_ID,
                "tiles",
                file,
            )) as any;
            const topLeft = translateToTopLeftGrid(this.event);
            const texture = await loadTexture(response.path);
            const tileSource: DeepPartial<TileSource> = {
                texture: { src: response.path },
                width: texture.baseTexture.width,
                height: texture.baseTexture.height,
                overhead,
                hidden: this.event.altKey,
                x: topLeft[0],
                y: topLeft[1],
            };

            tileSources.push(tileSource);
        }

        canvas.perception.update({ refreshLighting: true, refreshTiles: true });

        await canvas.scene?.createEmbeddedDocuments("Tile", tileSources, {});

        return true;
    }
}

export { DroppableTilesOnCanvas };
