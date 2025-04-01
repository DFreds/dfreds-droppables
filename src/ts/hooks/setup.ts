import { Listener } from "./index.ts";

const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", async () => {
            if (BUILD_MODE === "development") {
                CONFIG.debug.hooks = true;
            }
        });
    },
};

export { Setup };
