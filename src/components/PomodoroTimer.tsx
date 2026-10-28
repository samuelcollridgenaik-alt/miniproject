import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface PomodoroTimerProps {
  compact?: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ compact = false }) => {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(2);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        } catch (e) {
          console.log('Audio notification played');
        }
      }

      if (mode === 'work') {
        setCompletedSessions((c) => c + 1);
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, soundEnabled]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = (newMode?: 'work' | 'break') => {
    setIsRunning(false);
    const targetMode = newMode || mode;
    setMode(targetMode);
    setTimeLeft(targetMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const totalDuration = mode === 'work' ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#f1f1ef] dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] transition">
        <span className={mode === 'work' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
          {mode === 'work' ? '⏱️' : '☕'}
        </span>
        <span className="font-semibold text-[#37352f] dark:text-[#e3e2e0]">{timeFormatted}</span>
        <button
          onClick={toggleTimer}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#787774] hover:text-[#37352f] dark:hover:text-[#ffffff] transition"
          title={isRunning ? 'Pause' : 'Start Focus Sprint'}
        >
          {isRunning ? <Pause className="w-3 h-3 text-amber-600" /> : <Play className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg border border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#202020] text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-[#e3e2e0]">
          {mode === 'work' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Deep Focus Sprint</span>
            </>
          ) : (
            <>
              <Coffee className="w-3.5 h-3.5 text-emerald-500" />
              <span>Rest Break</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white p-0.5"
            title={soundEnabled ? 'Mute chime' : 'Enable chime'}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
          <span className="text-[10px] text-[#9b9a97] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
            #{completedSessions + 1}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono tracking-tight text-[#37352f] dark:text-white">
            {timeFormatted}
          </span>
          <span className="text-[10px] uppercase font-bold text-[#9b9a97]">
            {mode === 'work' ? '25m' : '5m'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTimer}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition text-xs shadow-2xs ${
              isRunning
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                : 'bg-[#2383e2] text-white hover:bg-[#1d6fc2]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3 h-3" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Start
              </>
            )}
          </button>

          <button
            onClick={() => resetTimer()}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] dark:text-[#9b9a97] transition"
            title="Reset"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            mode === 'work' ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-[#9b9a97]">
        <button
          onClick={() => resetTimer('work')}
          className={`hover:underline ${mode === 'work' ? 'font-bold text-[#37352f] dark:text-white' : ''}`}
        >
          25m Focus
        </button>
        <span>•</span>
        <button
          onClick={() => resetTimer('break')}
          className={`hover:underline ${mode === 'break' ? 'font-bold text-[#37352f] dark:text-white' : ''}`}
        >
          5m Break
        </button>
        <span>•</span>
        <span>{completedSessions} sprints logged today</span>
      </div>
    </div>
  );
};
