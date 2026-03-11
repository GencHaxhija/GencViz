import React, { useState } from 'react';
import { Wand2, Image as ImageIcon, Upload, X } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onReferenceImageChange?: (base64: string | null) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled, onReferenceImageChange }) => {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
          const result = reader.result as string;
          setReferenceImage(result);
          if (onReferenceImageChange) onReferenceImageChange(result);
      };
      reader.readAsDataURL(file);
  };

  const clearReference = () => {
      setReferenceImage(null);
      if (onReferenceImageChange) onReferenceImageChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-600 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-sky-400" />
          Render Prompt
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none resize-none text-sm leading-relaxed transition-all"
          placeholder="Beschreibe wie das Rendering aussehen soll..."
        />
        <p className="text-xs text-slate-400">
          Tipp: Sei spezifisch bezüglich Licht, Materialien und Atmosphäre.
        </p>
      </div>

      <div className="space-y-2">
           <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              Material Referenz (Optional)
           </label>
           <div className="flex items-center gap-4">
               <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all text-sm font-medium ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                   <Upload className="w-4 h-4" />
                   Bild hochladen
                   <input type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden" disabled={disabled} />
               </label>
               {referenceImage && (
                   <div className="relative group">
                       <img src={referenceImage} alt="Reference" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                       <button 
                          onClick={clearReference}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={disabled}
                       >
                           <X className="w-3 h-3" />
                       </button>
                   </div>
               )}
               {referenceImage && <span className="text-xs text-slate-400">Referenz geladen</span>}
           </div>
           <p className="text-xs text-slate-400">
              Lade ein Bild hoch, dessen Stil oder Materialien übernommen werden sollen.
           </p>
      </div>
    </div>
  );
};
