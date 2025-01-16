import { MODULE_ID } from "./constants.ts";

/**
 * Simple logger that prepends the package name if the data is a string
 *
 * @param data - The data to log
 */
function log(data: string | any): void {
    if (typeof data === "string") {
        console.log(`${MODULE_ID} | ${data}`);
    } else {
        console.log(data);
    }
}

export { log };
