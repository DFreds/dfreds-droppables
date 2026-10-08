/**
 * A single drop handler. Each handler inspects a drop event and, if it applies, performs the drop.
 */
interface DroppableHandler {
    /**
     * Determines whether this handler should handle the current drop event.
     *
     * @returns True if this handler can handle the drop, false otherwise.
     */
    canHandleDrop(): boolean;

    /**
     * Performs the drop.
     *
     * @returns True if the drop was handled, false otherwise.
     */
    handleDrop(): boolean | Promise<boolean>;
}

/**
 * Dispatches a drop to the first handler that reports it can handle it. Handlers are tried in
 * order.
 *
 * @param handlers - The handlers to try.
 * @returns True if a handler handled the drop, false if none did.
 */
async function dispatchDrop(handlers: DroppableHandler[]): Promise<boolean> {
    for (const handler of handlers) {
        if (handler.canHandleDrop()) {
            return handler.handleDrop();
        }
    }
    return false;
}

export type { DroppableHandler };
export { dispatchDrop };
