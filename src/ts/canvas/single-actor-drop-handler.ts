import { Settings } from "../settings.ts";
import { DroppableHandler } from "../shared/drop-dispatch.ts";
import { CanvasDropData, dropActors, getCanvasDropData, promptDropActors } from "./actor-placement.ts";
import { getActiveLevelElevation, translateToTopLeftGrid } from "./util.ts";

class SingleActorDropHandler implements DroppableHandler {
    data: CanvasDropData;

    #event: DragEvent;
    #settings = new Settings();

    constructor(event: DragEvent) {
        this.#event = event;
        this.data = this.retrieveData();
    }

    canHandleDrop(): boolean {
        if (this.data.uuid && this.data.uuid.toLowerCase().startsWith("compendium")) {
            return false;
        }
        return this.data.type === "Actor" && (this.#settings.enableUnlinkedActorDropHandler || this.#event.shiftKey);
    }

    retrieveData(): CanvasDropData {
        return getCanvasDropData(this.#event);
    }

    async handleDrop(): Promise<boolean> {
        this.#event.preventDefault();

        if (!this.data.uuid) return false;

        const actor = (await fromUuid(this.data.uuid)) as Actor | null;
        if (!actor) return false;

        const topLeft = translateToTopLeftGrid(this.#event);
        const input = {
            actors: [actor],
            xPosition: this.data.x ?? topLeft.x,
            yPosition: this.data.y ?? topLeft.y,
            elevation: this.data.elevation ?? getActiveLevelElevation(),
            isHidden: this.#event.altKey,
        };

        const isLinked = Boolean(foundry.utils.getProperty(actor, "prototypeToken.actorLink"));
        if (isLinked) {
            await dropActors("stack", input);
        } else {
            await promptDropActors(input, { allowCount: true });
        }

        return true;
    }
}

export { SingleActorDropHandler };
