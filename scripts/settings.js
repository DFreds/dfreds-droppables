export default class Settings {
  static PACKAGE_NAME = 'dfreds-droppables';

  // Settings keys
  static DROP_STYLE = 'dropStyle';

  /**
   * Register all settings for the module
   */
  registerSettings() {
    game.settings.register(Settings.PACKAGE_NAME, Settings.DROP_STYLE, {
      name: 'Drop Style',
      hint: 'This is how the items in the folder will be dropped onto the canvas.',
      scope: 'world', // local??
      config: true,
      default: 'dialog',
      choices: {
        dialog: 'Dialog',
        stack: 'Stack',
        random: 'Random',
        horizontalLine: 'Horizontal Line',
        verticalLine: 'Vertical Line'
      },
      type: String
    });
  }

  /**
   * Returns the game setting for drop style
   * 
   * @returns {String} a string representing the chosen drop type
   */
  get dropStyle() {
    return game.settings.get(Settings.PACKAGE_NAME, Settings.DROP_STYLE);
  }
}