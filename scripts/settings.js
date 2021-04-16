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
      name: 'Drop Style',
      hint:
        'This is how the items in the folder will be dropped onto the canvas. Choosing "Dialog" will prompt you each time for one of the options.',
      scope: 'client',
      config: true,
      default: 'dialog',
      choices: {
        dialog: 'Dialog',
        stack: 'Stack',
        random: 'Random',
        horizontalLine: 'Horizontal Line',
        verticalLine: 'Vertical Line',
      },
      type: String,
    });

    game.settings.register(Settings.PACKAGE_NAME, Settings.LAST_USED_DROP_STYLE, {
      name: 'Last Used Drop Style',
      scope: 'client',
      config: false,
      type: String,
    });
  }

  /**
   * Returns the game setting for drop style
   *
   * @returns {String} a string representing the chosen drop style
   */
  get dropStyle() {
    return game.settings.get(Settings.PACKAGE_NAME, Settings.DROP_STYLE);
  }

  /**
   * Returns the game setting for the last used drop style
   * 
   * @returns {String} a string representing the last drop style
   */
  get lastUsedDropStyle() {
    return game.settings.get(Settings.PACKAGE_NAME, Settings.LAST_USED_DROP_STYLE);
  }

  /**
   * Sets the game setting for the last used drop style
   * 
   * @param {String} value - a value representing the last used drop style
   */
  set lastUsedDropStyle(value) {
    game.settings.set(Settings.PACKAGE_NAME, Settings.LAST_USED_DROP_STYLE, value);
  }
}
