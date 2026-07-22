import DocumentDirectory from "@client/applications/sidebar/document-directory.mjs";

interface SidebarDroppableHandler<TData> {
    canHandleDrop(): boolean;
    retrieveData(): TData;
    handleDrop(): boolean | Promise<boolean>;
}

interface SidebarDropContext {
    event: DragEvent;
    directory: DocumentDirectory<any>;
}

class SidebarDroppableManager {
    #handlers: SidebarDroppableHandler<any>[] = [];

    registerHandler(handler: SidebarDroppableHandler<any>): void {
        this.#handlers.push(handler);
    }

    async handleDrop(): Promise<boolean> {
        for (const handler of this.#handlers) {
            if (handler.canHandleDrop()) {
                return handler.handleDrop();
            }
        }
        return false;
    }
}

export type { SidebarDroppableHandler, SidebarDropContext };
export { SidebarDroppableManager };
