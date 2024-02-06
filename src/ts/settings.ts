import { id as MODULE_ID } from "@static/module.json";

class Settings {
    // Settings keys
    #DROP_STYLE = "dropStyle";
    #LAST_USED_DROP_STYLE = "lastUsedDropStyle";

    /**
     * Register all settings for the module
     */
    registerSettings(): void {
        game.settings.register(MODULE_ID, this.#DROP_STYLE, {
            name: "Droppables.SettingDropStyle",
            hint: "Droppables.SettingDropStyleHint",
            scope: "client",
            config: true,
            default: "dialog",
            choices: {
                dialog: "Droppables.SettingDropStyleDialog",
                stack: "Droppables.SettingDropStyleStack",
                random: "Droppables.SettingDropStyleRandom",
                horizontalLine: "Droppables.SettingDropStyleHorizontalLine",
                verticalLine: "Droppables.SettingDropStyleVerticalLine",
            },
            type: String,
        });

        game.settings.register(MODULE_ID, this.#LAST_USED_DROP_STYLE, {
            name: "Last Used Drop Style",
            scope: "client",
            config: false,
            default: "random",
            type: String,
        });
    }

    /**
     * Returns the game setting for drop style
     *
     * @return a string representing the chosen drop style
     */
    get dropStyle(): string {
        return game.settings.get(MODULE_ID, this.#DROP_STYLE) as string;
    }

    /**
     * Returns the game setting for the last used drop style
     *
     * @return a string representing the last drop style
     */
    get lastUsedDropStyle(): string {
        return game.settings.get(
            MODULE_ID,
            this.#LAST_USED_DROP_STYLE,
        ) as string;
    }

    /**
     * Sets the game setting for the last used drop style
     *
     * @param value - a value representing the last used drop style
     */
    set lastUsedDropStyle(value: string) {
        game.settings.set(MODULE_ID, this.#LAST_USED_DROP_STYLE, value);
    }
}

export { Settings };
