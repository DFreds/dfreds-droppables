import log from './logger.js';

export default class Droppable {
  onCanvasDrop(wrapper, ...args) {
    const [event] = args;
    try {
      const data = this._getDataFromEvent(event);

      if (data.type !== 'Folder') {
        return wrapper(...args);
      }

      // TODO handle other types of data
      if (data.entity === 'Actor') {
        this._handleActorFolder(data, event);
      } else {
        wrapper(...args);
      }
    } catch (error) {
      wrapper(...args);
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
        await this._dropActor(actor, this._convertEventInfoToTokenData(topLeft[0], topLeft[1], event.altKey));
      }
  }

  _getTopLeft(event) {
      const t = canvas.tokens.worldTransform,
        tx = (event.clientX - t.tx) / canvas.stage.scale.x,
        ty = (event.clientY - t.ty) / canvas.stage.scale.y;

      return canvas.grid.getTopLeft(tx, ty);
  }

  _convertEventInfoToTokenData(xPosition, yPosition, isHidden) {
    return {
      x: xPosition,
      y: yPosition,
      hidden: isHidden
    }
  }

  // TODO dropping in different ways
  // https://github.com/League-of-Foundry-Developers/fvtt-module-furnace/blob/07bddbb1324a92f7d48513128daef62af57c25cb/QoL/Tokens.js#L85
  async _dropActor(actor, tokenData) {
    // Merge Token data with the default for the Actor
    tokenData = mergeObject(actor.data.token, tokenData, { inplace: false });
    // Get the Token image
    if (tokenData.randomImg) {
      let images = await actor.getTokenImages();
      images = images.filter(
        (i) => images.length === 1 || !(i === canvas.tokens._lastWildcard)
      );
      const image = images[Math.floor(Math.random() * images.length)];
      tokenData.img = canvas.tokens._lastWildcard = image;
    }

    // Submit the Token creation request and activate the Tokens layer (if not already active)
    return Token.create(tokenData);
  }
}
