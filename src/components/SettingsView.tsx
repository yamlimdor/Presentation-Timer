
import React, { useState, useMemo, useCallback } from 'react';
import type { Section } from '../../types';
import { RecalculateIcon } from '../../components/icons';
import { SectionItem } from './SectionItem';
import { TimeAdjuster } from './TimeAdjuster';

interface SavedSection {
  name: string;
  minutes: number;
}
interface Template {
  id: string;
  name: string;
  targetTotalMinutes: number;
  sections: SavedSection[];
}
interface SettingsViewProps {
  targetTotalMinutes: string;
  setTargetTotalMinutes: React.Dispatch<React.SetStateAction<string>>;
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  onStartPresentation: () => void;
  onViewHistory: () => void;
}

const formatTime = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds);
    const isOvertime = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isOvertime ? '+' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  targetTotalMinutes, setTargetTotalMinutes,
  sections, setSections,
  templates, setTemplates,
  onStartPresentation, onViewHistory
}) => {
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [newSectionMinutes, setNewSectionMinutes] = useState<string>('5');
  const [templateName, setTemplateName] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const adjustTargetTime = useCallback((amount: number) => {
    setTargetTotalMinutes(prev => String(Math.max(1, (parseInt(prev, 10) || 0) + amount)));
  }, [setTargetTotalMinutes]);

  const adjustNewSectionTime = useCallback((amount: number) => {
    setNewSectionMinutes(prev => String(Math.max(1, (parseInt(prev, 10) || 0) + amount)));
  }, []);

  const adjustSectionTime = useCallback((id: number, amount: number) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, minutes: Math.max(0.5, s.minutes + amount) } : s));
  }, [setSections]);

  const handleAddSection = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseFloat(newSectionMinutes);
    if (newSectionName && !isNaN(minutes) && minutes > 0) {
      setSections(prev => [...prev, { id: Date.now(), name: newSectionName, minutes }]);
      setNewSectionName('');
      setNewSectionMinutes('5');
    }
  }, [newSectionName, newSectionMinutes, setSections]);

  const handleUpdateSectionName = useCallback((id: number, newName: string) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, name: newName } : s)));
  }, [setSections]);

  const handleDeleteSection = useCallback((id: number) => {
    setSections(prev => prev.filter(s => s.id !== id));
  }, [setSections]);
  
  const handleDragStart = useCallback((index: number) => setDraggedIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLIElement>) => e.preventDefault(), []);
  const handleDragEnd = useCallback(() => setDraggedIndex(null), []);
  
  const handleDrop = useCallback((targetIndex: number) => {
      if (draggedIndex === null || draggedIndex === targetIndex) {
          setDraggedIndex(null);
          return;
      }
      setSections(prevSections => {
          const newSections = [...prevSections];
          const [draggedItem] = newSections.splice(draggedIndex, 1);
          if (draggedItem) newSections.splice(targetIndex, 0, draggedItem);
          return newSections;
      });
      setDraggedIndex(null);
  }, [draggedIndex, setSections]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) { alert('Please enter a template name.'); return; }
    const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateName.trim(),
        targetTotalMinutes: parseInt(targetTotalMinutes, 10) || 0,
        sections: sections.map(({ name, minutes }) => ({ name, minutes })),
    };
    const updatedTemplates = [...templates, newTemplate].sort((a, b) => a.name.localeCompare(b.name));
    setTemplates(updatedTemplates);
    setTemplateName('');
    setSelectedTemplateId(newTemplate.id);
  };

  const handleLoadTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const templateToLoad = templates.find(t => t.id === templateId);
    if (templateToLoad) {
        setTargetTotalMinutes(String(templateToLoad.targetTotalMinutes || ''));
        setSections(templateToLoad.sections.map((s, index) => ({ ...s, id: Date.now() + index })));
    }
  };
  
  const currentSectionsSum = useMemo(() => sections.reduce((sum, s) => sum + s.minutes, 0), [sections]);

  const handleRebalanceSections = useCallback(() => {
    const targetTotalTime = parseInt(targetTotalMinutes, 10);
    if (isNaN(targetTotalTime) || targetTotalTime <= 0) {
      alert('Please set a valid target time greater than 0.');
      return;
    }
    if (currentSectionsSum <= 0) {
      alert('Cannot rebalance with a current total time of zero.');
      return;
    }

    // Step 1: Calculate precise times and create a temporary array with rounded times
    const tempSections = sections.map(section => {
      const preciseTime = targetTotalTime * (section.minutes / currentSectionsSum);
      return {
        ...section,
        minutes: Math.round(preciseTime),
      };
    });

    // Step 2: Calculate the rounding error
    const tempSum = tempSections.reduce((sum, s) => sum + s.minutes, 0);
    const roundingError = targetTotalTime - tempSum;

    // Step 3: Correct the error if it exists
    if (roundingError !== 0 && tempSections.length > 0) {
      // Find the section with the longest original time to apply the correction
      let longestSectionIndex = -1;
      let maxMinutes = -1;
      sections.forEach((section, index) => {
        if (section.minutes > maxMinutes) {
          maxMinutes = section.minutes;
          longestSectionIndex = index;
        }
      });
      
      if (longestSectionIndex !== -1) {
        tempSections[longestSectionIndex].minutes += roundingError;
        // Ensure time is not negative after correction.
        if (tempSections[longestSectionIndex].minutes < 0) {
           tempSections[longestSectionIndex].minutes = 0;
        }
      }
    }
    
    // Step 4: Update the sections state
    setSections(tempSections);
  }, [sections, targetTotalMinutes, currentSectionsSum, setSections]);
  
  const timeDifference = useMemo(() => currentSectionsSum - (parseInt(targetTotalMinutes, 10) || 0), [currentSectionsSum, targetTotalMinutes]);
  const TimeDifferenceDisplay = () => {
    const roundedDiff = Math.abs(parseFloat(timeDifference.toFixed(1)));
    if (timeDifference < -0.01) return <span className="text-yellow-400">(Remaining: {roundedDiff} min)</span>;
    if (timeDifference > 0.01) return <span className="text-red-400">(Over: {roundedDiff} min)</span>;
    return <span className="text-green-400">(Target met ✓)</span>;
  };
  
  const totalSeconds = useMemo(() => sections.reduce((sum, s) => sum + s.minutes, 0) * 60, [sections]);
  const sectionMarkers = useMemo(() => {
    if (currentSectionsSum <= 0) return [];
    const markers: { position: number }[] = [];
    let cumulativeMinutes = 0;
    for (let i = 0; i < sections.length - 1; i++) {
        cumulativeMinutes += sections[i].minutes;
        markers.push({ position: (cumulativeMinutes / currentSectionsSum) * 100 });
    }
    return markers;
  }, [sections, currentSectionsSum]);

  const TimerDisplayPreview = (
    <div className="text-center">
      <p className="text-lg text-gray-400">Current Section</p>
      <h2 className="text-3xl font-bold text-teal-300 h-9 mb-4 truncate" title={sections[0]?.name || 'Ready'}>{sections[0]?.name || 'Ready'}</h2>
      <div className="my-6">
        <p className="text-2xl text-gray-400 mb-2">Section Time</p>
        <div className="text-8xl font-bold tracking-tighter text-white">{formatTime(sections[0]?.minutes * 60 || 0)}</div>
      </div>
      <div className="my-6">
        <p className="text-xl text-gray-400 mb-2">Total Time Left</p>
        <div className="text-6xl font-mono tracking-tighter text-gray-300">{formatTime(totalSeconds)}</div>
      </div>
      <div className="relative w-full bg-gray-700 rounded-full h-4 my-6">
        <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-4 rounded-full" style={{ width: `0%` }}></div>
        {sectionMarkers.map((marker, index) => (
            <div key={index} className="absolute top-0 bottom-0 w-0.5 bg-white opacity-75" style={{ left: `${marker.position}%` }} title={`End of section ${index + 1}`}></div>
        ))}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-8">
          <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2.5 rounded-full" style={{ width: `0%` }}></div>
      </div>
    </div>
  );

  return (
    <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-teal-300">Settings</h2>
            <div className="mb-6">
            <label id="target-time-label" className="block text-sm font-medium text-gray-300 mb-2 text-center">Target Presentation Time (minutes)</label>
            <div className="bg-gray-900/50 border border-gray-700 rounded-md p-2">
                <TimeAdjuster value={targetTotalMinutes} onAdjust={adjustTargetTime} label="Target Presentation Time" />
            </div>
            <div className="text-sm text-gray-400 mt-2 h-5 text-center">Current Sum: {currentSectionsSum.toFixed(1)} min <TimeDifferenceDisplay /></div>
            <div className="mt-4">
                <button onClick={handleRebalanceSections} disabled={currentSectionsSum <= 0} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Adjust all section times to match the target time while keeping proportions">
                    <RecalculateIcon className="h-5 w-5" />
                    <span>Rebalance Sections</span>
                </button>
            </div>
            </div>
            <div className="border-t border-gray-700 pt-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-teal-300">Templates</h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400" placeholder="Template Name" />
                    <button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
                </div>
                <div>
                    <label htmlFor="load-template" className="block text-sm font-medium text-gray-300 mb-2">Load Template</label>
                    <select id="load-template" value={selectedTemplateId} onChange={e => handleLoadTemplate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400">
                        <option value="">Select a template...</option>
                        {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold mb-4 text-teal-300">Sections</h3>
                <form onSubmit={handleAddSection} className="space-y-3 mb-4 p-4 bg-gray-700/30 rounded-lg">
                    <input type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} className="w-full h-10 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400" placeholder="New Section Name" />
                    <label className="sr-only">New Section Time (minutes)</label>
                    <TimeAdjuster value={newSectionMinutes} onAdjust={adjustNewSectionTime} label="New Section Time" />
                    <button type="submit" className="w-full h-10 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">Add Section</button>
                </form>
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {sections.map((section, index) => (
                        <SectionItem
                            key={section.id}
                            section={section}
                            index={index}
                            isEditing={editingSectionId === section.id}
                            onDelete={handleDeleteSection}
                            onUpdateName={handleUpdateSectionName}
                            onAdjustTime={adjustSectionTime}
                            onSetEditing={setEditingSectionId}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            isDragged={draggedIndex === index}
                        />
                    ))}
                </ul>
            </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700 lg:sticky lg:top-8 h-fit">
            {TimerDisplayPreview}
            <div className="mt-8 text-center space-y-4">
                <button onClick={onStartPresentation} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 text-lg">Start Presentation</button>
                <button onClick={onViewHistory} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 text-lg">View History</button>
            </div>
        </div>
    </main>
  );
};
