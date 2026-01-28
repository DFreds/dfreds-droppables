import { Settings } from "../settings.ts";
import { addDragDropHeaderButton } from "../ui/add-drag-drop-header-button.ts";
import { Listener } from "./index.ts";

const GetHeaderControlsDocumentSheetV2: Listener = {
    listen(): void {
        Hooks.on("getHeaderControlsDocumentSheetV2", (sheet: any) => {
            const settings = new Settings();
            if (!settings.enableDocumentDragDropLink) return;

            addDragDropHeaderButton(sheet);
        });
    },
};

export { GetHeaderControlsDocumentSheetV2 };
