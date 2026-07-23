import { TileSource } from "@client/documents/_module.mjs";
import { DatabaseCreateOperation } from "@common/abstract/_module.mjs";
import { FilePath, ImageFilePath, VideoFilePath } from "@common/constants.mjs";
import { Settings } from "../settings.ts";
import { DroppableHandler } from "../shared/droppable-manager.ts";
import {
    determineUrlType,
    getFileNameFromUrl,
    getFilesFromEvent,
    isImageOrVideoFile,
    uploadToPersistent,
} from "../shared/files.ts";
import { FilesDropData } from "../types.ts";
import { translateToTopLeftGrid } from "./util.ts";

const { loadTexture } = foundry.canvas;

interface TileUploadData {
    fileName: string;
    filePath: FilePath;
}

class TilesOnCanvasHandler implements DroppableHandler<FilesDropData> {
    data: FilesDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        const url = this.#getDropUrl();
        const urlType = url ? determineUrlType(url) : undefined;

        // Early exit conditions
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.hookName?.includes("TilesLayer") ||
            (!this.data.files.length && !urlType)
        ) {
            return false;
        }

        // Check upload permissions for non-GM users
        if (this.data.files.length && !game.user.isGM && !game.user.hasPermission("FILES_UPLOAD")) {
            ui.notifications.warn(game.i18n.localize("Droppables.NoUploadFiles"));
            return false;
        }

        return true;
    }

    retrieveData(): FilesDropData {
        return {
            files: getFilesFromEvent(this.#event, isImageOrVideoFile),
            url: this.#event.dataTransfer?.getData("text"),
        };
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const uploadedData = await this.#getUploadData();
        await this.#createTiles(uploadedData);

        return true;
    }

    #getDropUrl(): string | undefined {
        const url = this.data.url?.trim();
        return url ? url : undefined;
    }

    async #getUploadData(): Promise<TileUploadData[]> {
        const url = this.#getDropUrl();
        const urlType = url ? determineUrlType(url) : undefined;

        if (url && urlType) {
            return [
                {
                    fileName: getFileNameFromUrl(url, "Dropped Media"),
                    filePath: url as FilePath,
                },
            ];
        }

        return this.#uploadData();
    }

    async #uploadData(): Promise<TileUploadData[]> {
        const uploadedData: TileUploadData[] = [];

        for (const file of this.data.files) {
            const filePath = await uploadToPersistent("tiles", file);

            uploadedData.push({
                fileName: file.name,
                filePath: filePath as FilePath,
            });
        }

        return uploadedData;
    }

    async #createTiles(uploadedData: TileUploadData[]): Promise<void> {
        const overhead = ui.controls.controls.tiles?.tools?.foreground?.active ?? false;
        const tileSources: DeepPartial<TileSource>[] = [];
        const topLeft = translateToTopLeftGrid(this.#event);

        for (const { filePath } of uploadedData) {
            const src = filePath as ImageFilePath | VideoFilePath;
            const texture = await loadTexture(src);
            const tileSource: DeepPartial<TileSource> = {
                texture: { src },
                width: texture?.baseTexture.width,
                height: texture?.baseTexture.height,
                // @ts-expect-error elevation is defined on Tile source in foundry types
                elevation: overhead ? 20 : 0,
                hidden: this.#event.altKey,
                x: topLeft.x,
                y: topLeft.y,
            };

            tileSources.push(tileSource);
        }

        canvas.perception.update({
            refreshLighting: true,
            refreshOcclusion: true,
        });

        await canvas.scene?.createEmbeddedDocuments("Tile", tileSources, {
            broadcast: true,
            data: [],
        } as unknown as DatabaseCreateOperation<Scene>);
    }
}

export { TilesOnCanvasHandler };
