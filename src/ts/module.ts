// Keep or else Foundry globals like game and Hooks will not resolve
/// <reference types="@dfreds/foundry-types" />

import { HooksDroppables } from "./hooks/index.ts";

HooksDroppables.listen();
