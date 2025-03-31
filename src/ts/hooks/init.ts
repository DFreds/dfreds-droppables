import { Settings } from "../settings.ts";
import { Listener } from "./index.ts";

const Init: Listener = {
    listen(): void {
        Hooks.once("init", async () => {
            new Settings().register();
        });
    },
};

export { Init };
