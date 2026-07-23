import { TokenSource } from "@client/documents/_module.mjs";
import { DatabaseCreateOperation } from "@common/abstract/_module.mjs";
import { ImageFilePath, USER_PERMISSIONS } from "@common/constants.mjs";
import { Settings } from "../settings.ts";
import { promptForDocumentTypes } from "../shared/document-type-prompt.ts";
import { DroppableHandler } from "../shared/droppable-manager.ts";
import {
    UploadedFile,
    determineUrlType,
    fileNameToDocumentName,
    getFileNameFromUrl,
    getFilesFromEvent,
    isImageFile,
    uploadToPersistent,
} from "../shared/files.ts";
import { FilesDropData } from "../types.ts";
import { translateToTopLeftGrid } from "./util.ts";

interface TokenDropData {
    fileName: string;
    filePath: string;
    type: string;
}

class TokensOnCanvasHandler implements DroppableHandler<FilesDropData> {
    data: FilesDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        const isGM = game.user.isGM;
        const url = this.#getDropUrl();
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
        if (!isGM) {
            const permissions = [
                ...(!isImageUrl && this.data.files.length
                    ? [{ permission: "FILES_UPLOAD", message: "Droppables.NoUploadFiles" }]
                    : []),
                { permission: "TOKEN_CREATE", message: "Droppables.NoCreateTokens" },
                { permission: "ACTOR_CREATE", message: "Droppables.NoCreateActors" },
            ];

            for (const { permission, message } of permissions) {
                if (!game.user.hasPermission(permission as keyof typeof USER_PERMISSIONS)) {
                    ui.notifications.warn(game.i18n.localize(message));
                    return false;
                }
            }
        }

        return true;
    }

    retrieveData(): FilesDropData {
        return {
            files: getFilesFromEvent(this.#event, isImageFile),
            url: this.#event.dataTransfer?.getData("text"),
        };
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
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

    #getDropUrl(): string | undefined {
        const url = this.data.url?.trim();
        return url ? url : undefined;
    }

    async #getUploadData(): Promise<UploadedFile[]> {
        const url = this.#getDropUrl();

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

    async #createActorsAndTokens(dropData: TokenDropData[]) {
        const actorSources = [];
        for (const tokenDropData of dropData) {
            const actorSource = {
                name: fileNameToDocumentName(tokenDropData.fileName),
                type: tokenDropData.type,
                img: tokenDropData.filePath as ImageFilePath,
            };
            actorSources.push(actorSource);
        }

        const createdActors = (await Actor.createDocuments(actorSources)) as Actor[];
        const tokenSources: DeepPartial<TokenSource>[] = [];
        for (const actor of createdActors) {
            const topLeft = translateToTopLeftGrid(this.#event);
            const tokenSource: DeepPartial<TokenSource> = {
                texture: { src: actor.img as ImageFilePath },
                hidden: this.#event.altKey,
                x: topLeft.x,
                y: topLeft.y,
                actorId: actor.id,
                actorLink: false,
            };
            tokenSources.push(tokenSource);

            await actor.update({ prototypeToken: tokenSource });
        }

        return canvas.scene?.createEmbeddedDocuments("Token", tokenSources, {
            broadcast: true,
            data: [],
        } as unknown as DatabaseCreateOperation<Scene>);
    }
}

export { TokensOnCanvasHandler };
