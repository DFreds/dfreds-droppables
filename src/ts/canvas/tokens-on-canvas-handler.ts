import { TokenSource } from "@client/documents/_module.mjs";
import { ImageFilePath } from "@common/constants.mjs";
import { Settings } from "../settings.ts";
import { promptForDocumentTypes } from "../shared/document-type-prompt.ts";
import { DroppableHandler } from "../shared/drop-dispatch.ts";
import {
    UploadedFile,
    determineUrlType,
    fileNameToDocumentName,
    getFileNameFromUrl,
    getFilesFromEvent,
    isImageFile,
    uploadToPersistent,
} from "../shared/files.ts";
import { FilesDropData, getActiveLevelElevation, getActiveLevelId, translateToTopLeftGrid } from "./util.ts";

class TokensOnCanvasHandler implements DroppableHandler {
    data: FilesDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        const url = this.data.url;
        // Tokens only accept image URLs.
        const isImageUrl = url ? determineUrlType(url) === "image" : false;

        // Early exit conditions
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.hookName?.includes("TokenLayer") ||
            (!this.data.files.length && !isImageUrl)
        ) {
            return false;
        }

        // Permission checks for non-GM users
        if (!game.user.isGM) {
            if (!isImageUrl && !game.user.hasPermission("FILES_UPLOAD")) {
                ui.notifications.warn(game.i18n.localize("Droppables.NoUploadFiles"));
                return false;
            }
            if (!game.user.hasPermission("TOKEN_CREATE")) {
                ui.notifications.warn(game.i18n.localize("Droppables.NoCreateTokens"));
                return false;
            }
            if (!game.user.hasPermission("ACTOR_CREATE")) {
                ui.notifications.warn(game.i18n.localize("Droppables.NoCreateActors"));
                return false;
            }
        }

        return true;
    }

    retrieveData(): FilesDropData {
        return {
            files: getFilesFromEvent(this.#event, isImageFile),
            url: this.#event.dataTransfer?.getData("text").trim() || undefined,
        };
    }

    async handleDrop(): Promise<boolean> {
        this.#event.preventDefault();

        const uploadedData = await this.#getUploadData();
        const typed = await promptForDocumentTypes({
            documentName: "Actor",
            uploadedData,
            title: "Droppables.TokenActorTypes",
        });
        if (!typed) return true;

        await this.#createActorsAndTokens(typed);

        return true;
    }

    async #getUploadData(): Promise<UploadedFile[]> {
        const url = this.data.url;

        if (url && determineUrlType(url) === "image") {
            return [
                {
                    fileName: getFileNameFromUrl(url, "Dropped Image"),
                    filePath: url,
                },
            ];
        }

        return this.#uploadData();
    }

    async #uploadData(): Promise<UploadedFile[]> {
        const uploadedData: UploadedFile[] = [];

        for (const file of this.data.files) {
            const filePath = await uploadToPersistent("tokens", file);
            if (filePath) {
                uploadedData.push({ fileName: file.name, filePath });
            }
        }

        return uploadedData;
    }

    async #createActorsAndTokens(dropData: (UploadedFile & { type: string })[]) {
        const hidden = this.#event.altKey;
        const actorSources = dropData.map((data) => ({
            name: fileNameToDocumentName(data.fileName),
            type: data.type,
            img: data.filePath as ImageFilePath,
            prototypeToken: { texture: { src: data.filePath as ImageFilePath }, hidden, actorLink: false },
        }));

        const actors = (await Actor.createDocuments(actorSources)) as Actor[];

        const topLeft = translateToTopLeftGrid(this.#event);
        const tokenSources: DeepPartial<TokenSource>[] = actors.map((actor) => ({
            texture: { src: actor.img as ImageFilePath },
            hidden,
            actorId: actor.id,
            actorLink: false,
            x: topLeft.x,
            y: topLeft.y,
            elevation: getActiveLevelElevation(),
            level: getActiveLevelId(),
        }));

        return canvas.scene?.createEmbeddedDocuments("Token", tokenSources);
    }
}

export { TokensOnCanvasHandler };
