import React from 'react';
import { ProviderDiagnostic } from '../types.js';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DiagnosticsBannerProps {
  providers: ProviderDiagnostic[];
}

export const DiagnosticsBanner: React.FC<DiagnosticsBannerProps> = ({ providers }) => {
  const unconfigured = providers.filter((p) => p.status === 'unconfigured');
  const errors = providers.filter((p) => p.status === 'error');

  if (unconfigured.length === 0 && errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium">
            Provider Notice: {unconfigured.map((p) => p.name).join(', ')} is unconfigured. Google Gemini API is active as primary RAG orchestrator.
          </span>
        </div>
        <span className="text-[11px] text-amber-700 hidden sm:inline">
          Academic Integrity: Calls are never fabricated.
        </span>
      </div>
    </div>
  );
};
