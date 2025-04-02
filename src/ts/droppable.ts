interface DroppableHandler<TData> {
    canHandleDrop(): boolean;
    retrieveData(): TData;
    handleDrop(): boolean | Promise<boolean>;
}

class DroppableManager {
    #handlers: DroppableHandler<any>[] = [];

    registerHandler(handler: DroppableHandler<any>): void {
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

export type { DroppableHandler };
export { DroppableManager };
