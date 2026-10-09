import { Point } from "@common/_types.mjs";

interface FilesDropData {
    files: File[];
    url?: string;
}

function translateToTopLeftGrid(event: DragEvent): Point {
    const transform = canvas.tokens.worldTransform;
    const tx = (event.clientX - transform.tx) / canvas.stage.scale.x;
    const ty = (event.clientY - transform.ty) / canvas.stage.scale.y;

    return canvas.grid.getTopLeftPoint({ x: tx, y: ty });
}

/**
 * The floor elevation of the level currently being viewed. Foundry uses this as the default
 * elevation for anything created on that level. A scene with no levels configured reports 0.
 */
function getActiveLevelElevation(): number {
    return canvas.level?.elevation.base ?? 0;
}

/**
 * The id of the level currently being viewed, for a Token's `level` field. Undefined leaves the
 * field at its default.
 */
function getActiveLevelId(): string | undefined {
    return canvas.level?.id ?? undefined;
}

/**
 * The `levels` set for a placeable other than a Token, restricting it to the level currently being
 * viewed. An empty array means the placeable appears on every level.
 */
function getActiveLevels(): string[] {
    const levelId = canvas.level?.id;
    return levelId ? [levelId] : [];
}

export { translateToTopLeftGrid, getActiveLevelElevation, getActiveLevelId, getActiveLevels };
export type { FilesDropData };
