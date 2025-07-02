import { PngExportSettings, BingoTile, RenderConfig } from "./types";
import {
  wrapText,
  getFontConfig,
  loadImageAsBackground,
  drawTextWithStroke,
} from "./utils";
import { getItemImgURL } from "../../utils/getItemImgURL";

export const calculateRenderConfig = (
  dimension: number,
  settings: PngExportSettings,
  isExport: boolean = false,
): RenderConfig => {
  const baseTileSize = 150 * (settings.exportScale / 100);
  const multiplier = isExport ? 2 : 1; // 2x for high quality export
  const tileSize = baseTileSize * multiplier;
  const spacing = 2 * multiplier;
  const boardSize = dimension * tileSize + (dimension + 1) * spacing;

  const marginAreaSize = Math.max(160, tileSize * 0.6);
  const letterAreaHeight = settings.showLabels ? marginAreaSize : 0;
  const rowNumberAreaWidth = settings.showLabels ? marginAreaSize : 0;

  // Add extra padding to bottom and right to match top and left
  const extraPaddingHeight = settings.showLabels ? marginAreaSize : 0;
  const extraPaddingWidth = settings.showLabels ? marginAreaSize : 0;

  const xOffset = rowNumberAreaWidth;
  const yOffset = letterAreaHeight;

  return {
    dimension,
    tileSize,
    spacing,
    boardSize,
    marginAreaSize,
    letterAreaHeight,
    rowNumberAreaWidth,
    xOffset,
    yOffset,
    extraPaddingHeight,
    extraPaddingWidth,
  };
};

