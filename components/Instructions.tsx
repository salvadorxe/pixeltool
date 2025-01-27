import type React from "react";

const Instructions: React.FC = () => {
  return (
    <div className="bg-zinc-950/50 border-t border-zinc-800 p-8">
      <h2 className="text-xl font-light text-yellow-200 mb-4">How to Use</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-zinc-300 font-medium mb-2">Tools</h3>
          <ul className="space-y-2 text-zinc-400">
            <li>
              <span className="text-yellow-200">↔️</span> Stretch - Click and
              drag to stretch pixels
            </li>
            <li>
              <span className="text-yellow-200">⚪</span> Blur - Smoothly blur
              areas
            </li>
            <li>
              <span className="text-yellow-200">▦</span> Pixelate - Create
              mosaic effects
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-zinc-300 font-medium mb-2">Brush Controls</h3>
          <ul className="space-y-2 text-zinc-400">
            <li>Use slider to adjust brush size</li>
            <li>
              <kbd className="px-2 py-1 bg-zinc-800 rounded text-sm">Shift</kbd>{" "}
              +{" "}
              <kbd className="px-2 py-1 bg-zinc-800 rounded text-sm">
                Scroll
              </kbd>{" "}
              to resize brush
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-zinc-300 font-medium mb-2">Tips</h3>
          <ul className="space-y-2 text-zinc-400">
            <li>Small brush sizes for detailed work</li>
            <li>Large brush sizes for broad effects</li>
            <li>Use Reset to start over</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
