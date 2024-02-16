export {};

declare global {
    interface ApplicationOptions {}

    interface PromptDialogData {
        title?: string;
        content?: string | HTMLElement | (() => string | HTMLElement);
        label?: string;
        callback?: (html: JQuery) => void | Promise<void>;
        render?: (html: HTMLElement | JQuery) => void;
        rejectClose?: boolean;
        options?: ApplicationOptions;
    }

    namespace Dialog {
        export function prompt(config?: PromptDialogData): Promise<unknown>;
    }
}
