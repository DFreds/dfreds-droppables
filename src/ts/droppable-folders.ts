import { log } from "./logger.ts";
import { Settings } from "./settings.ts";

interface DropActorFolderInput {
    actors: Actor[];
    xPosition: number;
    yPosition: number;
    elevation?: number;
    isHidden: boolean;
    isHorizontal?: boolean;
}

interface FolderDropData {
    type: string;
    uuid: FolderUUID;
    x: number;
    y: number;
    elevation?: number;
}

class DroppableFolders {
    #settings = new Settings();

    /**
     * Handles the drop using the event and data
     *
     * @param {Object} params - the params for dropping data
     * @param {DragEvent} params.event - the drag event
     * @param {object} params.data - the data for the event
     * @param {function} params.errorCallback - the callback when an error occurs
     */
    async handleDrop({
        event,
        data,
        errorCallback,
    }: {
        event: DragEvent;
        data: FolderDropData;
        errorCallback: () => void;
    }): Promise<void> {
        try {
            // Only handle folder types
            if (data.type !== "Folder") {
                errorCallback();
                return;
            }

            const folder = (await fromUuid(data.uuid)) as Folder | null;

            if (folder?.type === "Actor") {
                this.#handleActorFolder(data, folder, event);
            } else if (folder?.type === "JournalEntry") {
                this.#handleJournalFolder(folder, event);
            } else {
                errorCallback();
                return;
            }
        } catch (error) {
            errorCallback();
            return;
        }
    }

    async #handleActorFolder(
        data: FolderDropData,
        folder: Folder,
        event: DragEvent,
    ) {
        const actors = folder?.contents as Actor[];
        const topLeft = this.#translateToTopLeftGrid(event);

        const xPosition: number = data.x ?? topLeft[0];
        const yPosition: number = data.y ?? topLeft[1];
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
        const content = await renderTemplate(
            "modules/dfreds-droppables/templates/drop-dialog.html",
            {
                dropStyle: this.#settings.lastUsedDropStyle,
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
                offsetX += canvas.grid.w;
            } else if (totalTries - tries < (2 * totalTries) / 4) {
                offsetY += canvas.grid.h;
            } else if (totalTries - tries < (3 * totalTries) / 4) {
                offsetX -= canvas.grid.w;
            } else {
                offsetY -= canvas.grid.h;
            }

            dropped += 1;

            if (dropped === Math.pow(1 + distance * 2, 2)) {
                distance += 1;
                offsetX = -1 * distance * canvas.grid.w;
                offsetY = -1 * distance * canvas.grid.h;
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
        const step = isHorizontal ? canvas.grid.w : canvas.grid.h;

        let offsetX = 0;
        let offsetY = 0;

        for (const actor of actors) {
            const width =
                getProperty<number>(actor, "prototypeToken.width") || 1;
            const height =
                getProperty<number>(actor, "prototypeToken.height") || 1;

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
        const topLeft = this.#translateToTopLeftGrid(event);

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
                        xPosition: topLeft[0],
                        yPosition: topLeft[1],
                    });
                }
            },
        });
    }

    async #dropJournalEntry({
        entry,
        xPosition,
        yPosition,
    }: {
        entry: JournalEntry;
        xPosition: number;
        yPosition: number;
    }): Promise<NoteDocument<Scene | null> | undefined> {
        return NoteDocument.create(
            {
                entryId: entry.id,
                x: xPosition,
                y: yPosition,
            },
            { parent: canvas.scene },
        );
    }

    #translateToTopLeftGrid(event: DragEvent): PointArray {
        // @ts-expect-error World transfer isn't defined on token layer for some reason
        const transform = canvas.tokens.worldTransform;
        const tx = (event.clientX - transform.tx) / canvas.stage.scale.x;
        const ty = (event.clientY - transform.ty) / canvas.stage.scale.y;

        return canvas.grid.getTopLeft(tx, ty);
    }
}

export { DroppableFolders };
export type { FolderDropData };
