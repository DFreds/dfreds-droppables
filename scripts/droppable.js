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
    try {
      const [event] = args;
      const data = this._getDataFromEvent(event);

      // Only handle folder types
      if (data.type !== 'Folder') {
        wrapper(...args);
        return;
      }

      if (data.entity === 'Actor') {
        this._handleActorFolder(data, event);
      } else if (data.entity === 'JournalEntry') {
        this._handleJournalFolder(data, event);
      } else {
        wrapper(...args);
        return;
      }
    } catch (error) {
      wrapper(...args);
      return;
    }
  }

  _getDataFromEvent(event) {
    return JSON.parse(event.dataTransfer.getData('text/plain'));
  }

  async _handleActorFolder(data, event) {
    const folder = game.folders.get(data.id);
    const actors = folder.content;
    const topLeft = this._getTopLeft(event);

    if (actors.length === 0) return;

    const dropStyle = this._settings.dropStyle;
    log(`Dropping ${actors.length} onto the canvas via ${dropStyle}`);

    if (dropStyle === 'dialog') {
      await this._handleDialogChoice(
        actors,
        topLeft[0],
        topLeft[1],
        event.altKey
      );
    } else if (dropStyle === 'stack') {
      await this._dropStack(actors, topLeft[0], topLeft[1], event.altKey);
    } else if (dropStyle === 'random') {
      await this._dropRandom(actors, topLeft[0], topLeft[1], event.altKey);
    } else if (dropStyle === 'horizontalLine') {
      await this._dropLine(true, actors, topLeft[0], topLeft[1], event.altKey);
    } else if (dropStyle === 'verticalLine') {
      await this._dropLine(false, actors, topLeft[0], topLeft[1], event.altKey);
    }
  }

  async _handleDialogChoice(actors, xPosition, yPosition, isHidden) {
    const content = await renderTemplate(
      'modules/dfreds-droppables/templates/drop-dialog.html',
      { dropStyle: game.dfreds.droppables.lastDropStyle }
    );

    new Dialog(
      {
        title: 'Drop Actors Folder',
        content: content,
        buttons: {
          yes: {
            icon: '<i class="fas fa-level-down-alt"></i>',
            label: 'Drop',
            callback: async (html) => {
              const dropStyle = html.find('select[name="drop-style"]').val();

              game.dfreds.droppables.lastDropStyle = dropStyle;

              if (dropStyle === 'stack') {
                await this._dropStack(actors, xPosition, yPosition, isHidden);
              } else if (dropStyle === 'random') {
                await this._dropRandom(actors, xPosition, yPosition, isHidden);
              } else if (dropStyle === 'horizontalLine') {
                await this._dropLine(
                  true,
                  actors,
                  xPosition,
                  yPosition,
                  isHidden
                );
              } else if (dropStyle === 'verticalLine') {
                await this._dropLine(
                  false,
                  actors,
                  xPosition,
                  yPosition,
                  isHidden
                );
              }
            },
          },
        },
      },
      { width: 320 }
    ).render(true);
  }

  async _dropStack(actors, xPosition, yPosition, isHidden) {
    for (let actor of actors) {
      await this._dropActor(actor, xPosition, yPosition, isHidden);
    }
  }

  async _dropRandom(actors, xPosition, yPosition, isHidden) {
    let distance = 0;
    let dropped = 0;
    let offsetX = 0;
    let offsetY = 0;

    for (let actor of actors) {
      const totalTries =
        Math.pow(1 + distance * 2, 2) - Math.pow(distance * 2 - 1, 2);

      let tries = Math.pow(1 + distance * 2, 2) - dropped;

      await this._dropActor(
        actor,
        xPosition + offsetX,
        yPosition + offsetY,
        isHidden
      );

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

  async _dropLine(isHorizontal, actors, xPosition, yPosition, isHidden) {
    const step = isHorizontal ? canvas.grid.w : canvas.grid.h;

    let offsetX = 0;
    let offsetY = 0;

    for (let actor of actors) {
      const width = getProperty(actor, 'data.token.width') || 1;
      const height = getProperty(actor, 'data.token.height') || 1;

      await this._dropActor(
        actor,
        xPosition + offsetX,
        yPosition + offsetY,
        isHidden
      );

      if (isHorizontal) {
        offsetX += width * step;
      } else {
        offsetY += height * step;
      }
    }
  }

  async _dropActor(actor, xPosition, yPosition, isHidden) {
    const tokenData = actor.data.token;

    tokenData.x = xPosition;
    tokenData.y = yPosition;
    tokenData.hidden = isHidden;

    if (tokenData.randomImg) {
      const images = await actor.getTokenImages();
      const image = images[Math.floor(Math.random() * images.length)];
      tokenData.img = image;
    }

    return Token.create(tokenData);
  }

  async _handleJournalFolder(data, event) {
    const folder = game.folders.get(data.id);
    const entries = folder.content;
    const topLeft = this._getTopLeft(event);

    for (let entry of entries) {
      await this._dropJournalEntry(entry, { x: topLeft[0], y: topLeft[1] });
    }
  }

  async _dropJournalEntry(entry, entryData) {
    return Note.create({
      entryId: entry.id,
      x: entryData.x,
      y: entryData.y,
    });
  }

  _getTopLeft(event) {
    const t = canvas.tokens.worldTransform,
      tx = (event.clientX - t.tx) / canvas.stage.scale.x,
      ty = (event.clientY - t.ty) / canvas.stage.scale.y;

    return canvas.grid.getTopLeft(tx, ty);
  }
}
