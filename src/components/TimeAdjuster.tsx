
import React from 'react';

interface TimeAdjusterProps {
  value: string;
  onAdjust: (amount: number) => void;
  label: string;
}

export const TimeAdjuster: React.FC<TimeAdjusterProps> = ({ value, onAdjust, label }) => {
  return (
    <div className="flex items-center justify-center flex-wrap gap-2">
      <button type="button" onClick={() => onAdjust(-5)} className="w-10 h-10 flex items-center justify-center text-xl font-bold bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors" aria-label={`Decrement ${label} by 5 minutes`}>-5</button>
      <button type="button" onClick={() => onAdjust(-1)} className="w-10 h-10 flex items-center justify-center text-3xl font-bold bg-gray-700 hover:bg-gray-600 rounded-full transition-colors" aria-label={`Decrement ${label} by 1 minute`}>-</button>
      <span className="text-2xl sm:text-4xl font-bold tabular-nums w-20 sm:w-24 text-center text-white">{value}</span>
      <button type="button" onClick={() => onAdjust(1)} className="w-10 h-10 flex items-center justify-center text-3xl font-bold bg-gray-700 hover:bg-gray-600 rounded-full transition-colors" aria-label={`Increment ${label} by 1 minute`}>+</button>
      <button type="button" onClick={() => onAdjust(5)} className="w-10 h-10 flex items-center justify-center text-xl font-bold bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors" aria-label={`Increment ${label} by 5 minutes`}>+5</button>
    </div>
  );
};
