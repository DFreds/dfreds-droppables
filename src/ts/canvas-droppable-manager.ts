interface CanvasDroppableHandler<TData> {
    canHandleDrop(): boolean;
    retrieveData(): TData;
    handleDrop(): boolean | Promise<boolean>;
}

class CanvasDroppableManager {
    #handlers: CanvasDroppableHandler<any>[] = [];

    registerHandler(handler: CanvasDroppableHandler<any>): void {
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

export type { CanvasDroppableHandler };
export { CanvasDroppableManager };
