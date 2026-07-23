import { CorePageType } from "@common/documents/journal-entry-page.mjs";
import { MODULE_ID } from "../constants.ts";

const { FilePicker } = foundry.applications.apps;

const IMAGE_EXTENSIONS = /\.(apng|avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/;
const VIDEO_EXTENSIONS = /\.(m4v|mp4|ogv|webm)$/;

/**
 * Data describing a single uploaded file that is ready to be turned into a document.
 */
interface UploadedFile {
    fileName: string;
    filePath: string;
}

/* -------------------------------------------- */
/*  File-type predicates                        */
/* -------------------------------------------- */

/**
 * Determines whether a file is an image file based on its MIME type.
 *
 * @param file - The file to check
 * @returns True if the file is an image file, false otherwise
 */
function isImageFile(file: File): boolean {
    return file.type.includes("image");
}

/**
 * Determines whether a file is an image or video file based on its MIME type.
 *
 * @param file - The file to check
 * @returns True if the file is an image or video file, false otherwise
 */
function isImageOrVideoFile(file: File): boolean {
    return file.type.includes("image") || file.type.includes("video");
}

/**
 * Determines whether a file is an audio file based on its MIME type.
 *
 * @param file - The file to check
 * @returns True if the file is an audio file, false otherwise
 */
function isAudioFile(file: File): boolean {
    return file.type.includes("audio");
}

/**
 * Determines whether a file is a journal file based on its MIME type.
 *
 * @param file - The file to check
 * @returns True if the file is a journal file, false otherwise
 */
function isJournalFile(file: File): boolean {
    return (
        file.type.includes("image") ||
        file.type.includes("pdf") ||
        file.type.includes("video") ||
        file.type.includes("text")
    );
}

/**
 * Determines whether a file is a JSON file based on its MIME type or file extension.
 *
 * @param file - The file to check
 * @returns True if the file is a JSON file, false otherwise
 */
function isJsonFile(file: File): boolean {
    return file.type.includes("json") || file.name.toLowerCase().endsWith(".json");
}

/* -------------------------------------------- */
/*  File / URL helpers                          */
/* -------------------------------------------- */

/**
 * Extracts files from a drag event and filters them using a predicate function.
 *
 * @param event - The drag event containing the files
 * @param predicate - The predicate function to filter files
 * @returns An array of files that match the predicate
 */
function getFilesFromEvent(event: DragEvent, predicate: (file: File) => boolean): File[] {
    const files = event.dataTransfer?.files ?? new FileList();
    return Array.from(files).filter(predicate);
}

/**
 * Determines the type of a URL based on its file extension.
 *
 * @param url - The URL to check
 * @returns The type of the URL ("image", "video", or undefined) based on its file extension
 */
function determineUrlType(url: string): "image" | "video" | undefined {
    const lower = url.toLowerCase();

    if (IMAGE_EXTENSIONS.test(lower)) {
        return "image";
    }

    if (VIDEO_EXTENSIONS.test(lower)) {
        return "video";
    }

    return undefined;
}

/**
 * Determines the type of a file based on its MIME type.
 *
 * @param file - The file to check
 * @returns The type of the file ("pdf", "video", "text", or "image") based on its MIME type
 */
function determineFileType(file: File): CorePageType {
    if (file.type.includes("pdf")) {
        return "pdf";
    }
    if (file.type.includes("video")) {
        return "video";
    }
    if (file.type.includes("text")) {
        return "text";
    }

    return "image";
}

/**
 * Extracts the file name from a URL, falling back to a default name if the URL does not contain a valid file name.
 *
 * @param url - The URL to extract the file name from
 * @param fallback - The fallback name to use if the URL does not contain a valid file name
 */
function getFileNameFromUrl(url: string, fallback = "Dropped File"): string {
    try {
        const parsed = new URL(url);
        const pathName = parsed.pathname ?? "";
        const last = pathName.split("/").filter(Boolean).at(-1);
        return last ? decodeURIComponent(last) : fallback;
    } catch {
        // Not a valid absolute URL; fall back to a simple best-effort name.
        const last = url.split(/[\\/]/).filter(Boolean).at(-1);
        return last ? last : fallback;
    }
}

/**
 * Converts a file name to a document name by removing its extension.
 *
 * @param fileName - The file name to convert to a document name
 * @returns The file name without its extension, or the original file name if it has no extension
 */
function fileNameToDocumentName(fileName: string): string {
    const withoutExtension = fileName.split(".").slice(0, -1).join(".");
    return withoutExtension || fileName;
}

/**
 * Uploads a file to persistent storage using the FilePicker API.
 *
 * @param subdir - The subdirectory to upload the file to within the persistent storage
 * @param file - The file to upload to persistent storage
 * @returns A promise that resolves to the path of the uploaded file in persistent storage, or undefined if the upload failed
 */
async function uploadToPersistent(subdir: string, file: File): Promise<string | undefined> {
    const response = await FilePicker.uploadPersistent(MODULE_ID, subdir, file);
    return typeof response === "object" && response ? response.path : undefined;
}

export type { UploadedFile };
export {
    isImageFile,
    isImageOrVideoFile,
    isAudioFile,
    isJournalFile,
    isJsonFile,
    getFilesFromEvent,
    determineUrlType,
    determineFileType,
    getFileNameFromUrl,
    fileNameToDocumentName,
    uploadToPersistent,
};
