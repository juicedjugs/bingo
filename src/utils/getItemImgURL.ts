export const getItemImgURL = (item: string) => {
  // the second word in item must be converted to lowercase
  const itemName = item
    .split(" ")
    .map((word, index) => {
      if (index === 0) {
        return word[0].toUpperCase() + word.slice(1);
      }
      if (index >= 1) {
        return word.toLowerCase();
      }
      return word;
    })
    .join("_");
  const a = `https://oldschool.runescape.wiki/images/thumb/`;
  const b = `_detail.png/1280px-${itemName}_detail.png`;
  return a + itemName + b;
};
