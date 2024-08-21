function translateToTopLeftGrid(event: DragEvent): Point {
    const transform = canvas.tokens.worldTransform;
    const tx = (event.clientX - transform.tx) / canvas.stage.scale.x;
    const ty = (event.clientY - transform.ty) / canvas.stage.scale.y;

    return canvas.grid.getTopLeftPoint({ x: tx, y: ty });
}

export { translateToTopLeftGrid };
