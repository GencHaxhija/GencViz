import React, { useState, useRef, useEffect } from 'react';
import { Download, MoveHorizontal, Wand2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ComparisonViewProps {
  original: string;
  generated: string;
  onDownload: () => void;
  onEdit?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ original, generated, onDownload, onEdit }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on the slider handle, start resizing
    if ((e.target as HTMLElement).closest('.slider-handle')) {
        setIsResizing(true);
        return;
    }

    // Otherwise, start panning if zoomed in
    if (zoomLevel > 1) {
        setIsPanning(true);
        setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setIsPanning(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizing && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    }

    if (isPanning) {
        setPanPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest('.slider-handle')) {
          setIsResizing(true);
          return;
      }
      if (zoomLevel > 1) {
          setIsPanning(true);
          setDragStart({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
      }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (isResizing && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
          setSliderPosition((x / rect.width) * 100);
      }
      if (isPanning) {
          setPanPosition({
              x: e.touches[0].clientX - dragStart.x,
              y: e.touches[0].clientY - dragStart.y
          });
      }
  };

  const handleTouchEnd = () => {
      setIsResizing(false);
      setIsPanning(false);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2 mb-2">
          <button onClick={handleZoomOut} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50" disabled={zoomLevel <= 1}>
              <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 text-xs font-mono flex items-center">
              {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50" disabled={zoomLevel >= 4}>
              <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50" title="Reset View">
              <Maximize className="w-4 h-4" />
          </button>
      </div>

      <div 
        ref={containerRef}
        className={`relative w-full aspect-[4/3] md:aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xl ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-col-resize'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
            className="w-full h-full relative"
            style={{ 
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.2s ease-out'
            }}
        >
            {/* Background Image (Generated) */}
            <img 
            src={generated} 
            alt="Generated" 
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Foreground Image (Original) - Clipped via clipPath for perfect alignment */}
            <div 
                className="absolute top-0 left-0 h-full w-full pointer-events-none select-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img 
                    src={original} 
                    alt="Original" 
                    className="w-full h-full object-cover"
                />
            </div>
        </div>

        {/* Labels - Fixed position relative to container, not zoomed */}
        <div className="absolute top-4 left-4 bg-white/80 text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg backdrop-blur-md border border-slate-200 shadow-sm pointer-events-none">Vorher</div>
        <div className="absolute top-4 right-4 bg-sky-400/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg backdrop-blur-md border border-white/20 shadow-sm pointer-events-none">Nachher</div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize shadow-[0_0_20px_rgba(0,0,0,0.2)] z-10 slider-handle"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-sky-500 border-4 border-slate-50 pointer-events-none">
            <MoveHorizontal className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onEdit && (
          <button 
            onClick={onEdit}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-400 hover:bg-sky-300 text-white rounded-xl transition-all shadow-lg shadow-sky-200 text-sm font-semibold active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            Auswählen und weiter bearbeiten
          </button>
        )}
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all border border-slate-200 text-sm font-semibold shadow-sm active:scale-95"
        >
          <Download className="w-4 h-4" />
          Save Full Resolution
        </button>
      </div>
    </div>
  );
};