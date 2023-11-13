export interface File {
  _id: string;
  file_path: string;
  extension: string;
  url_path: string | null;
  filetype: string | null;
  metadata: MetaData | null;
}

export type MetaData = {
  [key: string]: any;
};

export interface Link {
  link_type: "normal" | "embed";
  from: string;
  to: string;
}

export interface Tag {
  name: string;
}

export interface FileTag {
  tag: string;
  file: string;
}

export enum Table {
  Files = "files",
  Tags = "tags",
  FileTags = "file_tags",
  Links = "links",
}