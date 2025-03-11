import { Settings } from "../settings.ts";
import { Listener } from "./index.ts";

const Init: Listener = {
    listen(): void {
        Hooks.once("init", async () => {
            const settings = new Settings();
            settings.register();
        });
    },
};

export { Init };
