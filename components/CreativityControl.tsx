import React from 'react';
import { Ruler, Paintbrush, Compass } from 'lucide-react';
import { CreativityLevel } from '../types';

interface CreativityControlProps {
  value: CreativityLevel;
  onChange: (value: CreativityLevel) => void;
  disabled?: boolean;
}

export const CreativityControl: React.FC<CreativityControlProps> = ({ value, onChange, disabled }) => {
  const levels: { id: CreativityLevel; label: string; icon: React.ReactNode; desc: string }[] = [
    { 
      id: 'strict', 
      label: 'Strict Geometry', 
      icon: <Ruler className="w-4 h-4" />,
      desc: 'Exact trace-over. Keeps every line.' 
    },
    { 
      id: 'balanced', 
      label: 'Balanced', 
      icon: <Compass className="w-4 h-4" />,
      desc: 'Respects structure, refines details.' 
    },
    { 
      id: 'creative', 
      label: 'Imaginative', 
      icon: <Paintbrush className="w-4 h-4" />,
      desc: 'Loose reference. Adds creative elements.' 
    }
  ];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-300">Geometric Precision</label>
      <div className="grid grid-cols-1 gap-2">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => onChange(level.id)}
            disabled={disabled}
            className={`
              relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left
              ${value === level.id 
                ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`p-2 rounded-md ${value === level.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              {level.icon}
            </div>
            <div>
              <div className={`text-sm font-semibold ${value === level.id ? 'text-white' : 'text-slate-200'}`}>
                {level.label}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {level.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};