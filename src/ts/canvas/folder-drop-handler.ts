import { log } from "../logger.ts";
import { Settings } from "../settings.ts";
import { DroppableHandler } from "../shared/droppable-manager.ts";
import { CanvasDropData, dropActors, getCanvasDropData, promptDropActors } from "./actor-placement.ts";
import { getActiveLevelElevation, getActiveLevels, translateToTopLeftGrid } from "./util.ts";

const { DialogV2 } = foundry.applications.api;

interface DropJournalFolderInput {
    entry: JournalEntry;
    xPosition: number;
    yPosition: number;
}

class FolderDropHandler implements DroppableHandler<CanvasDropData> {
    data: CanvasDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        return this.data.type === "Folder";
    }

    retrieveData(): CanvasDropData {
        return getCanvasDropData(this.#event);
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

    async #handleActorFolder(data: CanvasDropData, folder: Folder, event: DragEvent) {
        const actors = folder?.contents as Actor[];
        if (!actors?.length) return;

        const topLeft = translateToTopLeftGrid(event);
        const input = {
            actors,
            xPosition: data.x ?? topLeft.x,
            yPosition: data.y ?? topLeft.y,
            elevation: data.elevation ?? getActiveLevelElevation(),
            isHidden: event.altKey,
        };

        const dropStyle = this.#settings.dropStyle;
        log(`Dropping ${actors.length} onto the canvas via ${dropStyle}`);

        if (dropStyle === "dialog") {
            await promptDropActors(input);
        } else {
            await dropActors(dropStyle, input);
        }
    }

    async #handleJournalFolder(folder: Folder, event: DragEvent): Promise<boolean | null> {
        const entries = folder?.contents as JournalEntry[];
        const topLeft = translateToTopLeftGrid(event);

        return DialogV2.confirm({
            window: {
                title: game.i18n.localize("Droppables.DropJournalFolder"),
                controls: [],
            },
            content: `<p>${game.i18n.localize("Droppables.DropJournalFolderExplanation", {
                folderName: folder?.name ?? "",
            })}</p>`,
            yes: {
                icon: "fas fa-level-down-alt",
                label: game.i18n.localize("Droppables.DropButton"),
                callback: async () => {
                    for (const entry of entries) {
                        await this.#dropJournalEntry({
                            entry,
                            xPosition: topLeft.x,
                            yPosition: topLeft.y,
                        });
                    }
                },
            },
        });
    }

    async #dropJournalEntry({
        entry,
        xPosition,
        yPosition,
    }: DropJournalFolderInput): Promise<NoteDocument<Scene | null> | undefined> {
        // @ts-expect-error not typed for some reason
        return NoteDocument.create(
            {
                entryId: entry.id,
                x: xPosition,
                y: yPosition,
                elevation: getActiveLevelElevation(),
                levels: getActiveLevels(),
            },
            { parent: canvas.scene },
        );
    }
}

export { FolderDropHandler };
