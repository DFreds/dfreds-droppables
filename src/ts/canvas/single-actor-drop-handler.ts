import { DroppableHandler } from "../droppable.ts";
import { Settings } from "../settings.ts";
import { translateToTopLeftGrid } from "../util.ts";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;
const { TextEditor } = foundry.applications.ux;

interface ActorDropData {
    type: string;
    uuid: string;
    x: number;
    y: number;
    elevation?: number;
}

interface DropManyInput {
    actors: Actor[];
    xPosition: number;
    yPosition: number;
    elevation?: number;
    isHidden: boolean;
    isHorizontal?: boolean;
}

class SingleActorDropHandler implements DroppableHandler<ActorDropData> {
    data: ActorDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        return this.data.type === "Actor";
    }

    retrieveData(): ActorDropData {
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

        const actor = (await fromUuid(this.data.uuid)) as Actor | null;
        if (!actor) return false;

        const topLeft = translateToTopLeftGrid(this.#event);
        const xPosition: number = this.data.x ?? topLeft.x;
        const yPosition: number = this.data.y ?? topLeft.y;
        const elevation: number = this.data.elevation ?? 0;
        const isHidden = this.#event.altKey;

        // Show dialog only for unlinked NPCs. For all others, drop a single token immediately.
        const isNpc = actor.type === "npc";
        const isLinked = Boolean(foundry.utils.getProperty(actor, "prototypeToken.actorLink"));

        if (!isNpc || isLinked) {
            await this.#dropActor({
                actor,
                xPosition,
                yPosition,
                isHidden,
                elevation,
            });
            return true;
        }

        // Unlinked NPC: show dialog with count input
        const dropStyles = [
            { value: "stack", label: game.i18n.localize("Droppables.StackedUp") },
            { value: "random", label: game.i18n.localize("Droppables.Randomly") },
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
                allowCount: true,
                defaultCount: 1,
            },
        );

        await DialogV2.confirm({
            window: {
                title: game.i18n.localize("Droppables.DropActorsFolder"),
                controls: [],
            },
            content,
            position: { width: 320 },
            yes: {
                icon: "fas fa-level-down-alt",
                label: game.i18n.localize("Droppables.DropButton"),
                callback: async (_event, _button, dialog) => {
                    const $html = $(dialog.element);
                    const dropStyle = $html.find('select[name="drop-style"]').val();
                    const dropElevation = parseFloat(
                        $html.find('input[name="elevation"]').val() as string,
                    );
                    const countRaw = parseInt(
                        ($html.find('input[name="count"]').val() as string) ?? "1",
                        10,
                    );
                    const count = Math.max(1, Number.isNaN(countRaw) ? 1 : countRaw);

                    this.#settings.lastUsedDropStyle = dropStyle as string;

                    const actors = Array.from({ length: count }, () => actor);

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
        });

        return true;
    }

    async #dropStack({
        actors,
        xPosition,
        yPosition,
        isHidden,
        elevation = undefined,
    }: DropManyInput) {
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
    }: DropManyInput) {
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
    }: DropManyInput) {
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

        const token = new CONFIG.Token.documentClass(tokenDocument);
        return TokenDocument.create(token.toObject(), { parent: canvas.scene });
    }
}

export { SingleActorDropHandler };
export type { ActorDropData };