export const renderBackground = async (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  settings: PngExportSettings,
): Promise<void> => {
  if (settings.backgroundImageFile) {
    await loadImageAsBackground(
      settings.backgroundImageFile,
      canvas,
      ctx,
      settings.backgroundColor,
    );
  } else {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};

export const renderLabels = (
  ctx: CanvasRenderingContext2D,
  config: RenderConfig,
  settings: PngExportSettings,
  isExport: boolean = false,
): void => {
  if (!settings.showLabels) return;

  // Prepare letters
  let letters = settings.customLetters;
  while (letters.length < config.dimension) {
    letters += "-";
  }

  const letterWidth = config.boardSize / config.dimension;
  const { fontFamily, fontSize: adjustedFontSize } = getFontConfig(
    settings.letterStyle,
    Math.min(config.letterAreaHeight * 0.6, letterWidth * 0.4),
  );

  ctx.font = `${adjustedFontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const letterY = config.letterAreaHeight / 2;
  const strokeWidth = isExport
    ? Math.max(2, adjustedFontSize * 0.08)
    : Math.max(1, adjustedFontSize * 0.08);

  // Draw letters
  for (let i = 0; i < letters.length; i++) {
    const x = config.rowNumberAreaWidth + letterWidth * i + letterWidth / 2;
    drawTextWithStroke(
      ctx,
      letters[i],
      x,
      letterY,
      settings.tileColor,
      settings.textStrokeColor,
      adjustedFontSize,
      strokeWidth,
    );
  }

  // Draw row numbers
  const rowNumberX = config.rowNumberAreaWidth / 2;
  const rowHeight = config.boardSize / config.dimension;

  for (let i = 0; i < config.dimension; i++) {
    const y = config.yOffset + rowHeight * i + rowHeight / 2;
    drawTextWithStroke(
      ctx,
      (i + 1).toString(),
      rowNumberX,
      y,
      settings.tileColor,
      settings.textStrokeColor,
      adjustedFontSize,
      strokeWidth,
    );
  }
};

export const renderGlassBlur = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  tileSize: number,
  blurAmount: number,
): void => {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;

  const blurPadding = blurAmount * 3;
  const tempWidth = tileSize + blurPadding * 2;
  const tempHeight = tileSize + blurPadding * 2;
  tempCanvas.width = tempWidth;
  tempCanvas.height = tempHeight;

  // Copy a larger background area to account for blur bleeding
  const sourceX = Math.max(0, x - blurPadding);
  const sourceY = Math.max(0, y - blurPadding);
  const sourceWidth = Math.min(tempWidth, canvas.width - sourceX);
  const sourceHeight = Math.min(tempHeight, canvas.height - sourceY);

  tempCtx.drawImage(
    canvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    sourceX - (x - blurPadding),
    sourceY - (y - blurPadding),
    sourceWidth,
    sourceHeight,
  );

  // Apply blur filter
  tempCtx.filter = `blur(${blurAmount}px)`;
  tempCtx.drawImage(tempCanvas, 0, 0);
  tempCtx.filter = "none";

  // Draw only the tile area from the blurred canvas back to main canvas
  ctx.drawImage(
    tempCanvas,
    blurPadding,
    blurPadding,
    tileSize,
    tileSize,
    x,
    y,
    tileSize,
    tileSize,
  );

  // Add semi-transparent overlay for glass effect
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(x, y, tileSize, tileSize);

  // Add subtle inner highlight border for glass effect
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
};

export const renderTile = async (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tile: BingoTile,
  x: number,
  y: number,
  config: RenderConfig,
  settings: PngExportSettings,
  imageMap: Map<string, HTMLImageElement>,
  isExport: boolean = false,
): Promise<void> => {
  // Draw backdrop-filter blur effect FIRST (before borders)
  if (settings.glassBlur > 0) {
    const blurAmount = settings.glassBlur * (isExport ? 2 : 1);
    renderGlassBlur(ctx, canvas, x, y, config.tileSize, blurAmount);
  }

  if (tile.description || tile.items.length > 0) {
    // Layout calculations
    const imageSize = config.tileSize * 0.28;
    const imageSpacing =
      tile.items.length === 3
        ? config.tileSize * 0.015
        : config.tileSize * 0.04;
    const numImages = Math.min(tile.items.length, 3);
    const totalImagesWidth =
      numImages * imageSize + (numImages - 1) * imageSpacing;
    const imagesStartX = x + (config.tileSize - totalImagesWidth) / 2;

    // Text sizing
    let descFontSize = config.tileSize * 0.13;
    ctx.font = `${descFontSize}px Arial`;
    let lines = wrapText(
      tile.description,
      config.tileSize * 0.85,
      descFontSize,
      ctx,
    );

    while (
      lines.length * descFontSize > config.tileSize * 0.35 &&
      descFontSize > config.tileSize * 0.07
    ) {
      descFontSize *= 0.92;
      ctx.font = `${descFontSize}px Arial`;
      lines = wrapText(
        tile.description,
        config.tileSize * 0.85,
        descFontSize,
        ctx,
      );
    }

    // Vertical centering
    const textBlockHeight = lines.length * descFontSize;
    const imagesBlockHeight = tile.items.length === 0 ? 0 : imageSize;
    const spacingBetweenImagesAndText =
      tile.items.length === 0 ? 0 : config.tileSize * 0.08;
    const totalContentHeight =
      imagesBlockHeight + spacingBetweenImagesAndText + textBlockHeight;
    const contentStartY = y + (config.tileSize - totalContentHeight) / 2;
    const imageY = contentStartY;
    const textYStart =
      contentStartY +
      imagesBlockHeight +
      spacingBetweenImagesAndText +
      descFontSize;

    // Draw images
    for (let idx = 0; idx < Math.min(tile.items.length, 3); idx++) {
      const item = tile.items[idx];
      const img = imageMap.get(item);
      if (img && img.complete && img.naturalWidth > 0) {
        const imgX = imagesStartX + idx * (imageSize + imageSpacing);

        // Calculate aspect ratio and center the image
        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawWidth = imageSize;
        let drawHeight = imageSize;
        let drawX = imgX;
        let drawY = imageY;

        if (imgAspect > 1) {
          drawHeight = imageSize / imgAspect;
          drawY = imageY + (imageSize - drawHeight) / 2;
        } else {
          drawWidth = imageSize * imgAspect;
          drawX = imgX + (imageSize - drawWidth) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      }
    }

    // Draw text
    if (tile.description && lines.length > 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `${descFontSize}px Arial`;

      const strokeWidth = isExport
        ? Math.max(2, descFontSize * 0.08)
        : Math.max(1, descFontSize * 0.08);

      for (let i = 0; i < lines.length; i++) {
        const lineY = textYStart + i * (descFontSize * 1.1);
        drawTextWithStroke(
          ctx,
          lines[i],
          x + config.tileSize / 2,
          lineY,
          settings.tileColor,
          settings.textStrokeColor,
          descFontSize,
          strokeWidth,
        );
      }
    }
  }

  // Note: Borders are now drawn separately to avoid double-thickness on inner borders
};

export const loadTileImages = async (
  board: BingoTile[],
): Promise<Map<string, HTMLImageElement>> => {
  const imageMap = new Map<string, HTMLImageElement>();

  for (const tile of board) {
    for (const item of tile.items.slice(0, 3)) {
      if (!imageMap.has(item)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = getItemImgURL(item);
        imageMap.set(item, img);
      }
    }
  }

  // Wait for images to load
  await new Promise((resolve) => setTimeout(resolve, 200));

  return imageMap;
};

export const renderGridBorders = (
  ctx: CanvasRenderingContext2D,
  config: RenderConfig,
  settings: PngExportSettings,
  isExport: boolean = false,
): void => {
  if (settings.borderThickness <= 0) return;

  ctx.strokeStyle = settings.borderColor;
  ctx.lineWidth = settings.borderThickness * (isExport ? 2 : 1);
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";
  ctx.miterLimit = 10;
  ctx.beginPath();

  // Calculate grid boundaries
  const startX = config.xOffset + config.spacing;
  const startY = config.yOffset + config.spacing;
  const endX =
    startX +
    config.dimension * config.tileSize +
    (config.dimension - 1) * config.spacing;
  const endY =
    startY +
    config.dimension * config.tileSize +
    (config.dimension - 1) * config.spacing;

  // Draw vertical lines (columns)
  for (let col = 0; col <= config.dimension; col++) {
    const x = startX + col * (config.tileSize + config.spacing);
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }

  // Draw horizontal lines (rows)
  for (let row = 0; row <= config.dimension; row++) {
    const y = startY + row * (config.tileSize + config.spacing);
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }

  ctx.stroke();
};

export const renderBoard = async (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  board: BingoTile[],
  config: RenderConfig,
  settings: PngExportSettings,
  isExport: boolean = false,
): Promise<void> => {
  // Set canvas dimensions
  canvas.width =
    config.boardSize + config.rowNumberAreaWidth + config.extraPaddingWidth;
  canvas.height =
    config.boardSize + config.letterAreaHeight + config.extraPaddingHeight;

  // Render background
  await renderBackground(canvas, ctx, settings);

  // Render labels
  renderLabels(ctx, config, settings, isExport);

  // Load images
  const imageMap = await loadTileImages(board);

  // Render tiles
  for (let row = 0; row < config.dimension; row++) {
    for (let col = 0; col < config.dimension; col++) {
      const index = row * config.dimension + col;
      const tile = board[index];

      const x =
        config.xOffset +
        config.spacing +
        col * (config.tileSize + config.spacing);
      const y =
        config.yOffset +
        config.spacing +
        row * (config.tileSize + config.spacing);

      await renderTile(
        ctx,
        canvas,
        tile,
        x,
        y,
        config,
        settings,
        imageMap,
        isExport,
      );
    }
  }

  // Render grid borders last to ensure uniform thickness
  renderGridBorders(ctx, config, settings, isExport);
};
