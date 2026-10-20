import React from 'react';
import { Zap, Clock, Sparkles } from 'lucide-react';

interface OfflineIncomeModalProps {
  amount: number;
  elapsedSeconds: number;
  onClaim: () => void;
}

export const OfflineIncomeModal: React.FC<OfflineIncomeModalProps> = ({
  amount,
  elapsedSeconds,
  onClaim,
}) => {
  if (amount <= 0) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Zap className="w-8 h-8 text-slate-950 fill-slate-950" />
        </div>

        <div>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest block mb-1">
            Colony Yield Report
          </span>
          <h2 className="text-xl font-black text-slate-100 font-display">
            Welcome Back, Commander!
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Accumulated while offline for {timeStr}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-0.5">Automated Harvest</span>
          <span className="text-2xl font-black text-sky-400 font-mono tabular-nums">
            +{amount.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">Cosmic Energy</span>
        </div>

        <button
          onClick={onClaim}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/25 active:scale-95 transition-all"
        >
          Collect Resources
        </button>
      </div>
    </div>
  );
};
