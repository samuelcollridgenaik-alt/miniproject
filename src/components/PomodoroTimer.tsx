import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

interface PomodoroTimerProps {
  compact?: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  compact = false,
}) => {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
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
          const ctx = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        } catch (e) {
          console.log("Audio notification played");
        }
      }

      if (mode === "work") {
        setCompletedSessions((c) => c + 1);
        setMode("break");
        setTimeLeft(5 * 60);
      } else {
        setMode("work");
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, soundEnabled]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = (newMode?: "work" | "break") => {
    setIsRunning(false);
    const targetMode = newMode || mode;
    setMode(targetMode);
    setTimeLeft(targetMode === "work" ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const totalDuration = mode === "work" ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(
    ((totalDuration - timeLeft) / totalDuration) * 100,
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-subtle border border-default transition">
        <span className={mode === "work" ? "text-warning" : "text-success"}>
          {mode === "work" ? "⏱️" : "☕"}
        </span>
        <span className="font-semibold text-primary">{timeFormatted}</span>
        <button
          onClick={toggleTimer}
          className="ui-control p-1 rounded hover:bg-black/5 hover:bg-elevated text-muted hover:text-primary transition"
          title={isRunning ? "Pause" : "Start Focus Sprint"}
        >
          {isRunning ? (
            <Pause className="w-3 h-3 text-warning" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg border border-default bg-surface text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          {mode === "work" ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>Deep Focus Sprint</span>
            </>
          ) : (
            <>
              <Coffee className="w-3.5 h-3.5 text-success" />
              <span>Rest Break</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="ui-control text-muted hover:text-primary p-0.5"
            title={soundEnabled ? "Mute chime" : "Enable chime"}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3" />
            ) : (
              <VolumeX className="w-3 h-3" />
            )}
          </button>
          <span className="text-[10px] text-muted font-mono px-1.5 py-0.5 rounded bg-black/5 bg-surface">
            #{completedSessions + 1}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono tracking-tight text-primary">
            {timeFormatted}
          </span>
          <span className="text-[10px] uppercase font-bold text-muted">
            {mode === "work" ? "25m" : "5m"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTimer}
            className={`ui-control px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition text-xs  ${
              isRunning
                ? "bg-warning-soft text-warning bg-warning-soft text-warning"
                : "bg-subtle text-on-accent hover:bg-elevated"
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
            aria-label="Reset"
            onClick={() => resetTimer()}
            className="ui-control p-1.5 rounded-md hover:bg-black/5 hover:bg-elevated text-muted transition"
            title="Reset"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 w-full bg-black/5 bg-surface h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            mode === "work" ? "bg-warning-solid" : "bg-success-solid"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
        <button
          onClick={() => resetTimer("work")}
          className={`ui-control hover:underline ${mode === "work" ? "font-bold text-primary" : ""}`}
        >
          25m Focus
        </button>
        <span>•</span>
        <button
          onClick={() => resetTimer("break")}
          className={`ui-control hover:underline ${mode === "break" ? "font-bold text-primary" : ""}`}
        >
          5m Break
        </button>
        <span>•</span>
        <span>{completedSessions} sprints completed this session</span>
      </div>
    </div>
  );
};
