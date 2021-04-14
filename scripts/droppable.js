import log from './logger.js';

export default class Droppable {
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

    for (let actor of actors) {
      await this._dropActor(actor, topLeft[0], topLeft[1], event.altKey);
    }
  }

  // TODO dropping in different ways
  // https://github.com/League-of-Foundry-Developers/fvtt-module-furnace/blob/07bddbb1324a92f7d48513128daef62af57c25cb/QoL/Tokens.js#L85
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
