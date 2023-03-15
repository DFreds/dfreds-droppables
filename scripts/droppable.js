import log from './logger.js';
import Settings from './settings.js';

export default class Droppable {
  /**
   * Creates a new Droppable class
   */
  constructor() {
    this._settings = new Settings();
  }

  /**
   * This function is called when something is dropped onto the canvas. If the
   * item dropped onto the canvas is a folder, it is handled here. Otherwise,
   * the original wrapper function is used.
   *
   * @param {fn} wrapper - The original onDrop function
   * @param  {...any} args - Any arguments provided with the original onDrop function
   */
  onCanvasDrop(wrapper, ...args) {
    const [event] = args;
    const data = this._getDataFromEvent(event);

    this.handleDrop({
      event,
      data,
      errorCallback: () => {
        wrapper(...args);
      },
    });
  }

  /**
   * Handles the drop using the event and data
   *
   * @param {object} params - the params for dropping data
   * @param {DragEvent} params.event - the drag event
   * @param {object} params.data - the data for the event
   * @param {function} params.errorCallback - the callback when an error occurs
   */
  handleDrop({ event, data, errorCallback }) {
    try {
      // Only handle folder types
      if (data.type !== 'Folder') {
        errorCallback();
        return;
      }

      if (data.documentName === 'Actor') {
        this._handleActorFolder(data, event);
      } else if (data.documentName === 'JournalEntry') {
        this._handleJournalFolder(data, event);
      } else {
        errorCallback();
        return;
      }
    } catch (error) {
      errorCallback();
      return;
    }
  }

  _getDataFromEvent(event) {
    return JSON.parse(event.dataTransfer.getData('text/plain'));
  }

  async _handleActorFolder(data, event) {
    const folder = fromUuidSync(data.uuid);
    const actors = folder.contents;
    const topLeft = this._translateToTopLeftGrid(event);

    let xPosition = data.x ?? topLeft[0];
    let yPosition = data.y ?? topLeft[1];
    let elevation = data.elevation;

    if (actors.length === 0) return;

    const dropStyle = this._settings.dropStyle;
    log(`Dropping ${actors.length} onto the canvas via ${dropStyle}`);

    if (dropStyle === 'dialog') {
      await this._handleDialogChoice({
        actors,
        xPosition,
        yPosition,
        elevation,
        isHidden: event.altKey,
      });
    } else if (dropStyle === 'stack') {
      await this._dropStack({
        actors,
        xPosition,
        yPosition,
        elevation,
        isHidden: event.altKey,
      });
    } else if (dropStyle === 'random') {
      await this._dropRandom({
        actors,
        xPosition,
        yPosition,
        elevation,
        isHidden: event.altKey,
      });
    } else if (dropStyle === 'horizontalLine') {
      await this._dropLine({
        isHorizontal: true,
        actors,
        xPosition,
        yPosition,
        elevation,
        isHidden: event.altKey,
      });
    } else if (dropStyle === 'verticalLine') {
      await this._dropLine({
        isHorizontal: false,
        actors,
        xPosition,
        yPosition,
        elevation,
        isHidden: event.altKey,
      });
    }
  }

  async _handleDialogChoice({
    actors,
    xPosition,
    yPosition,
    elevation,
    isHidden,
  }) {
    const content = await renderTemplate(
      'modules/dfreds-droppables/templates/drop-dialog.html',
      {
        dropStyle: this._settings.lastUsedDropStyle,
        startingElevation: Math.round(elevation),
      }
    );

    new Dialog(
      {
        title: game.i18n.localize('Droppables.DropActorsFolder'),
        content: content,
        buttons: {
          yes: {
            icon: '<i class="fas fa-level-down-alt"></i>',
            label: game.i18n.localize('Droppables.DropButton'),
            callback: async (html) => {
              const dropStyle = html.find('select[name="drop-style"]').val();
              const dropElevation = parseFloat(
                html.find('input[name="elevation"]').val()
              );

              this._settings.lastUsedDropStyle = dropStyle;

              if (dropStyle === 'stack') {
                await this._dropStack({
                  actors,
                  xPosition,
                  yPosition,
                  isHidden,
                  elevation: dropElevation,
                });
              } else if (dropStyle === 'random') {
                await this._dropRandom({
                  actors,
                  xPosition,
                  yPosition,
                  isHidden,
                  elevation: dropElevation,
                });
              } else if (dropStyle === 'horizontalLine') {
                await this._dropLine({
                  isHorizontal: true,
                  actors,
                  xPosition,
                  yPosition,
                  isHidden,
                  elevation: dropElevation,
                });
              } else if (dropStyle === 'verticalLine') {
                await this._dropLine({
                  isHorizontal: false,
                  actors,
                  xPosition,
                  yPosition,
                  isHidden,
                  elevation: dropElevation,
                });
              }
            },
          },
        },
      },
      { width: 320 }
    ).render(true);
  }

