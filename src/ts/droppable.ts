abstract class Droppable<TEvent extends Event, TData> {
    event: TEvent;
    data: TData;

    protected constructor(event: TEvent) {
        this.event = event;
        this.data = this.retrieveData();
    }

    protected canHandleDrop(): boolean {
        return false;
    }

    abstract retrieveData(): TData;

    abstract handleDrop(): boolean | Promise<boolean>;
}

export { Droppable };
