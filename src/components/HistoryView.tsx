
import React, { useState, useMemo, useEffect } from 'react';
import type { HistoryEntry } from '../../types';
import { HistoryItem } from './HistoryItem';
import { HistoryDetailView } from './HistoryDetailView';

interface HistoryViewProps {
  history: HistoryEntry[];
  onBackToSettings: () => void;
  onDeleteHistory: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onBackToSettings, onDeleteHistory }) => {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Effect to select the first item on load or when the list changes after a delete
  useEffect(() => {
    if (history.length > 0 && !history.some(h => h.id === selectedHistoryId)) {
        setSelectedHistoryId(history[0].id);
    } else if (history.length === 0) {
        setSelectedHistoryId(null);
    }
  }, [history, selectedHistoryId]);

  const selectedHistory = useMemo(() => history.find(h => h.id === selectedHistoryId), [history, selectedHistoryId]);
  
  return (
    <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 text-purple-300">Presentation History</h2>
        {history.length > 0 ? (
          <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {history.map(h => (
              <HistoryItem
                key={h.id}
                history={h}
                isSelected={h.id === selectedHistoryId}
                onClick={() => setSelectedHistoryId(h.id)}
                onDelete={onDeleteHistory}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No history yet. Finish a presentation to see it here.</p>
        )}
        <div className="mt-6">
          <button onClick={onBackToSettings} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Back to Settings</button>
        </div>
      </div>
      
      <HistoryDetailView history={selectedHistory} />
    </main>
  );
};
