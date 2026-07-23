/**
 * A single handler in a {@link DroppableManager} chain. Each handler inspects a drop event and, if
 * it applies, performs the drop.
 *
 * @typeParam TData - The shape of the data this handler extracts from the drop event.
 */
interface DroppableHandler<TData> {
    /**
     * Determines whether this handler should handle the current drop event.
     *
     * @returns True if this handler can handle the drop, false otherwise.
     */
    canHandleDrop(): boolean;

    /**
     * Extracts the data this handler needs from the drop event.
     *
     * @returns The extracted drop data.
     */
    retrieveData(): TData;

    /**
     * Performs the drop.
     *
     * @returns True if the drop was handled, false otherwise.
     */
    handleDrop(): boolean | Promise<boolean>;
}

/**
 * Registers a set of drop handlers and dispatches a drop to the first one that can handle it
 * (chain of responsibility). Shared by the canvas and sidebar drop integrations.
 */
class DroppableManager {
    #handlers: DroppableHandler<any>[] = [];

    /**
     * Registers a handler to be considered when a drop occurs. Handlers are tried in the order they
     * are registered.
     *
     * @param handler - The handler to register.
     */
    registerHandler(handler: DroppableHandler<any>): void {
        this.#handlers.push(handler);
    }

    /**
     * Dispatches the drop to the first registered handler that reports it can handle it.
     *
     * @returns True if a handler handled the drop, false if none did.
     */
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
