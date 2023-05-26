import Droppable from './droppable.js';
import { libWrapper } from './lib/shim.js';
import Settings from './settings.js';

Hooks.once('init', () => {
  new Settings().registerSettings();

  game.dfreds = game.dfreds || {};
});

Hooks.once('setup', () => {
  const MODULE_ID = 'dfreds-droppables';

  const droppable = new Droppable();

  // https://github.com/ruipin/fvtt-lib-wrapper/#134-shim
  // Note: Don't simply pass in the function onCanvasDrop, or you lose 'this' referring to Droppable
  libWrapper.register(
    MODULE_ID,
    'Canvas.prototype._onDrop',
    function (wrapper, ...args) {
      droppable.onCanvasDrop(wrapper, ...args);
    }
  );
});

// TODO need to double check this works in v11 when it's updated
Hooks.on('3DCanvasConfig', (config) => {
  config.INTERACTIONS.dropFunctions.Folder = async function (event, data) {
    canvas.tokens.activate();

    const droppable = new Droppable();
    droppable.handleDrop({ event, data, errorCallback: () => {} });
  };
});
