export interface PngExportSettings {
  backgroundColor: string;
  tileColor: string;
  textStrokeColor: string;
  backgroundImageFile: File | null;
  letterStyle: string;
  showLabels: boolean;
  customLetters: string;
  exportScale: number; // Still needed for internal calculations
  glassBlur: number;
  borderThickness: number;
  borderColor: string;
}

export interface LetterStyle {
  value: string;
  label: string;
}

export interface BingoTile {
  id: string;
  description: string;
  items: string[];
  completed?: boolean;
}

export interface RenderConfig {
  dimension: number;
  tileSize: number;
  spacing: number;
  boardSize: number;
  marginAreaSize: number;
  letterAreaHeight: number;
  rowNumberAreaWidth: number;
  xOffset: number;
  yOffset: number;
  extraPaddingHeight: number;
  extraPaddingWidth: number;
}
