import { Listener } from "./index.ts";

const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", async () => {
            CONFIG.debug.hooks = BUILD_MODE === "development";
        });
    },
};

export { Setup };
