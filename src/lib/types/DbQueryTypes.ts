export type FilesQuery = {
  folder?: string;
  filetypes?: string[];
  tags?: string[];
  extensions?: string[];
  frontmatter?: Record<string, string | number | boolean>;
};

export type LinkQuery = {
  fileId: string;
  linkType?: "normal" | "embed";
  direction?: "forward" | "backward";
};
