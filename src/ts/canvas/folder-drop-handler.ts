import { DroppableHandler } from "../droppable.ts";
import { log } from "../logger.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";

interface DropActorFolderInput {
    actors: Actor[];
    xPosition: number;
    yPosition: number;
    elevation?: number;
    isHidden: boolean;
    isHorizontal?: boolean;
}

interface DropJournalFolderInput {
    entry: JournalEntry;
    xPosition: number;
    yPosition: number;
}

interface FolderDropData {
    type: string;
    uuid: string;
    x: number;
    y: number;
    elevation?: number;
}

class FolderDropHandler implements DroppableHandler<FolderDropData> {
    data: FolderDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        return this.data.type === "Folder";
    }

    retrieveData(): FolderDropData {
        const json = TextEditor.getDragEventData(this.#event);
        return {
            type: json["type"] as string,
            uuid: json["uuid"] as string,
            x: json["x"] as number,
            y: json["y"] as number,
            elevation: json["elevation"] as number | undefined,
        };
    }

    async handleDrop(): Promise<boolean> {
        if (!this.canHandleDrop()) return false;
        this.#event.preventDefault();

        const folder = await this.#getFolder();

        if (folder?.type === "Actor") {
            await this.#handleActorFolder(this.data, folder, this.#event);
            return true;
        } else if (folder?.type === "JournalEntry") {
            await this.#handleJournalFolder(folder, this.#event);
            return true;
        } else {
            return false;
        }
    }

    async #getFolder(): Promise<Folder | null> {
        return fromUuid(this.data.uuid);
    }

    async #handleActorFolder(
        data: FolderDropData,
        folder: Folder,
        event: DragEvent,
    ) {
        const actors = folder?.contents as Actor[];
        const topLeft = translateToTopLeftGrid(event);

        const xPosition: number = data.x ?? topLeft.x;
        const yPosition: number = data.y ?? topLeft.y;
        const elevation: number = data.elevation ?? 0;

        if (!actors?.length) return;

        const dropStyle = this.#settings.dropStyle;
        log(`Dropping ${actors.length} onto the canvas via ${dropStyle}`);

        if (dropStyle === "dialog") {
            await this.#handleDialogChoice({
                actors,
                xPosition,
                yPosition,
                elevation,
                isHidden: event.altKey,
            });
        } else if (dropStyle === "stack") {
            await this.#dropStack({
                actors,
                xPosition,
                yPosition,
                elevation,
                isHidden: event.altKey,
            });
        } else if (dropStyle === "random") {
            await this.#dropRandom({
                actors,
                xPosition,
                yPosition,
                elevation,
                isHidden: event.altKey,
            });
        } else if (dropStyle === "horizontalLine") {
            await this.#dropLine({
                actors,
                xPosition,
                yPosition,
                elevation,
                isHidden: event.altKey,
                isHorizontal: true,
            });
        } else if (dropStyle === "verticalLine") {
            await this.#dropLine({
                actors,
                xPosition,
                yPosition,
                elevation,
                isHidden: event.altKey,
                isHorizontal: false,
            });
        }
    }

    async #handleDialogChoice({
        actors,
        xPosition,
        yPosition,
        elevation,
        isHidden,
    }: DropActorFolderInput): Promise<void> {
        const dropStyles = [
            {
                value: "stack",
                label: game.i18n.localize("Droppables.StackedUp"),
            },
            {
                value: "random",
                label: game.i18n.localize("Droppables.Randomly"),
            },
            {
                value: "horizontalLine",
                label: game.i18n.localize("Droppables.HorizontalLine"),
            },
            {
                value: "verticalLine",
                label: game.i18n.localize("Droppables.VerticalLine"),
            },
        ];

        const content = await renderTemplate(
            "modules/dfreds-droppables/templates/drop-dialog.hbs",
            {
                dropStyles,
                savedDropStyle: this.#settings.lastUsedDropStyle,
                startingElevation: elevation ? Math.round(elevation) : null,
            },
        );

        new Dialog(
            {
                title: game.i18n.localize("Droppables.DropActorsFolder"),
                content: content,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-level-down-alt"></i>',
                        label: game.i18n.localize("Droppables.DropButton"),
                        callback: async (html) => {
                            const dropStyle = html
                                .find('select[name="drop-style"]')
                                .val();
                            const dropElevation = parseFloat(
                                html
                                    .find('input[name="elevation"]')
                                    .val() as string,
                            );

                            this.#settings.lastUsedDropStyle =
                                dropStyle as string;

                            if (dropStyle === "stack") {
                                await this.#dropStack({
                                    actors,
                                    xPosition,
                                    yPosition,
                                    isHidden,
                                    elevation: dropElevation,
                                });
                            } else if (dropStyle === "random") {
                                await this.#dropRandom({
                                    actors,
                                    xPosition,
                                    yPosition,
                                    isHidden,
                                    elevation: dropElevation,
                                });
                            } else if (dropStyle === "horizontalLine") {
                                await this.#dropLine({
                                    isHorizontal: true,
                                    actors,
                                    xPosition,
                                    yPosition,
                                    isHidden,
                                    elevation: dropElevation,
                                });
                            } else if (dropStyle === "verticalLine") {
                                await this.#dropLine({
                                    isHorizontal: false,
                                    actors,
                                    xPosition,
                                    yPosition,
                                    isHidden,
                                    elevation: dropElevation,
                                });
                            }
                        },
                    },
                },
            },
            { width: 320 },
        ).render(true);
    }

    async #dropStack({
        actors,
        xPosition,
        yPosition,
        isHidden,
        elevation = undefined,
    }: DropActorFolderInput) {
        for (const actor of actors) {
            await this.#dropActor({
                actor,
                xPosition,
                yPosition,
                isHidden,
                elevation,
            });
        }
    }

    async #dropRandom({
        actors,
        xPosition,
        yPosition,
        isHidden,
        elevation = undefined,
    }: DropActorFolderInput) {
        let distance = 0;
        let dropped = 0;
        let offsetX = 0;
        let offsetY = 0;

        for (const actor of actors) {
            const totalTries =
                Math.pow(1 + distance * 2, 2) - Math.pow(distance * 2 - 1, 2);

            const tries = Math.pow(1 + distance * 2, 2) - dropped;

            await this.#dropActor({
                actor,
                xPosition: xPosition + offsetX,
                yPosition: yPosition + offsetY,
                isHidden,
                elevation,
            });

            if (totalTries - tries < totalTries / 4) {
                offsetX += canvas.grid.sizeX;
            } else if (totalTries - tries < (2 * totalTries) / 4) {
                offsetY += canvas.grid.sizeY;
            } else if (totalTries - tries < (3 * totalTries) / 4) {
                offsetX -= canvas.grid.sizeX;
            } else {
                offsetY -= canvas.grid.sizeY;
            }

            dropped += 1;

            if (dropped === Math.pow(1 + distance * 2, 2)) {
                distance += 1;
                offsetX = -1 * distance * canvas.grid.sizeX;
                offsetY = -1 * distance * canvas.grid.sizeY;
            }
        }
    }

    async #dropLine({
        isHorizontal,
        actors,
        xPosition,
        yPosition,
        isHidden,
        elevation = undefined,
    }: DropActorFolderInput) {
        const step = isHorizontal ? canvas.grid.sizeX : canvas.grid.sizeY;

        let offsetX = 0;
        let offsetY = 0;

        for (const actor of actors) {
            const width =
                (foundry.utils.getProperty(
                    actor,
                    "prototypeToken.width",
                ) as number) || 1;
            const height =
                (foundry.utils.getProperty(
                    actor,
                    "prototypeToken.height",
                ) as number) || 1;

            await this.#dropActor({
                actor,
                xPosition: xPosition + offsetX,
                yPosition: yPosition + offsetY,
                isHidden,
                elevation,
            });

            if (isHorizontal) {
                offsetX += width * step;
            } else {
                offsetY += height * step;
            }
        }
    }

    async #dropActor({
        actor,
        xPosition,
        yPosition,
        isHidden,
        elevation,
    }: {
        actor: Actor;
        xPosition: number;
        yPosition: number;
        isHidden: boolean;
        elevation?: number;
    }): Promise<TokenDocument | undefined> {
        const tokenDocument = await actor.getTokenDocument({
            x: xPosition,
            y: yPosition,
            hidden: isHidden,
            elevation: Number.isNaN(elevation) ? 0 : elevation,
        });

        // await TokenDocument.createDocuments(tokenDocument, {
        //     parent: canvas.scene,
        // });
        // await canvas.scene.createEmbeddedDocuments(
        //     "Token",
        //     tokenDocument.toObject(),
        // );
        const token = new CONFIG.Token.documentClass(tokenDocument);
        return TokenDocument.create(token.toObject(), { parent: canvas.scene });

        // return tokenDocument.constructor.create(tokenDocument, {
        //     parent: canvas.scene,
        // });
    }

    async #handleJournalFolder(
        folder: Folder,
        event: DragEvent,
    ): Promise<void> {
        const entries = folder?.contents as JournalEntry[];
        const topLeft = translateToTopLeftGrid(event);

        Dialog.confirm({
            title: game.i18n.localize("Droppables.DropJournalFolder"),
            content: `<p>${game.i18n.format(
                "Droppables.DropJournalFolderExplanation",
                { folderName: folder?.name ?? "" },
            )}</p>`,
            yes: async () => {
                for (const entry of entries) {
                    await this.#dropJournalEntry({
                        entry,
                        xPosition: topLeft.x,
                        yPosition: topLeft.y,
                    });
                }
            },
        });
    }

    async #dropJournalEntry({
        entry,
        xPosition,
        yPosition,
    }: DropJournalFolderInput): Promise<
        NoteDocument<Scene | null> | undefined
    > {
        return NoteDocument.create(
            {
                entryId: entry.id,
                x: xPosition,
                y: yPosition,
            },
            { parent: canvas.scene },
        );
    }
}

export { FolderDropHandler };
export type { FolderDropData };
