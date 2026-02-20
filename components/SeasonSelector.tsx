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
  const seasons: { id: Season, icon: any, color: string }[] = [
    { id: 'spring', icon: Flower2, color: 'text-emerald-400' },
    { id: 'summer', icon: Sun, color: 'text-amber-400' },
    { id: 'autumn', icon: Leaf, color: 'text-orange-400' },
    { id: 'winter', icon: CloudSnow, color: 'text-blue-400' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jahreszeit wählen</label>
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
                    ? 'bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? season.color : ''}`} />
                <span className="text-[10px] font-bold uppercase">{SEASONAL_DATA[season.id].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSeason && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hintergrund-Vorschlag</label>
          <div className="grid grid-cols-1 gap-2">
            {SEASONAL_DATA[selectedSeason].suggestions.map((suggestion) => {
              const isActive = selectedBackground?.id === suggestion.id;
              return (
                <button
                  key={suggestion.id}
                  onClick={() => onBackgroundChange(suggestion)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                    isActive 
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-100' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-medium">{suggestion.label}</span>
                  {isActive && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
