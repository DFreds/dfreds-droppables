import { CanvasDroppableHandler } from "../canvas-droppable-manager.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";
import { TileSource } from "@client/documents/_module.mjs";
import { FilePath, ImageFilePath, VideoFilePath } from "@common/constants.mjs";
import { DatabaseCreateOperation } from "@common/abstract/_module.mjs";

const { FilePicker } = foundry.applications.apps;
const { loadTexture } = foundry.canvas;

interface TileUploadData {
    fileName: string;
    filePath: FilePath;
}

class TilesOnCanvasHandler implements CanvasDroppableHandler<FilesDropData> {
    data: FilesDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        const url = this.#getDropUrl();

        // Early exit conditions
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.name?.includes("TilesLayer") ||
            (!this.data.files.length && !url)
        ) {
            return false;
        }

        // Check upload permissions for non-GM users
        if (
            !url &&
            !game.user.isGM &&
            !game.user.hasPermission("FILES_UPLOAD")
        ) {
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
                return (
                    file.type.includes("image") || file.type.includes("video")
                );
            }),
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
        if (url) {
            return [
                {
                    fileName: this.#getFileNameFromUrl(url),
                    filePath: url as FilePath,
                },
            ];
        }

        return this.#uploadData();
    }

    async #uploadData(): Promise<TileUploadData[]> {
        const uploadedData: TileUploadData[] = [];

        for (const file of this.data.files) {
            // NOTE: For some reason, it's returning a boolean in the TS type which isn't accurate
            const response = (await FilePicker.uploadPersistent(
                MODULE_ID,
                "tiles",
                file,
            )) as any;

            uploadedData.push({
                fileName: file.name,
                filePath: response.path as FilePath,
            });
        }

        return uploadedData;
    }

    #getFileNameFromUrl(url: string): string {
        try {
            const parsed = new URL(url);
            const pathName = parsed.pathname ?? "";
            const last = pathName.split("/").filter(Boolean).at(-1);
            return last ? decodeURIComponent(last) : "Dropped Media";
        } catch {
            // Not a valid absolute URL; fall back to a simple best-effort name.
            const last = url.split(/[\\/]/).filter(Boolean).at(-1);
            return last ? last : "Dropped Media";
        }
    }

    async #createTiles(uploadedData: TileUploadData[]): Promise<void> {
        const overhead =
            ui.controls.controls.tiles?.tools?.foreground?.active ?? false;
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
