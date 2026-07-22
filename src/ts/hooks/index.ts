import { Init } from "./init.ts";
import { Setup } from "./setup.ts";
import { ThreeDCanvasConfig } from "./3DCanvasConfig.ts";
import { CanvasInit } from "./canvasInit.ts";
import { RenderDirectory } from "./renderDirectory.ts";

interface Listener {
    listen(): void;
}

const HooksDroppables = {
    listen(): void {
        const listeners: Listener[] = [Init, Setup, ThreeDCanvasConfig, CanvasInit, RenderDirectory];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksDroppables };
export type { Listener };
