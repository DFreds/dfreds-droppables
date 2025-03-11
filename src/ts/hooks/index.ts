import { Init } from "./init.ts";
import { Setup } from "./setup.ts";
import { ThreeDCanvasConfig } from "./3DCanvasConfig.ts";

interface Listener {
    listen(): void;
}

const HooksDroppables = {
    listen(): void {
        const listeners: Listener[] = [Init, Setup, ThreeDCanvasConfig];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksDroppables };
export type { Listener };
