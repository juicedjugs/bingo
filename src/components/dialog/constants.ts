import { LetterStyle } from "./types";

export const LETTER_STYLES: LetterStyle[] = [
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "medieval", label: "Medieval" },
  { value: "pixel", label: "Pixel" },
];

export const DEFAULT_SETTINGS = {
  backgroundColor: "#181818",
  tileColor: "#ffffff",
  textStrokeColor: "#000000",
  backgroundImageFile: null,
  letterStyle: "classic",
  showLabels: true,
  exportScale: 200,
  glassBlur: 0,
  borderThickness: 2,
  borderColor: "#000000",
} as const;
