import { FileInfo } from "./process.js";
import { Root } from "remark-parse/lib/index.js";

export interface CustomConfig {
  computedFields?: ((fileInfo: FileInfo, ast: Root) => any)[];
}
