import path from "node:path";
import { fileURLToPath } from "node:url";
const configDir = path.dirname(fileURLToPath(import.meta.url));
const bodyLimit = 4 * 1024 * 1024;
const dir = path.resolve(configDir, "../../../frontend");
const host = "0.0.0.0";
export { bodyLimit, dir, host };
