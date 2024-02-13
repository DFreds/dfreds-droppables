export {};

declare global {
    namespace FilePicker {
        export function uploadPersistent(
            packageId: string,
            path: string,
            file: File,
            body?: object,
            options?: { notify?: boolean },
        ): Promise<any>;
    }

    interface Localization {
        has(stringId: string, fallback?: boolean): boolean;
    }

    interface Game {
        documentTypes: Record<string, string[]>;
    }

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
