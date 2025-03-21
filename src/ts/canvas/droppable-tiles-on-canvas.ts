import { TileSource } from "types/foundry/common/documents/tile.js";
import { Droppable } from "../droppable.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";

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

        const isAllowedToUpload = game.user.hasPermission("FILES_UPLOAD");
        if (!isGM && !isAllowedToUpload) {
            ui.notifications.warn(
                game.i18n.localize("Droppables.NoUploadFiles"),
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
                return (
                    file.type.includes("image") || file.type.includes("video")
                );
            }),
            url: this.event.dataTransfer?.getData("text"),
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
                width: texture?.baseTexture.width,
                height: texture?.baseTexture.height,
                overhead,
                hidden: this.event.altKey,
                x: topLeft.x,
                y: topLeft.y,
            };

            tileSources.push(tileSource);
        }

        canvas.perception.update({ refreshLighting: true, refreshTiles: true });

        await canvas.scene?.createEmbeddedDocuments("Tile", tileSources, {
            broadcast: true,
            data: [],
        });

        return true;
    }
}

export { DroppableTilesOnCanvas };
