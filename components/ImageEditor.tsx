import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Paintbrush, Check, X, Wand2, Sparkles, Image as ImageIcon, Upload, ZoomIn, ZoomOut, Maximize, Hand } from 'lucide-react';
import { Button } from './Button';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (maskBase64: string, prompt: string, referenceImage?: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(30);
  const [brushOpacity, setBrushOpacity] = useState(0.4);
  const [mode, setMode] = useState<'draw' | 'erase' | 'wand' | 'pan'>('draw');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(30);

  // Zoom and Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Hidden canvas to read original image data for magic wand
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      return {
          x: (clientX - rect.left) / zoomLevel,
          y: (clientY - rect.top) / zoomLevel
      };
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
      setZoomLevel(prev => {
          const newZoom = Math.max(prev - 0.5, 1);
          if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
          return newZoom;
      });
  };
  const handleResetZoom = () => {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
  };


  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const maxWidth = container.clientWidth;
      const maxHeight = window.innerHeight * 0.6;
      
      if (maxWidth === 0) {
          setTimeout(() => {
              if (containerRef.current) {
                  const newMaxWidth = containerRef.current.clientWidth;
                  if (newMaxWidth > 0) {
                      // Recalculate
                      const newMaxHeight = window.innerHeight * 0.6;
                      const ratio = Math.min(newMaxWidth / img.width, newMaxHeight / img.height);
                      const newWidth = img.width * ratio;
                      const newHeight = img.height * ratio;
                      
                      setCanvasSize({
                          width: newWidth,
                          height: newHeight
                      });
                      
                      if (imageCanvasRef.current) {
                          imageCanvasRef.current.width = newWidth;
                          imageCanvasRef.current.height = newHeight;
                          const ctx = imageCanvasRef.current.getContext('2d');
                          if (ctx) {
                              ctx.drawImage(img, 0, 0, newWidth, newHeight);
                          }
                      }
                  }
              }
          }, 100);
          return;
      }

      let width = img.width;
      let height = img.height;
      
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const newWidth = width * ratio;
      const newHeight = height * ratio;

      setCanvasSize({
        width: newWidth,
        height: newHeight
      });

      // Draw original image to hidden canvas for pixel reading
      if (imageCanvasRef.current) {
          imageCanvasRef.current.width = newWidth;
          imageCanvasRef.current.height = newHeight;
          const ctx = imageCanvasRef.current.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
          }
      }
    };
  }, [imageUrl]);

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const imageCanvas = imageCanvasRef.current;
    if (!canvas || !imageCanvas) return;

    const ctx = canvas.getContext('2d');
    const imgCtx = imageCanvas.getContext('2d');
    if (!ctx || !imgCtx) return;

    const width = canvas.width;
    const height = canvas.height;

    const imgData = imgCtx.getImageData(0, 0, width, height);
    const maskData = ctx.getImageData(0, 0, width, height);
    
    const pixelStack = [[startX, startY]];
    const startPos = (startY * width + startX) * 4;
    const startR = imgData.data[startPos];
    const startG = imgData.data[startPos + 1];
    const startB = imgData.data[startPos + 2];

    const matchColor = (pos: number) => {
      const r = imgData.data[pos];
      const g = imgData.data[pos + 1];
      const b = imgData.data[pos + 2];
      return (
        Math.abs(r - startR) <= tolerance &&
        Math.abs(g - startG) <= tolerance &&
        Math.abs(b - startB) <= tolerance
      );
    };

    // Helper to check if pixel is already masked
    const isMasked = (pos: number) => maskData.data[pos + 3] > 0;

    const visited = new Uint8Array(width * height);

    while (pixelStack.length) {
      const newPos = pixelStack.pop();
      if (!newPos) continue;
      
      const x = newPos[0];
      const y = newPos[1];
      const pixelPos = (y * width + x) * 4;
      const visitPos = y * width + x;

      if (visited[visitPos]) continue;
      
      // Go up as long as color matches
      let y1 = y;
      while (y1 >= 0 && matchColor((y1 * width + x) * 4) && !visited[y1 * width + x]) {
        y1--;
      }
      y1++;
      
      let spanLeft = false;
      let spanRight = false;
      
      while (y1 < height && matchColor((y1 * width + x) * 4) && !visited[y1 * width + x]) {
          const currentPos = (y1 * width + x) * 4;
          const currentVisitPos = y1 * width + x;
          
          // Mark as visited
          visited[currentVisitPos] = 1;

          // Draw on mask
          maskData.data[currentPos] = 99; // R (indigo-ish)
          maskData.data[currentPos + 1] = 102; // G
          maskData.data[currentPos + 2] = 241; // B
          maskData.data[currentPos + 3] = Math.floor(brushOpacity * 255); // A

          if (x > 0) {
              if (matchColor((y1 * width + (x - 1)) * 4) && !visited[y1 * width + (x - 1)]) {
                  if (!spanLeft) {
                      pixelStack.push([x - 1, y1]);
                      spanLeft = true;
                  }
              } else if (spanLeft) {
                  spanLeft = false;
              }
          }
          
          if (x < width - 1) {
              if (matchColor((y1 * width + (x + 1)) * 4) && !visited[y1 * width + (x + 1)]) {
                  if (!spanRight) {
                      pixelStack.push([x + 1, y1]);
                      spanRight = true;
                  }
              } else if (spanRight) {
                  spanRight = false;
              }
          }
          y1++;
      }
    }
    
    ctx.putImageData(maskData, 0, 0);
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
      if (mode === 'pan' || (zoomLevel > 1 && (e as React.MouseEvent).button === 1)) { // Middle click or pan mode
          setIsPanning(true);
          let clientX, clientY;
          if ('touches' in e) {
              clientX = e.touches[0].clientX;
              clientY = e.touches[0].clientY;
          } else {
              clientX = (e as React.MouseEvent).clientX;
              clientY = (e as React.MouseEvent).clientY;
          }
          setDragStart({ x: clientX - panPosition.x, y: clientY - panPosition.y });
          return;
      }

      if (mode === 'wand') {
          const { x, y } = getCanvasPoint(e);
          floodFill(Math.floor(x), Math.floor(y));
          return;
      }

      startDrawing(e);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode === 'wand') return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setIsPanning(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPanning) {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        setPanPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
        return;
    }

    if (!isDrawing || mode === 'wand' || mode === 'pan') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasPoint(e);

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
      onSave(dataUrl, prompt, referenceImage || undefined);
    };
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setReferenceImage(reader.result as string);
      reader.readAsDataURL(file);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
      if (mode !== 'wand') {
          startDrawing(e);
          return;
      }
      handleCanvasClick(e);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
              <button 
                onClick={() => setMode('draw')}
                className={`p-2 rounded-lg transition-all ${mode === 'draw' ? 'bg-sky-400 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Magic Pen (Zeichnen)"
              >
                <Paintbrush className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setMode('erase')}
                className={`p-2 rounded-lg transition-all ${mode === 'erase' ? 'bg-sky-400 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Radierer (Selektiv löschen)"
              >
                <Eraser className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setMode('wand')}
                className={`p-2 rounded-lg transition-all ${mode === 'wand' ? 'bg-sky-400 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Zauberstab (Auto-Maskierung)"
              >
                <Wand2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setMode('pan')}
                className={`p-2 rounded-lg transition-all ${mode === 'pan' ? 'bg-sky-400 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Verschieben (Pan)"
              >
                <Hand className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
              <button 
                onClick={clearMask}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                title="Alle Markierungen löschen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {mode === 'wand' ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Toleranz</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={tolerance} 
                      onChange={(e) => setTolerance(parseInt(e.target.value))}
                      className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>
              ) : (
                  <>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pinselgröße</span>
                        <input 
                        type="range" 
                        min="5" 
                        max="150" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-400"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Deckkraft</span>
                        <input 
                        type="range" 
                        min="0.1" 
                        max="0.9" 
                        step="0.1"
                        value={brushOpacity} 
                        onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                        className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-400"
                        />
                    </div>
                  </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div ref={containerRef} className="relative bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center min-h-[400px] border border-slate-100">
          <div 
              style={{ 
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out'
              }}
              className="relative"
          >
            <img 
              src={imageUrl} 
              alt="To edit" 
              className="absolute pointer-events-none select-none"
              style={{ width: canvasSize.width, height: canvasSize.height }}
            />
            
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleCanvasClick}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleCanvasTouchStart}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`relative touch-none ${mode === 'wand' ? 'cursor-crosshair' : mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
            />
          </div>

          {/* Hidden canvas for reading image data */}
          <canvas ref={imageCanvasRef} className="hidden" />

          {/* Zoom Controls Overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 shadow-sm z-10">
              <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" disabled={zoomLevel >= 4} title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" disabled={zoomLevel <= 1} title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={handleResetZoom} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Reset View">
                  <Maximize className="w-4 h-4" />
              </button>
          </div>
          
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-sky-600 flex items-center gap-2 shadow-sm pointer-events-none z-10">
            {mode === 'wand' ? <Wand2 className="w-3 h-3" /> : mode === 'pan' ? <Hand className="w-3 h-3" /> : <Paintbrush className="w-3 h-3" />}
            {mode === 'draw' ? 'Markiere den Bereich' : mode === 'erase' ? 'Lösche Markierungen' : mode === 'wand' ? 'Klicke zum Auto-Maskieren' : 'Verschieben'}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Check className="w-4 h-4 text-sky-400" />
            Was soll im markierten Bereich geändert werden?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none resize-none text-sm leading-relaxed transition-all"
            placeholder="e.g. Change the facade material to dark wood, add more plants on the balcony, or replace the windows with floor-to-ceiling glass..."
          />
        </div>

        {/* Material Reference Upload */}
        <div className="space-y-2">
             <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                Material Referenz (Optional)
             </label>
             <div className="flex items-center gap-4">
                 <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all text-sm font-medium">
                     <Upload className="w-4 h-4" />
                     Bild hochladen
                     <input type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden" />
                 </label>
                 {referenceImage && (
                     <div className="relative group">
                         <img src={referenceImage} alt="Reference" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                         <button 
                            onClick={() => setReferenceImage(null)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                             <X className="w-3 h-3" />
                         </button>
                     </div>
                 )}
                 {referenceImage && <span className="text-xs text-slate-400">Referenz geladen</span>}
             </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            className="flex-1 py-3 text-lg bg-sky-400 hover:bg-sky-300 text-white shadow-lg shadow-sky-200 rounded-xl" 
            isLoading={isProcessing}
            disabled={!prompt.trim()}
            icon={<Sparkles className="w-5 h-5" />}
          >
            {isProcessing ? 'Bearbeitung wird angewendet...' : 'Magische Bearbeitung anwenden'}
          </Button>
          <Button 
            onClick={onCancel} 
            variant="secondary"
            className="px-6 bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            disabled={isProcessing}
          >
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
};
