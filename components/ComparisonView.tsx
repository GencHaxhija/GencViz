import React, { useState } from 'react';
import { Download, ArrowRightLeft, Wand2 } from 'lucide-react';

interface ComparisonViewProps {
  original: string;
  generated: string;
  onDownload: () => void;
  onEdit?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ original, generated, onDownload, onEdit }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  
  const updatePosition = (clientX: number, containerRect: DOMRect) => {
    const x = Math.max(0, Math.min(clientX - containerRect.left, containerRect.width));
    setSliderPosition((x / containerRect.width) * 100);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    updatePosition(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        className="relative w-full aspect-[4/3] md:aspect-video bg-slate-800 rounded-xl overflow-hidden cursor-col-resize select-none border border-slate-700 shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={(e) => {
             updatePosition(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
        }}
      >
        {/* Background Image (Generated) */}
        <img 
          src={generated} 
          alt="Generated" 
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Foreground Image (Original) - Clipped via clipPath for perfect alignment */}
        <div 
            className="absolute top-0 left-0 h-full w-full pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
            <img 
                src={original} 
                alt="Original" 
                className="w-full h-full object-cover"
            />
             <div className="absolute top-4 left-4 bg-black/50 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-md border border-white/10">Vorher</div>
        </div>

        <div className="absolute top-4 right-4 bg-indigo-600/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-md border border-white/10">Nachher</div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 cursor-col-resize shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center text-indigo-600 border-4 border-slate-900/10">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onEdit && (
          <button 
            onClick={onEdit}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm font-semibold active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            Auswählen und weiter bearbeiten
          </button>
        )}
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-600 text-sm font-semibold shadow-lg active:scale-95"
        >
          <Download className="w-4 h-4" />
          Save Full Resolution
        </button>
      </div>
    </div>
  );
};