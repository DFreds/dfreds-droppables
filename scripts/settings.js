export default class Settings {
  static PACKAGE_NAME = 'dfreds-droppables';

  // Settings keys
  static DROP_STYLE = 'dropStyle';
  static LAST_USED_DROP_STYLE = 'lastUsedDropStyle';

  /**
   * Register all settings for the module
   */
  registerSettings() {
    game.settings.register(Settings.PACKAGE_NAME, Settings.DROP_STYLE, {
      name: 'Droppables.SettingDropStyle',
      hint: 'Droppables.SettingDropStyleHint',
      scope: 'client',
      config: true,
      default: 'dialog',
      choices: {
        dialog: 'Droppables.SettingDropStyleDialog',
        stack: 'Droppables.SettingDropStyleStack',
        random: 'Droppables.SettingDropStyleRandom',
        horizontalLine: 'Droppables.SettingDropStyleHorizontalLine',
        verticalLine: 'Droppables.SettingDropStyleVerticalLine',
      },
      type: String,
    });

    game.settings.register(
      Settings.PACKAGE_NAME,
      Settings.LAST_USED_DROP_STYLE,
      {
        name: 'Last Used Drop Style',
        scope: 'client',
        config: false,
        default: 'random',
        type: String,
      }
    );
  }

  /**
   * Returns the game setting for drop style
   *
   * @returns {string} a string representing the chosen drop style
   */
  get dropStyle() {
    return game.settings.get(Settings.PACKAGE_NAME, Settings.DROP_STYLE);
  }

  /**
   * Returns the game setting for the last used drop style
   *
   * @returns {string} a string representing the last drop style
   */
  get lastUsedDropStyle() {
    return game.settings.get(
      Settings.PACKAGE_NAME,
      Settings.LAST_USED_DROP_STYLE
    );
  }

  /**
   * Sets the game setting for the last used drop style
   *
   * @param {string} value - a value representing the last used drop style
   */
  set lastUsedDropStyle(value) {
    game.settings.set(
      Settings.PACKAGE_NAME,
      Settings.LAST_USED_DROP_STYLE,
      value
    );
  }
}
