
import React, { useRef } from 'react';
import type { Section } from '../../types';
import { TrashIcon } from '../../components/icons';

interface SectionItemProps {
  section: Section;
  index: number;
  isEditing: boolean;
  isDragged: boolean;
  onDelete: (id: number) => void;
  onUpdateName: (id: number, name: string) => void;
  onAdjustTime: (id: number, amount: number) => void;
  onSetEditing: (id: number | null) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}

export const SectionItem: React.FC<SectionItemProps> = ({
  section,
  index,
  isEditing,
  isDragged,
  onDelete,
  onUpdateName,
  onAdjustTime,
  onSetEditing,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const preventBlur = useRef(false);

  const handleAdjustTime = (amount: number) => {
    const currentMinutes = section.minutes;
    const roundedMinutes = Math.round(currentMinutes);
    // Ensure the target time is at least 1 minute
    const targetMinutes = Math.max(1, roundedMinutes + amount);
    const amountToAdjust = targetMinutes - currentMinutes;
    onAdjustTime(section.id, amountToAdjust);
  };

  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={`flex justify-between items-center bg-gray-700/50 p-3 rounded-md cursor-grab transition-opacity ${isDragged ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-grow">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {isEditing ? (
          <input
            type="text"
            value={section.name}
            onChange={(e) => onUpdateName(section.id, e.target.value)}
            onMouseDown={() => { preventBlur.current = true; }}
            onBlur={(e) => {
                if (preventBlur.current) {
                    preventBlur.current = false;
                    e.target.focus();
                    return;
                }
                onSetEditing(null);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            autoFocus
            className="font-medium bg-gray-600 rounded px-1 -ml-1 w-full text-white"
          />
        ) : (
          <span className="font-medium truncate cursor-pointer" title={section.name} onClick={() => onSetEditing(section.id)}>
            {section.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
              <div onBlur={() => {
                  if(preventBlur.current) {
                      preventBlur.current = false;
                      return;
                  }
                  onSetEditing(null)
              }} tabIndex={-1} className="flex items-center gap-1 sm:gap-2">
                  <button type="button" onClick={() => handleAdjustTime(-5)} onMouseDown={() => { preventBlur.current = true; }} className="hidden sm:inline-flex items-center justify-center w-8 h-8 text-lg font-bold bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors" aria-label="Decrement section time by five minutes">-5</button>
                  <button type="button" onClick={() => handleAdjustTime(-1)} onMouseDown={() => { preventBlur.current = true; }} className="inline-flex items-center justify-center w-8 h-8 text-2xl font-bold bg-gray-700 hover:bg-gray-600 rounded-full transition-colors" aria-label="Decrement section time by one minute">-</button>
                  <span className="text-gray-300 w-20 text-center tabular-nums">{section.minutes.toFixed(1)} min</span>
                  <button type="button" onClick={() => handleAdjustTime(1)} onMouseDown={() => { preventBlur.current = true; }} className="inline-flex items-center justify-center w-8 h-8 text-2xl font-bold bg-gray-700 hover:bg-gray-600 rounded-full transition-colors" aria-label="Increment section time by one minute">+</button>
                  <button type="button" onClick={() => handleAdjustTime(5)} onMouseDown={() => { preventBlur.current = true; }} className="hidden sm:inline-flex items-center justify-center w-8 h-8 text-lg font-bold bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors" aria-label="Increment section time by five minutes">+5</button>
              </div>
          ) : (
              <span className="text-gray-400 cursor-pointer px-2 py-1" onClick={() => onSetEditing(section.id)}>{section.minutes.toFixed(1)} min</span>
          )}
        <button onClick={() => onDelete(section.id)} className="text-red-400 hover:text-red-300 transition-colors ml-2">
          <TrashIcon />
        </button>
      </div>
    </li>
  );
};
