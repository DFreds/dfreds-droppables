import { Listener } from "./index.ts";

const GetHeaderControlsDocumentSheetV2: Listener = {
    listen(): void {
        Hooks.on("getHeaderControlsDocumentSheetV2", (sheet: any) => {
            const hasCopyUuidButton =
                $(sheet.element as HTMLElement).find(
                    "button[data-action='copyUuid']",
                ).length > 0;
            const hasDragDropButton =
                $(sheet.element as HTMLElement).find(
                    "button[data-action='dragDrop']",
                ).length > 0;

            if (!hasCopyUuidButton || hasDragDropButton) return;

            const dragDropLabel = game.i18n.localize("CONTROLS.DragDrop");
            const linkButton = $(`
                    <button type="button" class="header-control fa-solid fa-link icon" draggable="true" data-action="dragDrop"
                            data-tooltip="${dragDropLabel}" aria-label="${dragDropLabel}"></button>
                `);
            linkButton.on("dragstart", (event) => {
                event.originalEvent?.dataTransfer?.setData(
                    "text/plain",
                    JSON.stringify(sheet.document.toDragData()),
                );
            });

            const closeButton = $(sheet.window.close as HTMLElement);
            closeButton.before(linkButton);
        });
    },
};

export { GetHeaderControlsDocumentSheetV2 };
