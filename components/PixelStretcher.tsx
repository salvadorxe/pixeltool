"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import StretchCanvas from "./StretchCanvas";
import StretchLevelSelector from "./StretchLevelSelector";
import Instructions from "./Instructions";

const MAX_CANVAS_SIZE = 800;

const PixelStretcher: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState<number>(20);
  const [stretchLevel, setStretchLevel] = useState<number>(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resizeImage = useCallback(
    (img: HTMLImageElement): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_CANVAS_SIZE) {
          height *= MAX_CANVAS_SIZE / width;
          width = MAX_CANVAS_SIZE;
        }
      } else {
        if (height > MAX_CANVAS_SIZE) {
          width *= MAX_CANVAS_SIZE / height;
          height = MAX_CANVAS_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      return canvas;
    },
    []
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const resizedCanvas = resizeImage(img);
          const resizedImage = new Image();
          resizedImage.onload = () => setImage(resizedImage);
          resizedImage.src = resizedCanvas.toDataURL();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = "stretched-image.png";
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  const handleReset = useCallback(() => {
    if (canvasRef.current && image) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(image, 0, 0);
      }
    }
  }, [image]);

  const handleBrushSizeChange = (newSize: number) => {
    setBrushSize(newSize);
  };

  const handleStretchLevelChange = (level: number) => {
    setStretchLevel(level);
  };

  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight">
            PIXEL STRETCHER
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Transform your images with a touch of stretch
          </p>
        </div>
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="space-x-4">
                <Button
                  onClick={handleUploadClick}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Upload Image
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!image}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Download Image
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={!image}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Reset Canvas
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <StretchLevelSelector
                level={stretchLevel}
                onChange={handleStretchLevelChange}
              />
            </div>
            <div className="flex items-center justify-center mb-8">
              <div className="w-full max-w-3xl">
                {image ? (
                  <StretchCanvas
                    image={image}
                    brushSize={brushSize}
                    stretchLevel={stretchLevel}
                    canvasRef={canvasRef}
                    onBrushSizeChange={handleBrushSizeChange}
                  />
                ) : (
                  <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                    <p className="text-gray-500 text-xl">
                      Upload an image to start stretching
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-2">Brush Size: {brushSize}px</p>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) =>
                  handleBrushSizeChange(Number.parseInt(e.target.value))
                }
                className="w-full max-w-xs"
              />
            </div>
          </div>
          <Instructions />
        </div>
      </div>
    </div>
  );
};

export default PixelStretcher;
