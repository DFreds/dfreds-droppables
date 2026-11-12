import DocumentDirectory from "@client/applications/sidebar/document-directory.mjs";

/**
 * Finds the ID of the directory folder that a drop landed on or within, if any, so that newly
 *
 * @param event - The drag event to check for a target folder.
 * @returns The ID of the directory folder that a drop landed on or within, if any.
 */
function getTargetFolderId(event: DragEvent): string | undefined {
    const target = event.target as HTMLElement | null;
    const folder = target?.closest<HTMLElement>("[data-folder-id]");
    return folder?.dataset.folderId || undefined;
}

function getPackId(directory: DocumentDirectory<any>): string | undefined {
    const collection = directory.collection;
    return collection instanceof foundry.documents.collections.CompendiumCollection ? collection.collection : undefined;
}

export { getPackId, getTargetFolderId };
