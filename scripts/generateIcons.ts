import { addIcon } from "@iconify/react";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Scans all of src and finds icon components and
 * returns the name of the icon used.
 *
 * <Icon name="mdi:light" /> -> "mdi:light"
 * @param dir
 */
export const scanIcons = async (dir: string) => {
  const icons: string[] = [];

  const scanDirectory = async (currentDir: string) => {
    const files = await fs.readdir(currentDir, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(currentDir, file.name);

      if (file.isDirectory()) {
        // Recursively scan subdirectories
        await scanDirectory(filePath);
      } else if (file.isFile() && /\.(tsx?|jsx?)$/.test(file.name)) {
        // Only process TypeScript/JavaScript files
        try {
          const fileContent = await fs.readFile(filePath, "utf8");
          // find all icon components and extract the icon names
          const iconMatches = fileContent.match(
            /<Icon(?:\s+ssr)?\s+icon="([^"]+)"[^>]*>/g,
          );
          if (iconMatches) {
            // Extract just the icon names from the matches
            const iconNames = iconMatches
              .map((match) => {
                const nameMatch = match.match(/icon="([^"]+)"/);
                return nameMatch ? nameMatch[1] : null;
              })
              .filter(Boolean) as string[];
            icons.push(...iconNames);
          }
        } catch (error) {
          console.warn(`Failed to read file ${filePath}:`, error);
        }
      }
    }
  };

  await scanDirectory(dir);
  return icons;
};

export const getIconSetData = async (icons: string[]) => {
  const iconSet: {
    setName: string;
    iconName: string;
    height: number;
    width: number;
    iconData: any;
  }[] = [];
  for (let icon of icons) {
    // Split icon into setName and iconName.
    const [setName, iconName] = icon.split(":");
    // Read the json file for the set.
    const fp = `node_modules/@iconify/json/json/${setName}.json`;
    const fileContent = await fs.readFile(fp, "utf8");
    const setJSON = JSON.parse(fileContent);
    // Add the icon to the set.
    iconSet.push({
      setName,
      iconName,
      height: setJSON.height,
      width: setJSON.width,
      iconData: setJSON.icons[iconName],
    });
  }
  return iconSet;
};

// Generate the set to be in icon.json
const iconSet = await getIconSetData(await scanIcons("./src"));
await fs.writeFile(
  path.join("./src/utils", "icons.json"),
  JSON.stringify(iconSet, null, 2),
);
console.log("Generated Icons:");
for (const icon of iconSet) {
  console.log(`- ${icon.setName}:${icon.iconName}`);
}
