import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Paintbrush, Check, X, Wand2, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (maskBase64: string, prompt: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(30);
  const [brushOpacity, setBrushOpacity] = useState(0.4);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      
      const maxWidth = container.clientWidth;
      const maxHeight = window.innerHeight * 0.6;
      
      let width = img.width;
      let height = img.height;
      
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      setCanvasSize({
        width: width * ratio,
        height: height * ratio
      });
    };
  }, [imageUrl]);

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (mode === 'draw') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(99, 102, 241, ${brushOpacity})`;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas to merge the original image and the mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      const dataUrl = tempCanvas.toDataURL('image/png');
      onSave(dataUrl, prompt);
    };
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => setMode('draw')}
                className={`p-2 rounded-md transition-all ${mode === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Magic Pen (Zeichnen)"
              >
                <Paintbrush className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setMode('erase')}
                className={`p-2 rounded-md transition-all ${mode === 'erase' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Radierer (Selektiv löschen)"
              >
                <Eraser className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-slate-700 mx-1 self-center" />
              <button 
                onClick={clearMask}
                className="p-2 rounded-md text-slate-400 hover:text-red-400 transition-all"
                title="Alle Markierungen löschen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Pinselgröße</span>
                <input 
                  type="range" 
                  min="5" 
                  max="150" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Deckkraft</span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.9" 
                  step="0.1"
                  value={brushOpacity} 
                  onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                  className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="relative bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center min-h-[400px]">
          <img 
            src={imageUrl} 
            alt="To edit" 
            className="absolute pointer-events-none"
            style={{ width: canvasSize.width, height: canvasSize.height }}
          />
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="relative cursor-crosshair touch-none"
          />
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
            <Wand2 className="w-3 h-3" />
            {mode === 'draw' ? 'Markiere den Bereich' : 'Lösche Markierungen'}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-400" />
            Was soll im markierten Bereich geändert werden?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-24 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm leading-relaxed"
            placeholder="e.g. Change the facade material to dark wood, add more plants on the balcony, or replace the windows with floor-to-ceiling glass..."
          />
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            className="flex-1 py-3 text-lg" 
            isLoading={isProcessing}
            disabled={!prompt.trim()}
            icon={<Sparkles className="w-5 h-5" />}
          >
            {isProcessing ? 'Bearbeitung wird angewendet...' : 'Magische Bearbeitung anwenden'}
          </Button>
          <Button 
            onClick={onCancel} 
            variant="secondary"
            className="px-6"
            disabled={isProcessing}
          >
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
};
