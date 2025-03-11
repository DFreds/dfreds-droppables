import { MODULE_ID } from "./constants.ts";

class Settings {
    // Settings keys
    #FOLDER_DROP_STYLE = "dropStyle";
    #ENABLE_CANVAS_DRAG_UPLOAD = "enableCanvasDragUpload";
    #LAST_USED_FOLDER_DROP_STYLE = "lastUsedDropStyle";

    /**
     * Register all settings for the module
     */
    register(): void {
        game.settings.register(MODULE_ID, this.#FOLDER_DROP_STYLE, {
            name: EN_JSON.Droppables.SettingDropStyle,
            hint: EN_JSON.Droppables.SettingDropStyleHint,
            scope: "client",
            config: true,
            default: "dialog",
            choices: {
                dialog: EN_JSON.Droppables.SettingDropStyleDialog,
                stack: EN_JSON.Droppables.SettingDropStyleStack,
                random: EN_JSON.Droppables.SettingDropStyleRandom,
                horizontalLine:
                    EN_JSON.Droppables.SettingDropStyleHorizontalLine,
                verticalLine: EN_JSON.Droppables.SettingDropStyleVerticalLine,
            },
            type: String,
        });

        game.settings.register(MODULE_ID, this.#ENABLE_CANVAS_DRAG_UPLOAD, {
            name: EN_JSON.Droppables.SettingEnableCanvasDragUpload,
            hint: EN_JSON.Droppables.SettingEnableCanvasDragUploadHint,
            scope: "client",
            config: true,
            default: true,
            type: Boolean,
        });

        game.settings.register(MODULE_ID, this.#LAST_USED_FOLDER_DROP_STYLE, {
            name: "Last Used Folder Drop Style",
            scope: "client",
            config: false,
            default: "random",
            type: String,
        });
    }

    /**
     * Returns the game setting for drop style
     *
     * @returns a string representing the chosen drop style
     */
    get dropStyle(): string {
        return game.settings.get(MODULE_ID, this.#FOLDER_DROP_STYLE) as string;
    }

    /**
     * Returns the game setting for the canvas drag upload
     *
     * @returns a boolean indicating if canvas drag upload is enabled
     */
    get canvasDragUpload(): boolean {
        return game.settings.get(
            MODULE_ID,
            this.#ENABLE_CANVAS_DRAG_UPLOAD,
        ) as boolean;
    }

    /**
     * Returns the game setting for the last used drop style
     *
     * @returns a string representing the last drop style
     */
    get lastUsedDropStyle(): string {
        return game.settings.get(
            MODULE_ID,
            this.#LAST_USED_FOLDER_DROP_STYLE,
        ) as string;
    }

    /**
     * Sets the game setting for the last used drop style
     *
     * @param value - a value representing the last used drop style
     */
    set lastUsedDropStyle(value: string) {
        game.settings.set(MODULE_ID, this.#LAST_USED_FOLDER_DROP_STYLE, value);
    }
}

export { Settings };
