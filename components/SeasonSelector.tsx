import React from 'react';
import { Sun, CloudSnow, Leaf, Flower2, Check } from 'lucide-react';
import { Season, BackgroundSuggestion } from '../types';
import { SEASONAL_DATA } from '../constants';

interface SeasonSelectorProps {
  selectedSeason: Season | null;
  selectedBackground: BackgroundSuggestion | null;
  onSeasonChange: (season: Season) => void;
  onBackgroundChange: (suggestion: BackgroundSuggestion) => void;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  selectedSeason,
  selectedBackground,
  onSeasonChange,
  onBackgroundChange
}) => {
  const seasons: { id: Season, icon: any, color: string, activeColor: string }[] = [
    { id: 'spring', icon: Flower2, color: 'text-emerald-400', activeColor: 'bg-emerald-100 text-emerald-600 border-emerald-300' },
    { id: 'summer', icon: Sun, color: 'text-amber-400', activeColor: 'bg-amber-100 text-amber-600 border-amber-300' },
    { id: 'autumn', icon: Leaf, color: 'text-orange-400', activeColor: 'bg-orange-100 text-orange-600 border-orange-300' },
    { id: 'winter', icon: CloudSnow, color: 'text-sky-400', activeColor: 'bg-sky-100 text-sky-600 border-sky-300' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jahreszeit wählen</label>
        <div className="grid grid-cols-4 gap-2">
          {seasons.map((season) => {
            const Icon = season.icon;
            const isActive = selectedSeason === season.id;
            return (
              <button
                key={season.id}
                onClick={() => onSeasonChange(season.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  isActive 
                    ? `${season.activeColor} shadow-sm` 
                    : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/50 text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : season.color}`} />
                <span className="text-[10px] font-bold uppercase">{SEASONAL_DATA[season.id].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSeason && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hintergrund-Vorschlag</label>
          <div className="grid grid-cols-1 gap-2">
            {SEASONAL_DATA[selectedSeason].suggestions.map((suggestion) => {
              const isActive = selectedBackground?.id === suggestion.id;
              return (
                <button
                  key={suggestion.id}
                  onClick={() => onBackgroundChange(suggestion)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                    isActive 
                      ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/50 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-medium">{suggestion.label}</span>
                  {isActive && <Check className="w-4 h-4 text-sky-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
