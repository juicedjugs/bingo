import { addIcon } from "@iconify/react";
import iconSetData from "./icons.json";

const iconSet: any[] = iconSetData ?? [];
for (let icon of iconSet) {
  addIcon(icon.setName + ":" + icon.iconName, {
    ...icon.iconData,
    height: icon.height,
    width: icon.width,
  });
}