  async _dropStack({
    actors,
    xPosition,
    yPosition,
    isHidden,
    elevation = null,
  }) {
    for (let actor of actors) {
      await this._dropActor({
        actor,
        xPosition,
        yPosition,
        isHidden,
        elevation,
      });
    }
  }

  async _dropRandom({
    actors,
    xPosition,
    yPosition,
    isHidden,
    elevation = null,
  }) {
    let distance = 0;
    let dropped = 0;
    let offsetX = 0;
    let offsetY = 0;

    for (let actor of actors) {
      const totalTries =
        Math.pow(1 + distance * 2, 2) - Math.pow(distance * 2 - 1, 2);

      let tries = Math.pow(1 + distance * 2, 2) - dropped;

      await this._dropActor({
        actor,
        xPosition: xPosition + offsetX,
        yPosition: yPosition + offsetY,
        isHidden,
        elevation,
      });

      if (totalTries - tries < totalTries / 4) {
        offsetX += canvas.grid.w;
      } else if (totalTries - tries < (2 * totalTries) / 4) {
        offsetY += canvas.grid.h;
      } else if (totalTries - tries < (3 * totalTries) / 4) {
        offsetX -= canvas.grid.w;
      } else {
        offsetY -= canvas.grid.h;
      }

      dropped += 1;

      if (dropped === Math.pow(1 + distance * 2, 2)) {
        distance += 1;
        offsetX = -1 * distance * canvas.grid.w;
        offsetY = -1 * distance * canvas.grid.h;
      }
    }
  }

  async _dropLine({
    isHorizontal,
    actors,
    xPosition,
    yPosition,
    isHidden,
    elevation = null,
  }) {
    const step = isHorizontal ? canvas.grid.w : canvas.grid.h;

    let offsetX = 0;
    let offsetY = 0;

    for (let actor of actors) {
      const width = getProperty(actor, 'prototypeToken.width') || 1;
      const height = getProperty(actor, 'prototypeToken.height') || 1;

      await this._dropActor({
        actor,
        xPosition: xPosition + offsetX,
        yPosition: yPosition + offsetY,
        isHidden,
        elevation,
      });

      if (isHorizontal) {
        offsetX += width * step;
      } else {
        offsetY += height * step;
      }
    }
  }

  async _dropActor({ actor, xPosition, yPosition, isHidden, elevation }) {
    const tokenDocument = await actor.getTokenDocument({
      x: xPosition,
      y: yPosition,
      hidden: isHidden,
      elevation: isNaN(elevation) ? 0 : elevation,
    });

    return tokenDocument.constructor.create(tokenDocument, {
      parent: canvas.scene,
    });
  }

  async _handleJournalFolder(data, event) {
    const folder = fromUuidSync(data.uuid);
    const entries = folder.contents;
    const topLeft = this._translateToTopLeftGrid(event);

    Dialog.confirm({
      title: game.i18n.localize('Droppables.DropJournalFolder'),
      content: `<p>${game.i18n.format(
        'Droppables.DropJournalFolderExplanation',
        { folderName: folder.name }
      )}</p>`,
      yes: async () => {
        for (let entry of entries) {
          await this._dropJournalEntry({
            entry,
            xPosition: topLeft[0],
            yPosition: topLeft[1],
          });
        }
      },
    });
  }

  async _dropJournalEntry({ entry, xPosition, yPosition }) {
    return NoteDocument.create(
      {
        entryId: entry.id,
        x: xPosition,
        y: yPosition,
      },
      { parent: canvas.scene }
    );
  }

  _translateToTopLeftGrid(event) {
    const transform = canvas.tokens.worldTransform;
    const tx = (event.clientX - transform.tx) / canvas.stage.scale.x;
    const ty = (event.clientY - transform.ty) / canvas.stage.scale.y;

    return canvas.grid.getTopLeft(tx, ty);
  }
}
