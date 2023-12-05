import { FileInfo } from "./process.js";
import { Root } from "remark-parse/lib/index.js";

export interface CustomConfig {
  customFields?: ((fileInfo: FileInfo, ast: Root) => any)[];
  include?: string[];
  exclude?: string[];
}
