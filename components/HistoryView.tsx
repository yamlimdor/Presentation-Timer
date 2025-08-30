
import React, { useState, useMemo } from 'react';
import { HistoryEntry } from '../types';

const formatDecimalMinutes = (minutes: number): string => {
    const totalSeconds = minutes * 60;
    const roundSeconds = Math.round(totalSeconds);
    const mins = Math.floor(roundSeconds / 60);
    const secs = roundSeconds % 60;

    if (mins > 0 && secs > 0) {
        return `${mins}m ${secs}s`;
    }
    if (mins > 0) {
        return `${mins} min`;
    }
    if (secs === 0 && mins === 0) {
        return `-`;
    }
    return `${secs}s`;
};


interface HistoryViewProps {
  history: HistoryEntry[];
  onBackToSettings: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onBackToSettings }) => {
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(history[0]?.id || null);
  const selectedHistory = useMemo(() => history.find(h => h.id === selectedHistoryId), [history, selectedHistoryId]);

  return (
    <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Presentation History</h2>
            {history.length > 0 ? (
                <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                    {history.map(h => (
                        <li key={h.id}>
                            <button onClick={() => setSelectedHistoryId(h.id)} className={`w-full text-left p-3 rounded-md transition-colors ${selectedHistoryId === h.id ? 'bg-purple-800/50' : 'hover:bg-gray-700/50'}`}>
                                <span className="font-semibold">{new Date(h.finishedAt).toLocaleString()}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-400">No history yet. Finish a presentation to see it here.</p>
            )}
            <div className="mt-6">
                <button onClick={onBackToSettings} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Back to Settings</button>
            </div>
        </div>
        <div className="md:col-span-2 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">History Details</h2>
            {selectedHistory ? (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Finished at: {new Date(selectedHistory.finishedAt).toLocaleString()}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Section Name</th>
                                    <th scope="col" className="px-6 py-3 text-right">Planned Time</th>
                                    <th scope="col" className="px-6 py-3 text-right">Actual Time</th>
                                    <th scope="col" className="px-6 py-3 text-right">Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedHistory.details.map((detail, index) => {
                                    const difference = detail.actualTime - detail.plannedTime;
                                    const diffColor = Math.abs(difference) < 0.01 ? 'text-gray-400' : difference > 0 ? 'text-red-400' : 'text-green-400';
                                    return (
                                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/20">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{detail.name}</td>
                                        <td className="px-6 py-4 text-right">{formatDecimalMinutes(detail.plannedTime)}</td>
                                        <td className="px-6 py-4 text-right">{formatDecimalMinutes(detail.actualTime)}</td>
                                        <td className={`px-6 py-4 text-right font-semibold ${diffColor}`}>
                                            {Math.abs(difference) < 0.01 ? '-' : `${difference > 0 ? '+' : ''}${formatDecimalMinutes(Math.abs(difference))}`}
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                   <p className="text-gray-500">Select a history entry to see details.</p>
                </div>
            )}
        </div>
    </main>
  );
};
