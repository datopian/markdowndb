import { WikiLink } from "../../utils";
import { File, Tag } from "./schemaTypes";

export interface FileObject {
  file: File;
  tags: Tag[];
  links: WikiLink[];
}
