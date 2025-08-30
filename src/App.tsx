
import React, { useState, useEffect, useCallback } from 'react';
import type { Section, HistoryEntry } from '../types';
import { SettingsView } from './components/SettingsView';
import { TimerView } from './components/TimerView';
import { HistoryView } from './components/HistoryView';

const HISTORY_STORAGE_KEY = 'presentationHistory';
const TEMPLATES_STORAGE_KEY = 'presentationTemplates';
const LAST_CONFIG_KEY = 'presentationLastConfig';

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

const App: React.FC = () => {
  const [view, setView] = useState<'settings' | 'timer' | 'history'>('settings');
  const [targetTotalMinutes, setTargetTotalMinutes] = useState<string>('60');
  const [sections, setSections] = useState<Section[]>([
    { id: 1, name: 'Introduction', minutes: 5 },
    { id: 2, name: 'Main Content', minutes: 45 },
    { id: 3, name: 'Conclusion & Q&A', minutes: 10 },
  ]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [initialSectionsForTimer, setInitialSectionsForTimer] = useState<Section[]>([]);

  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Ensure history is sorted by most recent first upon loading
        parsedHistory.sort((a: HistoryEntry, b: HistoryEntry) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
        setHistory(parsedHistory);
      }
      
      const lastConfig = localStorage.getItem(LAST_CONFIG_KEY);
      if (lastConfig) {
        const { sections: savedSections, targetTotalMinutes: savedTarget } = JSON.parse(lastConfig);
        if (savedSections) setSections(savedSections);
        if (savedTarget) setTargetTotalMinutes(savedTarget);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error("Failed to save templates to localStorage", error);
    }
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify({ sections, targetTotalMinutes }));
    } catch (error) {
      console.error("Failed to save last configuration", error);
    }
  }, [sections, targetTotalMinutes]);
  
  const handleStartPresentation = useCallback(() => {
    if (sections.reduce((sum, s) => sum + s.minutes, 0) <= 0) {
      alert('Please add at least one section with a time greater than 0.');
      return;
    }
    setInitialSectionsForTimer(JSON.parse(JSON.stringify(sections))); // Deep copy for timer isolation
    setView('timer');
  }, [sections]);
  
  const handleSectionsUpdate = useCallback((updatedSections: Section[]) => {
      setSections(updatedSections);
  }, []);

  const handleFinishPresentation = useCallback((historyEntry: HistoryEntry) => {
    const updatedHistory = [historyEntry, ...history]
      .sort((a,b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
    setHistory(updatedHistory);
    setView('settings');
  }, [history]);

  const handleDeleteHistory = useCallback((idToDelete: string) => {
    setHistory(prevHistory => prevHistory.filter(h => h.id !== idToDelete));
  }, []);
  
  const handleViewHistory = useCallback(() => {
    setView('history');
  }, []);
  
  const handleBackToSettings = useCallback(() => {
    setView('settings');
  }, []);

  const renderView = () => {
    switch(view) {
      case 'settings':
        return (
          <SettingsView
            targetTotalMinutes={targetTotalMinutes}
            setTargetTotalMinutes={setTargetTotalMinutes}
            sections={sections}
            setSections={setSections}
            templates={templates}
            setTemplates={setTemplates}
            onStartPresentation={handleStartPresentation}
            onViewHistory={handleViewHistory}
          />
        );
      case 'timer':
        return (
          <TimerView
            initialSections={initialSectionsForTimer}
            sections={sections}
            onSectionsUpdate={handleSectionsUpdate}
            onFinish={handleFinishPresentation}
            onBackToSettings={handleBackToSettings}
          />
        );
      case 'history':
        return (
          <HistoryView
            history={history}
            onBackToSettings={handleBackToSettings}
            onDeleteHistory={handleDeleteHistory}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500">
            Presentation Timer
          </h1>
        </header>
        {renderView()}
      </div>
    </div>
  );
};

export default App;
