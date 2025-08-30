import React, { useCallback } from 'react';
import type { HistoryEntry } from '../../types';
import { TrashIcon } from '../../components/icons';

interface HistoryItemProps {
  history: HistoryEntry;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ history, isSelected, onClick, onDelete }) => {

  const handleDelete = useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the onClick of the parent from firing
    onDelete(history.id);
  }, [history.id, onDelete]);

  return (
    <li
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md transition-colors flex justify-between items-center cursor-pointer ${isSelected ? 'bg-purple-800/50' : 'hover:bg-gray-700/50'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onClick()}}
    >
      <span className="font-semibold truncate pr-2">{new Date(history.finishedAt).toLocaleString()}</span>
      <button
        onClick={handleDelete}
        className="flex-shrink-0 text-red-500 hover:text-red-400 transition-colors p-1"
        aria-label={`Delete the history entry from ${new Date(history.finishedAt).toLocaleString()}`}
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </li>
  );
};
