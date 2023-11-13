import crypto from "crypto";


export function generateFileIdFromPath(filePath: string) {
  const encodedPath = Buffer.from(filePath, "utf-8").toString();
  const id = crypto.createHash("sha1").update(encodedPath).digest("hex");
  return id;
}
