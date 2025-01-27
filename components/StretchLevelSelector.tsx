import { Button } from "@/components/ui/button";

interface EffectSelectorProps {
  level: number;
  onChange: (level: number) => void;
}

const EffectSelector: React.FC<EffectSelectorProps> = ({ level, onChange }) => {
  const effects = [
    { name: "Stretch", icon: "↔️" },
    { name: "Blur", icon: "⚪" },
    { name: "Pixelate", icon: "▦" },
  ];

  return (
    <div className="flex space-x-2">
      {effects.map((effect, index) => (
        <Button
          key={effect.name}
          onClick={() => onChange(index)}
          className={`flex items-center space-x-2 transition-colors ${
            level === index
              ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              : "bg-zinc-700 text-zinc-100 hover:bg-zinc-600 border border-zinc-600"
          }`}
        >
          <span className="text-lg">{effect.icon}</span>
          <span className="font-light">{effect.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default EffectSelector;
