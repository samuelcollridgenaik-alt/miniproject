import React, { useState } from 'react';
import { X, Sparkles, Check, Zap, ExternalLink, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import { LLMProviderId, ProviderDiagnostic } from '../types.js';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: LLMProviderId;
  onSelectProvider: (provider: LLMProviderId) => void;
  geminiKey: string;
  onSaveGeminiKey: (key: string) => void;
  groqKey: string;
  onSaveGroqKey: (key: string) => void;
  providers: ProviderDiagnostic[];
  onRefreshDiagnostics: () => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
  onSelectProvider,
  geminiKey,
  onSaveGeminiKey,
  groqKey,
  onSaveGroqKey,
  providers,
  onRefreshDiagnostics,
}) => {
  const [inputGeminiKey, setInputGeminiKey] = useState(geminiKey);
  const [inputGroqKey, setInputGroqKey] = useState(groqKey);
  const [testStatus, setTestStatus] = useState<Record<string, { testing: boolean; success?: boolean; latencyMs?: number; message?: string }>>({});
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const geminiDiag = providers.find((p) => p.id === 'gemini');
  const geminiLiteDiag = providers.find((p) => p.id === 'gemini-lite');
  const isServerGeminiActive = geminiDiag?.status === 'online' || geminiLiteDiag?.status === 'online';

  const handleTestKey = async (provider: 'gemini' | 'groq') => {
    const keyToTest = provider === 'gemini' ? inputGeminiKey : inputGroqKey;
    if (!keyToTest.trim()) {
      setTestStatus((prev) => ({
        ...prev,
        [provider]: { testing: false, success: false, message: 'Please enter an API key first' },
      }));
      return;
    }

    setTestStatus((prev) => ({ ...prev, [provider]: { testing: true } }));

    try {
      const res = await fetch('/api/auth/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: keyToTest.trim() }),
      });
      const data = await res.json();
      if (data.success && data.result?.ok) {
        setTestStatus((prev) => ({
          ...prev,
          [provider]: {
            testing: false,
            success: true,
            latencyMs: data.result.latencyMs,
            message: `Connected successfully (${data.result.latencyMs}ms)`,
          },
        }));
      } else {
        setTestStatus((prev) => ({
          ...prev,
          [provider]: {
            testing: false,
            success: false,
            message: data.result?.message || data.error || 'Connection failed',
          },
        }));
      }
    } catch (err: any) {
      setTestStatus((prev) => ({
        ...prev,
        [provider]: { testing: false, success: false, message: err.message || 'Network test failed' },
      }));
    }
  };

  const handleSave = () => {
    onSaveGeminiKey(inputGeminiKey.trim());
    onSaveGroqKey(inputGroqKey.trim());
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onRefreshDiagnostics();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cognify AI Model & Engine Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                100% Free-Tier & Offline Compatible · No Forced Purchases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Active Model Selector */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-zinc-200 block mb-2">
              Primary Active Intelligence Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Gemini */}
              <button
                type="button"
                onClick={() => onSelectProvider('gemini')}
                className={`p-3 rounded-xl border text-left transition relative ${
                  activeProvider === 'gemini' || activeProvider === 'gemini-lite'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Google Gemini
                  </span>
                  {(activeProvider === 'gemini' || activeProvider === 'gemini-lite') && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
                  Flash-Lite (sub-second) & 3.8 Flash (Reasoning). 100% Free Tier on Google AI Studio.
                </p>
              </button>

              {/* Groq Llama */}
              <button
                type="button"
                onClick={() => onSelectProvider('groq')}
                className={`p-3 rounded-xl border text-left transition relative ${
                  activeProvider === 'groq'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Groq Llama 3.3
                  </span>
                  {activeProvider === 'groq' && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
                  High-speed inference on Llama 3.3 70B. Optional free API key.
                </p>
              </button>

              {/* Cognify Curriculum */}
              <button
                type="button"
                onClick={() => onSelectProvider('cognify-curriculum')}
                className={`p-3 rounded-xl border text-left transition relative ${
                  activeProvider === 'cognify-curriculum'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Offline Curriculum
                  </span>
                  {activeProvider === 'cognify-curriculum' && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
                  Built-in MCA syllabus engine. Zero API key needed, 100% uptime guarantee.
                </p>
              </button>
            </div>
          </div>

          {/* API Key Inputs */}
          <div className="space-y-4">
            {/* Google Gemini Key */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                  <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Google Gemini API Key (Free Tier)</span>
                </div>
                {isServerGeminiActive && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-medium border border-emerald-200 dark:border-emerald-800/50">
                    ✓ Connected via Server
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={inputGeminiKey}
                  onChange={(e) => setInputGeminiKey(e.target.value)}
                  placeholder={isServerGeminiActive ? "Using server key (or enter custom key here)..." : "AIzaSy..."}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleTestKey('gemini')}
                  disabled={testStatus['gemini']?.testing}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-700 hover:bg-slate-100 border border-slate-300 dark:border-zinc-600 text-slate-700 dark:text-white rounded-lg font-medium transition shrink-0"
                >
                  {testStatus['gemini']?.testing ? 'Testing...' : 'Test Key'}
                </button>
              </div>

              {testStatus['gemini']?.message && (
                <div
                  className={`text-[11px] ${
                    testStatus['gemini'].success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  }`}
                >
                  {testStatus['gemini'].message}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                <span>Free keys can be generated in 10 seconds with no credit card.</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Get Gemini Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Optional Groq Key */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Groq API Key (Optional)</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Optional for comparison arena
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={inputGroqKey}
                  onChange={(e) => setInputGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="flex-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleTestKey('groq')}
                  disabled={testStatus['groq']?.testing}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-700 hover:bg-slate-100 border border-slate-300 dark:border-zinc-600 text-slate-700 dark:text-white rounded-lg font-medium transition shrink-0"
                >
                  {testStatus['groq']?.testing ? 'Testing...' : 'Test Key'}
                </button>
              </div>

              {testStatus['groq']?.message && (
                <div
                  className={`text-[11px] ${
                    testStatus['groq'].success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  }`}
                >
                  {testStatus['groq'].message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
            {savedNotice ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Keys saved to browser session
              </span>
            ) : (
              <span>Keys are stored locally in your browser.</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
