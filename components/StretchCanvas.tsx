"use client";

import type React from "react";
import { useRef, useEffect, useState, useCallback } from "react";

interface StretchCanvasProps {
  image: HTMLImageElement;
  brushSize: number;
  effectType: number; // 0: Smudge, 1: Blur, 2: Pixelate
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onBrushSizeChange: (size: number) => void;
}

interface StretchPoint {
  x: number;
  y: number;
}

interface CanvasState {
  imageData: ImageData;
  timestamp: number;
}

const StretchCanvas: React.FC<StretchCanvasProps> = ({
  image,
  brushSize,
  effectType,
  canvasRef,
  onBrushSizeChange,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const brushRef = useRef<HTMLDivElement>(null);

  // Track if mouse is over canvas
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Add state for stretch start point
  const [stretchStart, setStretchStart] = useState<StretchPoint | null>(null);
  const [stretchPreview, setStretchPreview] = useState<StretchPoint | null>(
    null
  );

  // Add state for undo history
  const [undoStack, setUndoStack] = useState<CanvasState[]>([]);
  const isUndoingRef = useRef(false);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = image.width;
      canvasRef.current.height = image.height;
      const ctx = canvasRef.current.getContext("2d", {
        alpha: true,
        willReadFrequently: true,
      });

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0);
      }
    }
  }, [image, canvasRef]);

  // Create preview canvas for live feedback
  useEffect(() => {
    if (canvasRef.current) {
      const preview = document.createElement("canvas");
      preview.width = canvasRef.current.width;
      preview.height = canvasRef.current.height;
      setStretchPreview({ x: 0, y: 0 });
    }
  }, [canvasRef]);

  // Save initial state when image loads
  useEffect(() => {
    if (canvasRef.current && image) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        setUndoStack([{ imageData, timestamp: Date.now() }]);
      }
    }
  }, [image]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveState = useCallback(() => {
    if (!canvasRef.current || isUndoingRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      const imageData = ctx.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      setUndoStack((prev) => [...prev, { imageData, timestamp: Date.now() }]);
    }
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length <= 1) return prev; // Keep initial state

      const newStack = prev.slice(0, -1);
      const lastState = newStack[newStack.length - 1];

      if (canvasRef.current) {
        isUndoingRef.current = true;
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.putImageData(lastState.imageData, 0, 0);
        }
        isUndoingRef.current = false;
      }

      return newStack;
    });
  }, []);

  // Function to get canvas-relative coordinates and scale
  const getCanvasMetrics = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get coordinates relative to canvas
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Get screen coordinates for brush cursor
    const screenX = e.clientX;
    const screenY = e.clientY;

    return {
      canvasX,
      canvasY,
      screenX,
      screenY,
      scaleX: rect.width / canvas.width,
      scaleY: rect.height / canvas.height,
    };
  };

  const applyStretch = (
    ctx: CanvasRenderingContext2D,
    start: StretchPoint,
    end: StretchPoint
  ) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const perpX = -dy / distance;
    const perpY = dx / distance;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = Math.ceil(distance);
    tempCanvas.height = brushSize;
    const tempCtx = tempCanvas.getContext("2d", {
      alpha: true,
      willReadFrequently: true,
    });

    if (tempCtx) {
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = "high";

      // Sample pixels with better interpolation
      for (let i = 0; i < brushSize; i++) {
        const sampleX = start.x + perpX * (i - brushSize / 2);
        const sampleY = start.y + perpY * (i - brushSize / 2);

        const pixel = ctx.getImageData(
          Math.round(sampleX),
          Math.round(sampleY),
          1,
          1
        );

        tempCtx.fillStyle = `rgba(${pixel.data[0]}, ${pixel.data[1]}, ${
          pixel.data[2]
        }, ${pixel.data[3] / 255})`;
        tempCtx.fillRect(0, i, tempCanvas.width, 1);
      }
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(start.x, start.y);
    ctx.rotate(angle);
    ctx.drawImage(tempCanvas, 0, -brushSize / 2);
    ctx.restore();
  };

  const applyBlur = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const radius = brushSize / 2;
    const blurRadius = Math.max(2, Math.floor(brushSize / 20)); // Even smaller kernel

    // Create circular mask
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = brushSize;
    tempCanvas.height = brushSize;
    const tempCtx = tempCanvas.getContext("2d")!;

    // Get source pixels
    const imageData = ctx.getImageData(
      Math.round(x - radius),
      Math.round(y - radius),
      brushSize,
      brushSize
    );
    const pixels = imageData.data;
    const original = new Uint8ClampedArray(pixels);

    // Apply Gaussian blur with very subtle blend
    for (let i = 0; i < pixels.length; i += 4) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let weightSum = 0;

      const px = (i / 4) % brushSize;
      const py = Math.floor(i / 4 / brushSize);

      // Check if pixel is within circular brush area
      const distanceFromCenter = Math.hypot(px - radius, py - radius);
      if (distanceFromCenter <= radius) {
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          for (let dy = -blurRadius; dy <= blurRadius; dy++) {
            const x2 = px + dx;
            const y2 = py + dy;

            if (x2 >= 0 && x2 < brushSize && y2 >= 0 && y2 < brushSize) {
              const j = (y2 * brushSize + x2) * 4;
              const weight = Math.exp(
                (-dx * dx - dy * dy) / (2 * blurRadius * blurRadius)
              );

              r += original[j] * weight;
              g += original[j + 1] * weight;
              b += original[j + 2] * weight;
              a += original[j + 3] * weight;
              weightSum += weight;
            }
          }
        }

        // Very subtle blend for single-pass effect
        const blend = 0.3; // Reduced from 0.7 for subtler effect
        const falloff = 1 - distanceFromCenter / radius;
        const finalBlend = blend * falloff;

        pixels[i] =
          (r / weightSum) * finalBlend + original[i] * (1 - finalBlend);
        pixels[i + 1] =
          (g / weightSum) * finalBlend + original[i + 1] * (1 - finalBlend);
        pixels[i + 2] =
          (b / weightSum) * finalBlend + original[i + 2] * (1 - finalBlend);
        pixels[i + 3] =
          (a / weightSum) * finalBlend + original[i + 3] * (1 - finalBlend);
      }
    }

    ctx.putImageData(imageData, Math.round(x - radius), Math.round(y - radius));
  };

  const applyPixelate = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    const radius = brushSize / 2;
    const { x: clampedX, y: clampedY } = clampCoordinates(x, y, radius);

    // Smaller pixelation size for more subtle effect
    const pixelSize = Math.max(2, Math.floor(brushSize / 12));

    for (let px = clampedX - radius; px < clampedX + radius; px += pixelSize) {
      for (
        let py = clampedY - radius;
        py < clampedY + radius;
        py += pixelSize
      ) {
        if (Math.hypot(px - clampedX, py - clampedY) > radius) continue;

        const imageData = ctx.getImageData(px, py, pixelSize, pixelSize);
        const pixels = imageData.data;
        let r = 0,
          g = 0,
          b = 0,
          a = 0;
        let count = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          a += pixels[i + 3];
          count++;
        }

        ctx.fillStyle = `rgba(${r / count}, ${g / count}, ${b / count}, ${
          a / count / 255
        })`;
        ctx.fillRect(px, py, pixelSize, pixelSize);
      }
    }
  };

  // Update brush cursor position and size
  const updateBrush = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const brush = brushRef.current;
    if (!brush || !canvasRef.current) return;

    const metrics = getCanvasMetrics(e);
    if (!metrics) return;

    const { screenX, screenY, scaleX } = metrics;

    // Update brush size and position
    const visualBrushSize = brushSize * scaleX;
    brush.style.width = `${visualBrushSize}px`;
    brush.style.height = `${visualBrushSize}px`;
    brush.style.left = `${screenX}px`;
    brush.style.top = `${screenY}px`;

    // Add red line for stretch effect while keeping circle white
    if (effectType === 0) {
      brush.innerHTML = `
        <div 
          class="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500" 
          style="
            width: 1px; 
            height: 100%;
            opacity: 0.8;
          "
        ></div>
      `;
    } else {
      brush.innerHTML = "";
    }
  };

  // Handle mouse entering/leaving canvas
  const handleMouseEnter = () => setIsOverCanvas(true);
  const handleMouseLeave = () => {
    setIsOverCanvas(false);
    stopDrawing();
  };

  // Modified draw function to use new coordinate system
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const metrics = getCanvasMetrics(e);
    if (!metrics) return;

    const { canvasX, canvasY } = metrics;

    if (effectType === 0 && stretchStart) {
      setStretchPreview({ x: canvasX, y: canvasY });
    } else {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.save();
        switch (effectType) {
          case 1:
            applyBlur(ctx, canvasX, canvasY);
            break;
          case 2:
            applyPixelate(ctx, canvasX, canvasY);
            break;
        }
        ctx.restore();
      }
    }

    setLastX(canvasX);
    setLastY(canvasY);
  };

  // Modified start drawing to use new coordinate system
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const metrics = getCanvasMetrics(e);
    if (!metrics) return;

    const { canvasX, canvasY } = metrics;

    if (effectType === 0) {
      // Stretch effect
      setStretchStart({ x: canvasX, y: canvasY });
      setStretchPreview({ x: canvasX, y: canvasY });
    }
    setIsDrawing(true);
    setLastX(canvasX);
    setLastY(canvasY);
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (
      effectType === 0 &&
      stretchStart &&
      stretchPreview &&
      canvasRef.current
    ) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        applyStretch(ctx, stretchStart, stretchPreview);
        saveState(); // Save state after stretch
      }
    }

    setIsDrawing(false);
    setStretchStart(null);
    setStretchPreview(null);
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -1 : 1;
      const newBrushSize = Math.max(1, Math.min(200, brushSize + delta));
      onBrushSizeChange(newBrushSize);

      // Immediately update brush size visually
      const brush = brushRef.current;
      if (brush && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = rect.width / canvasRef.current.width;
        const visualBrushSize = newBrushSize * scaleX;
        brush.style.width = `${visualBrushSize}px`;
        brush.style.height = `${visualBrushSize}px`;
      }
    }
  };

  const clampCoordinates = (x: number, y: number, radius: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x, y };

    return {
      x: Math.min(Math.max(x, radius), canvas.width - radius),
      y: Math.min(Math.max(y, radius), canvas.height - radius),
    };
  };

  // When finishing a continuous effect (blur/pixelate), save state
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (effectType !== 0) {
      saveState();
    }
    stopDrawing(e);
  };

  return (
    <div
      ref={canvasContainerRef}
      className="relative"
      style={{ cursor: "none" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={(e) => {
          updateBrush(e);
          draw(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="block" // Ensure canvas is block-level
      />
      {isOverCanvas && (
        <div
          ref={brushRef}
          className="fixed pointer-events-none border-2 border-white shadow-sm"
          style={{
            borderRadius: effectType === 2 ? "0" : "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
          }}
        />
      )}
    </div>
  );
};

export default StretchCanvas;
