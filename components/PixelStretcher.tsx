"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import StretchCanvas from "./StretchCanvas";
import StretchLevelSelector from "./StretchLevelSelector";
import Instructions from "./Instructions";
import { Toaster, toast } from "sonner";

const MAX_CANVAS_SIZE = 800;

const PixelPlay: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState<number>(20);
  const [effectType, setEffectType] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null!);

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

      const ctx = canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: true,
      });

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, width, height);
      }

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
          resizedImage.onload = () => {
            setImage(resizedImage);
            toast.success("Image uploaded successfully");
          };
          resizedImage.src = resizedCanvas.toDataURL("image/png", 1.0);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const resizedCanvas = resizeImage(img);
            const resizedImage = new Image();
            resizedImage.onload = () => {
              setImage(resizedImage);
              toast.success("Image uploaded successfully");
            };
            resizedImage.src = resizedCanvas.toDataURL("image/png", 1.0);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    },
    [resizeImage]
  );

  const handleDownload = () => {
    if (canvasRef.current) {
      const defaultName = `pixel_play_${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt("Save image as:", defaultName);

      if (fileName) {
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = canvasRef.current.toDataURL("image/png", 1.0);
        link.click();
        toast.success("Image downloaded successfully");
      }
    }
  };

  const handleReset = useCallback(() => {
    if (canvasRef.current && image) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(image, 0, 0);
        toast.success("Canvas reset");
      }
    }
  }, [image]);

  const handleBrushSizeChange = (newSize: number) => {
    setBrushSize(newSize);
  };

  const handleEffectTypeChange = (type: number) => {
    setEffectType(type);
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
    <div className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 text-zinc-100">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#fafafa",
          },
          className: "text-sm font-light",
        }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-light text-zinc-100 tracking-tight">
            Pixel Play
          </h1>
          <p className="mt-4 text-xl text-zinc-400 font-light">
            Digital art manipulation, reimagined
          </p>
        </div>
        <div className="bg-zinc-900 shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="space-x-4">
                <Button
                  onClick={handleUploadClick}
                  className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                >
                  Upload Image
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!image}
                  className="bg-zinc-700 text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
                >
                  Download Image
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={!image}
                  className="bg-zinc-700 text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
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
                level={effectType}
                onChange={handleEffectTypeChange}
              />
            </div>
            <div
              className="flex items-center justify-center mb-8"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="w-full max-w-3xl">
                {image ? (
                  <StretchCanvas
                    image={image}
                    brushSize={brushSize}
                    effectType={effectType}
                    canvasRef={canvasRef}
                    onBrushSizeChange={handleBrushSizeChange}
                  />
                ) : (
                  <div
                    className="border-4 border-dashed border-zinc-700 rounded-lg h-96 flex flex-col items-center justify-center transition-colors hover:border-yellow-200/25"
                    onClick={handleUploadClick}
                  >
                    <p className="text-zinc-500 text-xl font-light mb-4">
                      Drop an image here
                    </p>
                    <p className="text-zinc-500 text-xl font-light">
                      or click to upload
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-zinc-400 mb-2 font-light">
                Brush Size: {brushSize}px
              </p>
              <input
                type="range"
                min="1"
                max="200"
                value={brushSize}
                onChange={(e) =>
                  handleBrushSizeChange(Number.parseInt(e.target.value))
                }
                className="w-full max-w-xs accent-yellow-200"
              />
            </div>
          </div>
          <Instructions />
        </div>
      </div>
    </div>
  );
};

export default PixelPlay;
