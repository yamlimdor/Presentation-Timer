
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Section, TimerState, HistoryEntry } from '../../types';
import { PlayIcon, PauseIcon, ResetIcon, EnterFullscreenIcon, ExitFullscreenIcon } from '../../components/icons';

const formatTime = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds);
  const isOvertime = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  return `${isOvertime ? '+' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

interface TimerViewProps {
  initialSections: Section[];
  sections: Section[];
  onSectionsUpdate: (updatedSections: Section[]) => void;
  onFinish: (historyEntry: HistoryEntry) => void;
  onBackToSettings: () => void;
}

export const TimerView: React.FC<TimerViewProps> = ({ initialSections, sections, onSectionsUpdate, onFinish, onBackToSettings }) => {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  
  const initialTotalDurationSeconds = useMemo(() => initialSections.reduce((sum, s) => sum + s.minutes, 0) * 60, [initialSections]);

  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(initialTotalDurationSeconds);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [currentSectionSecondsLeft, setCurrentSectionSecondsLeft] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);
  
  const [isFlashing, setIsFlashing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  const triggerFlash = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);
  }, []);

  useEffect(() => {
    if (timerState !== 'running') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      return;
    }
    timerIntervalRef.current = window.setInterval(() => {
      setTotalSecondsLeft(prev => prev - 1);
      setCurrentSectionSecondsLeft(prev => prev - 1);
      setTotalElapsedTime(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState]);

  const handleToggleTimer = useCallback(() => {
    if (timerState === 'running') {
      setTimerState('paused');
    } else {
      if (timerState === 'idle') {
        if (initialTotalDurationSeconds <= 0 || initialSections.length === 0) {
          alert('Please add at least one section with a time greater than 0.');
          return;
        }
        onSectionsUpdate(JSON.parse(JSON.stringify(initialSections)));
        setTotalSecondsLeft(initialTotalDurationSeconds);
        setCurrentSectionIndex(0);
        setCurrentSectionSecondsLeft(Math.round(initialSections[0].minutes * 60));
        setTotalElapsedTime(0);
      }
      setTimerState('running');
    }
  }, [timerState, initialSections, initialTotalDurationSeconds, onSectionsUpdate]);

  const handleReset = useCallback(() => {
    setTimerState('idle');
    setTotalSecondsLeft(initialTotalDurationSeconds);
    setCurrentSectionIndex(0);
    setCurrentSectionSecondsLeft(0);
    setTotalElapsedTime(0);
    onSectionsUpdate(JSON.parse(JSON.stringify(initialSections)));
  }, [initialSections, initialTotalDurationSeconds, onSectionsUpdate]);

  const handleNextSection = useCallback(() => {
    if (timerState !== 'running' || currentSectionIndex >= sections.length - 1) return;

    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return;

    const originalDurationSeconds = currentSection.minutes * 60;
    const actualTimeSpentSeconds = originalDurationSeconds - currentSectionSecondsLeft;
    const surplusSeconds = currentSectionSecondsLeft; // Time saved (positive) or over (negative)

    const finalizedSections = [...sections];
    finalizedSections[currentSectionIndex] = {
        ...currentSection,
        minutes: Math.max(0, actualTimeSpentSeconds / 60),
    };

    const futureSections = finalizedSections.slice(currentSectionIndex + 1);
    const totalFutureTimeSeconds = futureSections.reduce((sum, s) => sum + s.minutes * 60, 0);

    if (totalFutureTimeSeconds > 0) {
        futureSections.forEach((section, index) => {
            const originalFutureSectionDuration = section.minutes * 60;
            const proportion = originalFutureSectionDuration / totalFutureTimeSeconds;
            const newDurationSeconds = originalFutureSectionDuration + surplusSeconds * proportion;
            finalizedSections[currentSectionIndex + 1 + index] = {
                ...section,
                minutes: Math.max(0, newDurationSeconds / 60)
            };
        });
    }
    
    onSectionsUpdate(finalizedSections);

    const nextIndex = currentSectionIndex + 1;
    triggerFlash();
    setCurrentSectionIndex(nextIndex);
    
    const nextSection = finalizedSections[nextIndex];
    if (nextSection) {
      setCurrentSectionSecondsLeft(Math.round(nextSection.minutes * 60));
    } else {
      setCurrentSectionSecondsLeft(0);
    }
  }, [timerState, currentSectionIndex, sections, currentSectionSecondsLeft, triggerFlash, onSectionsUpdate]);

  const executeFinish = useCallback(() => {
    setShowConfirmModal(false);
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
    
    const finalSectionsForHistory = [...sections];

    // When finishing, calculate the actual time spent on the current (and final) section.
    if (timerState !== 'idle' && finalSectionsForHistory[currentSectionIndex]) {
        const currentSection = finalSectionsForHistory[currentSectionIndex];
        // The duration this section started with (after any rebalancing).
        const rebalancedDurationSeconds = currentSection.minutes * 60;
        // The actual time spent is the starting time minus what's left.
        // This is consistent with how `handleNextSection` calculates time.
        const actualTimeSpentOnCurrentSectionSeconds = rebalancedDurationSeconds - currentSectionSecondsLeft;
        
        finalSectionsForHistory[currentSectionIndex] = {
            ...currentSection,
            minutes: Math.max(0, actualTimeSpentOnCurrentSectionSeconds / 60),
        };
    }
    
    const historyPayload: HistoryEntry = {
        id: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        details: initialSections.map((initial, index) => ({
            name: initial.name,
            plannedTime: initial.minutes,
            actualTime: timerState !== 'idle' && index <= currentSectionIndex 
                        ? (finalSectionsForHistory[index]?.minutes ?? 0) 
                        : 0,
        }))
    };
    
    onFinish(historyPayload);
  }, [sections, timerState, currentSectionIndex, currentSectionSecondsLeft, initialSections, onFinish]);

  const currentSectionName = timerState !== 'idle' && sections[currentSectionIndex] ? sections[currentSectionIndex].name : 'Ready';
  
  const progressPercentage = useMemo(() => {
    if (initialTotalDurationSeconds <= 0) return 0;
    return Math.min(100, (totalElapsedTime / initialTotalDurationSeconds) * 100);
  }, [totalElapsedTime, initialTotalDurationSeconds]);
  
  const currentSectionProgressPercentage = useMemo(() => {
    if (timerState === 'idle' || !sections[currentSectionIndex]) return 0;
    
    // Use the current (potentially rebalanced) section duration as the total
    const currentSectionDuration = sections[currentSectionIndex]?.minutes * 60 || 0;
    
    // If the section has no duration, it's considered 100% complete.
    if (currentSectionDuration <= 0) return 100;
    
    // Elapsed time is the total duration minus what's left.
    const elapsed = currentSectionDuration - currentSectionSecondsLeft;
    
    // Calculate percentage and clamp it between 0 and 100.
    return Math.min(100, Math.max(0, (elapsed / currentSectionDuration) * 100));
  }, [timerState, currentSectionIndex, sections, currentSectionSecondsLeft]);
  
  const sectionMarkers = useMemo(() => {
    if (initialTotalDurationSeconds <= 0) return [];
    const markers: { position: number }[] = [];
    let cumulativeSeconds = 0;
    for (let i = 0; i < sections.length - 1; i++) {
        cumulativeSeconds += sections[i].minutes * 60;
        markers.push({ position: (cumulativeSeconds / initialTotalDurationSeconds) * 100 });
    }
    return markers;
  }, [sections, initialTotalDurationSeconds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
            e.preventDefault();
            handleToggleTimer();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleTimer]);


  const TimerDisplay = (
    <div className="text-center">
      <p className="text-lg text-gray-400">Current Section</p>
      <h2 className="text-3xl font-bold text-teal-300 h-9 mb-4 truncate" title={currentSectionName}>{currentSectionName}</h2>
      
      <div className="my-6">
        <p className="text-2xl text-gray-400 mb-2">Section Time</p>
        <div className={`text-8xl font-bold tracking-tighter ${currentSectionSecondsLeft < 0 ? 'text-red-400' : 'text-white'}`}>
          {formatTime(currentSectionSecondsLeft)}
        </div>
      </div>
      
      <div className="my-6">
        <p className="text-xl text-gray-400 mb-2">Total Time Left</p>
        <div className={`text-6xl font-mono tracking-tighter ${totalSecondsLeft < 0 ? 'text-red-400' : 'text-gray-300'}`}>
          {formatTime(totalSecondsLeft)}
        </div>
      </div>

      <div className="relative w-full bg-gray-700 rounded-full h-4 my-6">
        <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        {sectionMarkers.map((marker, index) => (
            <div
                key={index}
                className="absolute top-0 bottom-0 w-0.5 bg-white opacity-75"
                style={{ left: `${marker.position}%` }}
                title={`End of section ${index + 1}`}
            ></div>
        ))}
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-8">
          <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${currentSectionProgressPercentage}%` }}></div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 ease-in-out ${isFlashing ? 'opacity-70' : 'opacity-0'}`}></div>
      
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full">
            <h2 id="modal-title" className="text-lg text-center mb-6">Are you sure you want to finish the presentation?</h2>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">Cancel</button>
              <button onClick={executeFinish} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">Yes, Finish</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex justify-center items-start pt-0 sm:pt-8">
        <div className="w-full max-w-3xl">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700">
                {TimerDisplay}

                {/* --- Responsive Controls Wrapper --- */}
                <div className="w-full flex flex-col items-center gap-4 mt-4">

                  {/* --- Primary Controls --- */}
                  <div className="w-full grid grid-cols-2 gap-3 sm:w-auto sm:flex sm:gap-3">
                    <button 
                      onClick={handleToggleTimer} 
                      className="flex flex-col sm:flex-row items-center gap-2 h-24 sm:h-auto sm:w-32 justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105" 
                      aria-label={timerState === 'running' ? 'Pause timer' : 'Start or resume timer'}>
                      {timerState === 'running' ? <PauseIcon className="h-8 w-8 sm:h-6 sm:w-6" /> : <PlayIcon className="h-8 w-8 sm:h-6 sm:w-6" />}
                      <span className="text-lg sm:text-base">{timerState === 'running' ? 'Pause' : (timerState === 'paused' ? 'Resume' : 'Start')}</span>
                    </button>

                    <button 
                      onClick={handleNextSection} 
                      disabled={timerState !== 'running' || currentSectionIndex >= sections.length - 1} 
                      className="flex flex-col sm:flex-row text-center items-center gap-2 h-24 sm:h-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                      title="Finish current section and rebalance for the next"
                    >
                      <span className="text-2xl sm:text-base">▶▶</span>
                      <span className="text-lg sm:text-base leading-tight">Next & Rebalance</span>
                    </button>
                  </div>
                  
                  {/* --- Secondary Controls --- */}
                  <div className="flex justify-center items-center flex-wrap gap-3">
                    <button onClick={handleReset} className="flex items-center gap-2 justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105" aria-label="Reset timer">
                      <ResetIcon className="h-5 w-5"/>
                      <span>Reset</span>
                    </button>

                    <button 
                      onClick={() => setShowConfirmModal(true)}
                      disabled={timerState === 'idle'}
                      className="flex items-center gap-2 justify-center bg-red-600 hover:red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                      title="Finish the presentation"
                    >
                        Finish
                    </button>
                    <button onClick={onBackToSettings} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-5 rounded-lg transition-colors">Back</button>
                    <button onClick={toggleFullscreen} className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                        {isFullscreen ? <ExitFullscreenIcon className="h-6 w-6" /> : <EnterFullscreenIcon className="h-6 w-6" />}
                    </button>
                  </div>
                </div>
            </div>
        </div>
      </main>
    </>
  );
};
