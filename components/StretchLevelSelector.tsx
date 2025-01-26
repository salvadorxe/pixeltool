import type React from "react";

interface StretchLevelSelectorProps {
  level: number;
  onChange: (level: number) => void;
}

const StretchLevelSelector: React.FC<StretchLevelSelectorProps> = ({
  level,
  onChange,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Stretch Level:</span>
      <div className="flex space-x-2">
        {[1, 2, 3].map((l) => (
          <button
            key={l}
            className={`rounded-full flex items-center justify-center transition-all duration-200 ${
              level === l ? "bg-blue-500" : "bg-gray-200 hover:bg-gray-300"
            }`}
            style={{
              width: `${24 + (l - 1) * 8}px`,
              height: `${24 + (l - 1) * 8}px`,
            }}
            onClick={() => onChange(l)}
            aria-label={`Stretch Level ${l}`}
          >
            <div
              className={`rounded-full ${
                level === l ? "bg-white" : "bg-gray-400"
              }`}
              style={{
                width: `${12 + (l - 1) * 4}px`,
                height: `${12 + (l - 1) * 4}px`,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default StretchLevelSelector;
