export const wrapText = (
  text: string,
  maxWidth: number,
  fontSize: number,
  ctx: CanvasRenderingContext2D,
): string[] => {
  if (!text) return [];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  // Calculate approximate character width
  const avgCharWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    // Quick check: if line would be too long, wrap
    if (testLine.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long, force it anyway
        lines.push(word);
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

export const getFontConfig = (letterStyle: string, fontSize: number) => {
  let fontFamily = "Arial, sans-serif";
  let adjustedFontSize = fontSize;

  switch (letterStyle) {
    case "classic":
      fontFamily = "Arial Black, Arial, sans-serif";
      break;
    case "modern":
      fontFamily = "Helvetica, Arial, sans-serif";
      break;
    case "medieval":
      fontFamily = "serif";
      break;
    case "pixel":
      fontFamily = "monospace";
      adjustedFontSize = fontSize * 0.9;
      break;
  }

  return { fontFamily, fontSize: adjustedFontSize };
};

export const loadImageAsBackground = async (
  file: File,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fallbackColor: string,
): Promise<void> => {
  return new Promise<void>((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // Calculate dimensions for cover behavior
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.naturalWidth / img.naturalHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > canvasAspect) {
          // Image is wider than canvas - fit to height and crop sides
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          // Image is taller than canvas - fit to width and crop top/bottom
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        resolve();
      };

      img.onerror = () => {
        // Fallback to solid color if image fails to load
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        resolve();
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      // Fallback to solid color if file reading fails
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      resolve();
    };

    reader.readAsDataURL(file);
  });
};

export const drawTextWithStroke = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  strokeColor: string,
  fontSize: number,
  strokeWidth?: number,
) => {
  const strokeSize = strokeWidth ?? Math.max(1, fontSize * 0.08);

  // Draw text stroke first
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeSize;
  ctx.strokeText(text, x, y);

  // Draw text fill on top
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
};
