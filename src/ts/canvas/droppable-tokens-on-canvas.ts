import { TokenSource } from "types/foundry/common/documents/token.js";
import { Droppable } from "../droppable.ts";
import { FilesDropData } from "../types.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";
import { MODULE_ID } from "../constants.ts";

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

class DroppableTokensOnCanvas extends Droppable<DragEvent, FilesDropData> {
    #settings = new Settings();

    constructor(event: DragEvent) {
        super(event);
    }

    override canHandleDrop(): boolean {
        const isGM = game.user.isGM;

        // Early exit conditions
        if (
            !this.#settings.canvasDragUpload ||
            !canvas.activeLayer?.name?.includes("TokenLayer") ||
            !this.data.files.length
        ) {
            return false;
        }

        if (this.data.url) {
            // If a URL exists, just let Foundry handle it for now
            // TODO probably want to eventually handle this
            return false;
        }

        // Permission checks for non-GM users
        if (!isGM) {
            const permissions = [
                {
                    check: "FILES_UPLOAD",
                    message: "Droppables.NoUploadFiles",
                },
                {
                    check: "TOKEN_CREATE",
                    message: "Droppables.NoCreateTokens",
                },
                {
                    check: "ACTOR_CREATE",
                    message: "Droppables.NoCreateActors",
                },
            ];

            for (const { check, message } of permissions) {
                if (!game.user.hasPermission(check as UserPermissionString)) {
                    ui.notifications.warn(game.i18n.localize(message));
                    return false;
                }
            }
        }

        return true;
    }

    override retrieveData(): FilesDropData {
        const files = this.event.dataTransfer?.files || new FileList();

        return {
            files: Array.from(files).filter((file) => {
                return file.type.includes("image");
            }),
            url: this.event.dataTransfer?.getData("text"),
        };
    }

    override async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.event.preventDefault();

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

        const uploadedData = await this.#uploadData({
            typeLocalizations,
            selectedType: types[0],
        });

        await this.#promptForActorTypes(uploadedData);

        return true;
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
            {
                uploadedData,
            },
        );
        return Dialog.prompt({
            title: game.i18n.localize("Droppables.TokenActorTypes"),
            content: content,
            label: game.i18n.localize("Droppables.Confirm"),
            rejectClose: false,
            callback: async (html) => {
                const tokenDropDatas = html
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
                await this.#createActorsAndTokens(tokenDropDatas);
            },
        } as PromptDialogData);
    }

    async #createActorsAndTokens(tokenDropDatas: TokenDropData[]) {
        const actorSources = [];
        for (const tokenDropData of tokenDropDatas) {
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
            const topLeft = translateToTopLeftGrid(this.event);
            const tokenSource: DeepPartial<TokenSource> = {
                texture: { src: actor.img },
                hidden: this.event.altKey,
                x: topLeft.x,
                y: topLeft.y,
                actorId: actor.id,
                actorLink: false,
            };
            tokenSources.push(tokenSource);

            await actor.update({
                prototypeToken: tokenSource,
            });
        }

        // TODO actorless option where you delete the associated actor after?
        return canvas.scene?.createEmbeddedDocuments("Token", tokenSources, {
            broadcast: true,
            data: [],
        });
    }
}

export { DroppableTokensOnCanvas };
