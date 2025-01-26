import type React from "react";
import { useRef, useEffect, useState } from "react";

interface StretchCanvasProps {
  image: HTMLImageElement;
  brushSize: number;
  stretchLevel: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onBrushSizeChange: (newSize: number) => void;
}

const StretchCanvas: React.FC<StretchCanvasProps> = ({
  image,
  brushSize,
  stretchLevel,
  canvasRef,
  onBrushSizeChange,
}) => {
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isStretching, setIsStretching] = useState(false);
  const [startPosition, setStartPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [stretchBuffer, setStretchBuffer] = useState<ImageData | null>(null);
  const [originalCanvas, setOriginalCanvas] =
    useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const origCanvas = document.createElement("canvas");
    origCanvas.width = image.width;
    origCanvas.height = image.height;
    const origCtx = origCanvas.getContext("2d");
    if (origCtx) {
      origCtx.drawImage(image, 0, 0);
    }
    setOriginalCanvas(origCanvas);
  }, [image, canvasRef]);

  useEffect(() => {
    const cursorCanvas = cursorCanvasRef.current;
    if (!cursorCanvas) return;

    cursorCanvas.width = image.width;
    cursorCanvas.height = image.height;

    const ctx = cursorCanvas.getContext("2d");
    if (!ctx) return;

    const drawCursor = () => {
      if (!cursorPosition) return;
      ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      ctx.beginPath();
      ctx.rect(
        cursorPosition.x - brushSize / 2,
        cursorPosition.y - brushSize / 2,
        brushSize,
        brushSize
      );
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    drawCursor();
  }, [image, brushSize, cursorPosition]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setCursorPosition({ x, y });

    if (isStretching && startPosition && stretchBuffer && originalCanvas) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dx = x - startPosition.x;
      const dy = y - startPosition.y;

      stretchPixels(
        ctx,
        startPosition.x,
        startPosition.y,
        dx,
        dy,
        brushSize,
        stretchBuffer,
        originalCanvas
      );
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -1 : 1;
      const newBrushSize = Math.max(1, Math.min(250, brushSize + delta));
      onBrushSizeChange(newBrushSize);
    }
  };

  const startStretching = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { offsetX, offsetY } = event.nativeEvent;
    setIsStretching(true);
    setStartPosition({ x: offsetX, y: offsetY });

    const halfBrush = Math.floor(brushSize / 2);
    const left = Math.max(0, offsetX - halfBrush);
    const top = Math.max(0, offsetY - halfBrush);
    const width = Math.min(brushSize, canvas.width - left);
    const height = Math.min(brushSize, canvas.height - top);

    const buffer = ctx.getImageData(left, top, width, height);
    setStretchBuffer(buffer);
  };

  const stopStretching = () => {
    setIsStretching(false);
    setStartPosition(null);
    setStretchBuffer(null);
  };

  const stretchPixels = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    dx: number,
    dy: number,
    brushSize: number,
    buffer: ImageData,
    originalCanvas: HTMLCanvasElement
  ) => {
    const halfBrush = Math.floor(brushSize / 2);
    const sourceLeft = Math.max(0, startX - halfBrush);
    const sourceTop = Math.max(0, startY - halfBrush);
    const sourceWidth = Math.min(brushSize, ctx.canvas.width - sourceLeft);
    const sourceHeight = Math.min(brushSize, ctx.canvas.height - sourceTop);

    const targetLeft = sourceLeft + dx;
    const targetTop = sourceTop + dy;

    // Get the current state of the target area
    const imageData = ctx.getImageData(
      targetLeft,
      targetTop,
      sourceWidth,
      sourceHeight
    );
    const { data } = imageData;
    const { data: bufferData } = buffer;

    switch (stretchLevel) {
      case 1: // Regular pixel stretch
        for (let y = 0; y < sourceHeight; y++) {
          for (let x = 0; x < sourceWidth; x++) {
            const i = (y * sourceWidth + x) * 4;
            const sourceX = Math.max(0, Math.min(sourceWidth - 1, x));
            const sourceY = Math.max(0, Math.min(sourceHeight - 1, y));
            const sourceIndex = (sourceY * sourceWidth + sourceX) * 4;

            data[i] = bufferData[sourceIndex];
            data[i + 1] = bufferData[sourceIndex + 1];
            data[i + 2] = bufferData[sourceIndex + 2];
            data[i + 3] = bufferData[sourceIndex + 3];
          }
        }
        break;

      case 2: // Pixelate effect (more blocky - 8x8)
        const pixelSize = 8; // Increased from 4 to 8 for blockier effect
        for (let y = 0; y < sourceHeight; y += pixelSize) {
          for (let x = 0; x < sourceWidth; x += pixelSize) {
            // Calculate average color for this block
            let r = 0,
              g = 0,
              b = 0,
              a = 0,
              count = 0;

            for (let py = 0; py < pixelSize && y + py < sourceHeight; py++) {
              for (let px = 0; px < pixelSize && x + px < sourceWidth; px++) {
                const idx = ((y + py) * sourceWidth + (x + px)) * 4;
                r += bufferData[idx];
                g += bufferData[idx + 1];
                b += bufferData[idx + 2];
                a += bufferData[idx + 3];
                count++;
              }
            }

            // Apply averaged color to all pixels in this block
            const avgR = Math.round(r / count);
            const avgG = Math.round(g / count);
            const avgB = Math.round(b / count);
            const avgA = Math.round(a / count);

            for (let py = 0; py < pixelSize && y + py < sourceHeight; py++) {
              for (let px = 0; px < pixelSize && x + px < sourceWidth; px++) {
                const idx = ((y + py) * sourceWidth + (x + px)) * 4;
                data[idx] = avgR;
                data[idx + 1] = avgG;
                data[idx + 2] = avgB;
                data[idx + 3] = avgA;
              }
            }
          }
        }
        break;

      case 3: // Gaussian blur
        const radius = 2;
        const sigma = 1.5;

        // Create Gaussian kernel
        const kernel: number[] = [];
        let kernelSum = 0;
        for (let y = -radius; y <= radius; y++) {
          for (let x = -radius; x <= radius; x++) {
            const exp = -(x * x + y * y) / (2 * sigma * sigma);
            const value = Math.exp(exp) / (2 * Math.PI * sigma * sigma);
            kernel.push(value);
            kernelSum += value;
          }
        }
        // Normalize kernel
        kernel.forEach((value, i) => (kernel[i] = value / kernelSum));

        // Apply Gaussian blur
        const tempData = new Uint8ClampedArray(data);
        for (let y = 0; y < sourceHeight; y++) {
          for (let x = 0; x < sourceWidth; x++) {
            let r = 0,
              g = 0,
              b = 0,
              a = 0;
            let kernelIndex = 0;

            for (let ky = -radius; ky <= radius; ky++) {
              for (let kx = -radius; kx <= radius; kx++) {
                const px = Math.min(Math.max(x + kx, 0), sourceWidth - 1);
                const py = Math.min(Math.max(y + ky, 0), sourceHeight - 1);
                const i = (py * sourceWidth + px) * 4;

                r += bufferData[i] * kernel[kernelIndex];
                g += bufferData[i + 1] * kernel[kernelIndex];
                b += bufferData[i + 2] * kernel[kernelIndex];
                a += bufferData[i + 3] * kernel[kernelIndex];
                kernelIndex++;
              }
            }

            const i = (y * sourceWidth + x) * 4;
            data[i] = Math.round(r);
            data[i + 1] = Math.round(g);
            data[i + 2] = Math.round(b);
            data[i + 3] = Math.round(a);
          }
        }
        break;
    }

    // Apply the effect to the target area
    ctx.putImageData(imageData, targetLeft, targetTop);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={startStretching}
        onMouseUp={stopStretching}
        onMouseOut={stopStretching}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        className="border border-gray-300"
        aria-label="Image canvas for pixel stretching"
      />
      <canvas
        ref={cursorCanvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};

export default StretchCanvas;
