function translateToTopLeftGrid(event: DragEvent): PointArray {
    // @ts-expect-error World transfer isn't defined on token layer for some reason
    const transform = canvas.tokens.worldTransform;
    const tx = (event.clientX - transform.tx) / canvas.stage.scale.x;
    const ty = (event.clientY - transform.ty) / canvas.stage.scale.y;

    return canvas.grid.getTopLeft(tx, ty);
}

export { translateToTopLeftGrid };
