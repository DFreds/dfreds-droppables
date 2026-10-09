import { Settings } from "../settings.ts";
import { getActiveLevelElevation, getActiveLevelId } from "./util.ts";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;
const { TextEditor } = foundry.applications.ux;

type DropStyle = "stack" | "random" | "horizontalLine" | "verticalLine";

interface CanvasDropData {
    type: string;
    uuid: string;
    x: number;
    y: number;
    elevation?: number;
}

interface DropActorsInput {
    actors: Actor[];
    xPosition: number;
    yPosition: number;
    elevation?: number;
    isHidden: boolean;
}

function getCanvasDropData(event: DragEvent): CanvasDropData {
    const json = TextEditor.getDragEventData(event);
    return {
        type: json["type"] as string,
        uuid: json["uuid"] as string,
        x: json["x"] as number,
        y: json["y"] as number,
        elevation: json["elevation"] as number | undefined,
    };
}

async function dropActors(dropStyle: DropStyle, input: DropActorsInput): Promise<void> {
    if (dropStyle === "stack") {
        await dropStack(input);
    } else if (dropStyle === "random") {
        await dropRandom(input);
    } else if (dropStyle === "horizontalLine") {
        await dropLine(input, true);
    } else if (dropStyle === "verticalLine") {
        await dropLine(input, false);
    }
}

async function promptDropActors(input: DropActorsInput, { allowCount = false } = {}): Promise<boolean | null> {
    const settings = new Settings();
    const dropStyles: { value: DropStyle; label: string }[] = [
        { value: "stack", label: game.i18n.localize("Droppables.StackedUp") },
        { value: "random", label: game.i18n.localize("Droppables.Randomly") },
        { value: "horizontalLine", label: game.i18n.localize("Droppables.HorizontalLine") },
        { value: "verticalLine", label: game.i18n.localize("Droppables.VerticalLine") },
    ];

    const levelElevation = getActiveLevelElevation();
    const elevationAboveLevel = (input.elevation ?? levelElevation) - levelElevation;

    const content = await renderTemplate("modules/dfreds-droppables/templates/drop-dialog.hbs", {
        dropStyles,
        savedDropStyle: settings.lastUsedDropStyle,
        startingElevation: elevationAboveLevel ? Math.round(elevationAboveLevel) : null,
        allowCount,
    });

    return DialogV2.confirm({
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
                const form = dialog.element;
                const dropStyle = form.querySelector<HTMLSelectElement>('select[name="drop-style"]')
                    ?.value as DropStyle;
                const elevationInput = form.querySelector<HTMLInputElement>('input[name="elevation"]')?.value ?? "";
                const countInput = form.querySelector<HTMLInputElement>('input[name="count"]')?.value ?? "";
                const count = Math.max(1, parseInt(countInput, 10) || 1);

                settings.lastUsedDropStyle = dropStyle;

                await dropActors(dropStyle, {
                    ...input,
                    actors: input.actors.flatMap((actor) => Array<Actor>(count).fill(actor)),
                    elevation: parseFloat(elevationInput) + levelElevation,
                });
            },
        },
    });
}

async function dropStack({ actors, xPosition, yPosition, isHidden, elevation }: DropActorsInput): Promise<void> {
    for (const actor of actors) {
        await dropActor({ actor, xPosition, yPosition, isHidden, elevation });
    }
}

async function dropRandom({ actors, xPosition, yPosition, isHidden, elevation }: DropActorsInput): Promise<void> {
    let distance = 0;
    let dropped = 0;
    let offsetX = 0;
    let offsetY = 0;

    for (const actor of actors) {
        const totalTries = Math.pow(1 + distance * 2, 2) - Math.pow(distance * 2 - 1, 2);

        const tries = Math.pow(1 + distance * 2, 2) - dropped;

        await dropActor({
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

async function dropLine(
    { actors, xPosition, yPosition, isHidden, elevation }: DropActorsInput,
    isHorizontal: boolean,
): Promise<void> {
    const step = isHorizontal ? canvas.grid.sizeX : canvas.grid.sizeY;

    let offsetX = 0;
    let offsetY = 0;

    for (const actor of actors) {
        const width = (foundry.utils.getProperty(actor, "prototypeToken.width") as number) || 1;
        const height = (foundry.utils.getProperty(actor, "prototypeToken.height") as number) || 1;

        await dropActor({
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

async function dropActor({
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
        elevation: Number.isFinite(elevation) ? elevation : getActiveLevelElevation(),
        level: getActiveLevelId(),
    });

    return TokenDocument.create(tokenDocument.toObject(), { parent: canvas.scene });
}

export { getCanvasDropData, dropActors, promptDropActors };
export type { CanvasDropData, DropStyle };
