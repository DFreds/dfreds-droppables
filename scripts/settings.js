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
      name: game.i18n.localize('Droppables.SettingDropStyle'),
      hint: game.i18n.localize('Droppables.SettingDropStyleHint'),
      scope: 'client',
      config: true,
      default: 'dialog',
      choices: {
        dialog: game.i18n.localize('Droppables.SettingDropStyleDialog'),
        stack: game.i18n.localize('Droppables.SettingDropStyleStack'),
        random: game.i18n.localize('Droppables.SettingDropStyleRandom'),
        horizontalLine: game.i18n.localize(
          'Droppables.SettingDropStyleHorizontalLine'
        ),
        verticalLine: game.i18n.localize(
          'Droppables.SettingDropStyleVerticalLine'
        ),
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
