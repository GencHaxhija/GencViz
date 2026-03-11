import React from 'react';
import { Camera, Pencil, Box, Droplets, Maximize2, FileText } from 'lucide-react';
import { RenderingStyle } from '../types';

interface StyleSelectorProps {
  selectedStyle: RenderingStyle;
  onStyleChange: (style: RenderingStyle) => void;
  disabled?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  disabled
}) => {
  const styles: { id: RenderingStyle, label: string, icon: any }[] = [
    { id: 'photorealistic', label: 'Fotorealistisch', icon: Camera },
    { id: 'sketch', label: 'Zeichnerisch', icon: Pencil },
    { id: 'abstract', label: 'Abstrakt', icon: Box },
    { id: 'watercolor', label: 'Aquarell', icon: Droplets },
    { id: 'minimalist', label: 'Minimalistisch', icon: Maximize2 },
    { id: 'blueprint', label: 'Blueprint', icon: FileText },
  ];

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Darstellungsstil</label>
      <div className="grid grid-cols-3 gap-2">
        {styles.map((style) => {
          const Icon = style.icon;
          const isActive = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              disabled={disabled}
              onClick={() => onStyleChange(style.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                isActive 
                  ? 'bg-sky-100 border-sky-300 text-sky-700 shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/50 text-slate-400'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase text-center leading-tight">{style.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
