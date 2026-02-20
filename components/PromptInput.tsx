import React from 'react';
import { Wand2 } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-indigo-400" />
        Render Prompt
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm leading-relaxed"
        placeholder="Describe how you want the rendering to look..."
      />
      <p className="text-xs text-slate-500">
        Tip: Be specific about lighting, materials, and atmosphere.
      </p>
    </div>
  );
};
