# DFreds Droppables

[![alt-text](https://img.shields.io/badge/-Patreon-%23f96854?style=for-the-badge)](https://www.patreon.com/dfreds)
[![alt-text](https://img.shields.io/badge/-Buy%20Me%20A%20Coffee-%23ff813f?style=for-the-badge)](https://www.buymeacoffee.com/dfreds)
[![alt-text](https://img.shields.io/badge/-Discord-%235662f6?style=for-the-badge)](https://discord.gg/Wq8AEV9bWb)

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/DFreds/dfreds-droppables/main/static/module.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=ff6400&style=for-the-badge)

[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https://forge-vtt.com/api/bazaar/package/dfreds-droppables&colorB=68a74f&style=for-the-badge)](https://forge-vtt.com/bazaar#package=dfreds-droppables)
![Latest Release Download Count](https://img.shields.io/github/downloads/DFreds/dfreds-droppables/latest/dfreds-droppables.zip?color=2b82fc&label=LATEST%20DOWNLOADS&style=for-the-badge)
![Total Download Count](https://img.shields.io/github/downloads/DFreds/dfreds-droppables/total?color=2b82fc&label=TOTAL%20DOWNLOADS&style=for-the-badge)

__DFreds Droppables__ is a FoundryVTT module which allows you to drag and drop an entire folder of tokens or journal entries onto the canvas as well as uploading files for tokens, tiles, sounds, or notes.

## Let Me Sell You This

Have you ever needed to drop all of your pesky players onto a scene at once? What about needing to upload a bunch of cool images for all sorts of awesome characters? Have you ever _dreaded_ the thought of dragging them all out onto the map one by one like some kind of peasant? Well, now you don't have to. Yay mild conveniences.

## What This Module Does

### Droppable Actor and Journal Folders on the Canvas

On the drag and drop of an actor folder or journal entries folder onto the canvas, Droppables creates tokens (for actors) or notes (for journal entries) for each item in that folder. Note that it will not do anything for any subfolders, as that could get sort of insane.

![Dropping Actors](docs/droppables.gif)
![Dropping Journals](docs/droppables2.gif)

### Droppable Files on the Canvas

On the drag and drop of one or many files onto the canvas, Droppables creates either a token, tile, ambient audio, or journal entry depending on the currently selected layer for each file.

Here's how it works:

#### Token Layer

A new actor is created of a chosen type with the actor image and token image set to the dropped image.

Supported Files: Images

![Dropping Tokens](docs/droppable-tokens.mp4)

#### Tiles Layer

A new tile is created using the dropped image or video.

Supported Files: Images and videos

![Dropping Tiles](docs/droppable-tiles.mp4)

#### Sounds Layer

A new ambient audio is created using the dropped audio.

Supported Files: Audio (duh)

![Dropping Sounds](docs/droppable-sounds.mp4)

#### Notes Layer

A single journal is created with journal entries corresponding to each of the files dropped. In the case of a text file, it will copy all the text to the new journal entry.

Supported Files: Images, videos, PDFs, and text files

![Dropping Notes](docs/droppable-notes.mp4)

### libWrapper

This module uses the [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping core methods. While this is not a hard dependency, it is recommended to install it for the best experience and compatibility with other modules.
