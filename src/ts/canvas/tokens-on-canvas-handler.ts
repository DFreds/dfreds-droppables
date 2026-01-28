import { CanvasDroppableHandler } from "../canvas-droppable-manager.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";
import { DatabaseCreateOperation } from "@common/abstract/_module.mjs";
import {
    FilePath,
    ImageFilePath,
    USER_PERMISSIONS,
} from "@common/constants.mjs";
import { TokenSource } from "@client/documents/_module.mjs";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;
const { FilePicker } = foundry.applications.apps;

interface TokenDropData {
    fileName: string;
    filePath: string;
    type: string;
}

interface TokenUploadData {
    response: any;
    types: Record<string, string>;
    selectedType: string;
    fileName: string;
}

class TokensOnCanvasHandler implements CanvasDroppableHandler<FilesDropData> {
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
        const urlType = url ? this.#determineUrlType(url) : undefined;

        // Early exit conditions
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.name?.includes("TokenLayer") ||
            (!this.data.files.length && !urlType)
        ) {
            return false;
        }

        // Permission checks for non-GM users
        if (!isGM) {
            const permissions = [
                ...(!urlType && this.data.files.length
                    ? [
                        { permission: "FILES_UPLOAD", message: "Droppables.NoUploadFiles" },
                    ]
                    : []),
                { permission: "TOKEN_CREATE", message: "Droppables.NoCreateTokens" },
                { permission: "ACTOR_CREATE", message: "Droppables.NoCreateActors" },
            ];

            for (const { permission, message } of permissions) {
                if (
                    !game.user.hasPermission(
                        permission as keyof typeof USER_PERMISSIONS,
                    )
                ) {
                    ui.notifications.warn(game.i18n.localize(message));
                    return false;
                }
            }
        }

        return true;
    }

    retrieveData(): FilesDropData {
        const files = this.#event.dataTransfer?.files || new FileList();

        return {
            files: Array.from(files).filter((file) => {
                return file.type.includes("image");
            }),
            url: this.#event.dataTransfer?.getData("text"),
        };
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const types = game.documentTypes.Actor.filter(
            (type) => type !== CONST.BASE_DOCUMENT_TYPE,
        );
        const typeLocalizations = types.reduce(
            (obj: Record<string, string>, typeLabel) => {
                const label = CONFIG.Actor.typeLabels[typeLabel] ?? typeLabel;
                obj[typeLabel] = game.i18n.has(label)
                    ? game.i18n.localize(label)
                    : typeLabel;
                return obj;
            },
            {},
        );

        const uploadedData = await this.#getUploadData({
            typeLocalizations,
            selectedType: types[0],
        });

        await this.#promptForActorTypes(uploadedData);

        return true;
    }

    #getDropUrl(): string | undefined {
        const url = this.data.url?.trim();
        return url ? url : undefined;
    }

    #determineUrlType(url: string): "image" | undefined {
        const lower = url.toLowerCase();

        // Only allow image URLs for tokens.
        if (/\.(apng|avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/.test(lower)) {
            return "image";
        }

        return undefined;
    }

    #getFileNameFromUrl(url: string): string {
        try {
            const parsed = new URL(url);
            const pathName = parsed.pathname ?? "";
            const last = pathName.split("/").filter(Boolean).at(-1);
            return last ? decodeURIComponent(last) : "Dropped Image";
        } catch {
            const last = url.split(/[\\/]/).filter(Boolean).at(-1);
            return last ? last : "Dropped Image";
        }
    }

    async #getUploadData({
        typeLocalizations,
        selectedType,
    }: {
        typeLocalizations: Record<string, string>;
        selectedType: string;
    }): Promise<TokenUploadData[]> {
        const url = this.#getDropUrl();
        const urlType = url ? this.#determineUrlType(url) : undefined;

        if (url && urlType) {
            return [
                {
                    response: { path: url },
                    types: typeLocalizations,
                    selectedType,
                    fileName: this.#getFileNameFromUrl(url),
                },
            ];
        }

        return this.#uploadData({ typeLocalizations, selectedType });
    }

    async #uploadData({
        typeLocalizations,
        selectedType,
    }: {
        typeLocalizations: Record<string, string>;
        selectedType: string;
    }): Promise<TokenUploadData[]> {
        const uploadedData: TokenUploadData[] = [];

        for (const file of this.data.files) {
            const response = await FilePicker.uploadPersistent(
                MODULE_ID,
                "tokens",
                file,
            );
            uploadedData.push({
                response,
                types: typeLocalizations,
                selectedType,
                fileName: file.name,
            });
        }

        return uploadedData;
    }

    async #promptForActorTypes(uploadedData: TokenUploadData[]) {
        const content = await renderTemplate(
            `modules/${MODULE_ID}/templates/drop-token-files-dialog.hbs`,
            { uploadedData },
        );
        return DialogV2.prompt({
            window: {
                title: game.i18n.localize("Droppables.TokenActorTypes"),
                controls: [],
            },
            content,
            ok: {
                label: game.i18n.localize("Droppables.Confirm"),
                callback: async (_event, _button, dialog) => {
                    const $html = $(dialog.element);

                    const dropData = $html
                        .find('select[name="type"]')
                        .map((_idx, ele) => {
                            const data = $(ele).data();
                            const typeSelection = $(ele).val();
                            const tokenDropData: TokenDropData = {
                                fileName: data?.fileName ?? "Unknown",
                                filePath: data?.filePath as FilePath,
                                type:
                                    typeSelection?.toString() ??
                                    CONST.BASE_DOCUMENT_TYPE,
                            };

                            return tokenDropData;
                        })
                        .get();
                    await this.#createActorsAndTokens(dropData);
                },
            },
        });
    }

    async #createActorsAndTokens(dropData: TokenDropData[]) {
        const actorSources = [];
        for (const tokenDropData of dropData) {
            const actorSource = {
                name: tokenDropData.fileName.split(".")[0],
                type: tokenDropData.type,
                img: tokenDropData.filePath as ImageFilePath,
            };
            actorSources.push(actorSource);
        }

        const createdActors = await Actor.createDocuments(actorSources);
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
