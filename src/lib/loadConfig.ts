import * as path from "path";

export async function loadConfig(configFilePath: string) {
  const normalizedPath = path.resolve(configFilePath || "markdowndb.config.js");
  const fileUrl = new URL(`file://${normalizedPath}`);

  try {
    // Import the module using the file URL
    const configModule = await import(fileUrl.href);
    return configModule.default;
  } catch (error) {
    if (configFilePath) {
      throw new Error(
        `Error loading configuration file from ${normalizedPath}`
      );
    }
  }
}
