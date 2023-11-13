export function getFileExtensionFromPath(filePath: string) {
  const [, extension] = filePath.match(/.(\w+)$/) || [];
  return extension;
}
