import { WikiLink } from "../../utils";
import { File } from "./schemaTypes";

export interface FileObject extends File {
  tags: string[];
  links: WikiLink[];
}
