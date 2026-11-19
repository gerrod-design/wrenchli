// The door routing table lives in the root middleware.ts, which must
// stay self-contained (it imports nothing; see the header note there).
// This module re-exports it so app-side code and the unit tests have a
// normal src/ import path to the exact code the middleware ships.
export { doorAction } from "../../middleware";
export type { DoorAction } from "../../middleware";
