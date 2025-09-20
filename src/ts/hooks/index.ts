import { Init } from "./init.ts";
import { Setup } from "./setup.ts";
import { ThreeDCanvasConfig } from "./3DCanvasConfig.ts";
import { CanvasInit } from "./canvasInit.ts";
import { GetHeaderControlsDocumentSheetV2 } from "./getHeaderControlsDocumentSheetV2.ts";

interface Listener {
    listen(): void;
}

const HooksDroppables = {
    listen(): void {
        const listeners: Listener[] = [
            Init,
            Setup,
            ThreeDCanvasConfig,
            CanvasInit,
            GetHeaderControlsDocumentSheetV2,
        ];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksDroppables };
export type { Listener };
