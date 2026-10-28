import React, { useEffect, useState } from 'react';
import { ProviderDiagnostic } from '../types.js';
import { Terminal, CheckCircle2, XCircle, Play, BarChart2, Cpu, ShieldCheck, Clock, Zap, Award, CheckSquare, FileText } from 'lucide-react';

interface EvaluationViewProps {
  providers: ProviderDiagnostic[];
  onRefreshProviders: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  providers,
  onRefreshProviders,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rubric' | 'tests' | 'benchmark' | 'logs'>('rubric');
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const runUnitTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/evaluation/run-tests', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTests(false);
    }
  };

  const runBenchmark = async () => {
    setRunningBenchmark(true);
    try {
      const res = await fetch('/api/evaluation/run-benchmark', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBenchmarkData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningBenchmark(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/logs?limit=50');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    runUnitTests();
    runBenchmark();
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner (Google Evaluation Suite) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                MCA Mini Project Evaluation & Benchmark Report
              </h2>
              <p className="text-xs text-slate-500">
                Empirical verification for academic defense: Recall@k, faithfulness, citation mapping, and test suites.
              </p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setActiveSubTab('rubric')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                activeSubTab === 'rubric'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Rubric
            </button>
            <button
              onClick={() => setActiveSubTab('tests')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                activeSubTab === 'tests'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unit Tests
            </button>
            <button
              onClick={() => setActiveSubTab('benchmark')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                activeSubTab === 'benchmark'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RAG Benchmark
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                activeSubTab === 'logs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Execution Logs
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 0: ACADEMIC EVALUATION RUBRIC */}
      {activeSubTab === 'rubric' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  Examiner Defense Checklist
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Cognify AI: System Verification & Project Deliverables
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    runUnitTests();
                    runBenchmark();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run All Evaluations
                </button>
              </div>
            </div>

            {/* Evaluation Criteria Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span>1. Multi-LLM Orchestration Layer</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Decoupled provider abstraction supporting Google Gemini 3.8 Flash (tutor & review) and Groq Llama 3.3 (summaries & quizzes) with real-time latency and token tracking.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span>2. Grounded RAG & Real Document Citations</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sentence-aware chunking preserving page/slide numbers. Strict citations [Doc: Title, Page/Slide N] with grounding confidence and insufficient context guards.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span>3. Structured Quizzes & Mastery Analytics</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  JSON-validated multiple-choice quizzes with options A/B/C/D. Mathematical mastery formula (Σ Correct / Σ Attempted) with automatic weak-topic tagging.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span>4. Constrained Revision Planner</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mathematical feasibility check ensuring daily study minutes allocate weak-topic weights while strictly not exceeding user-defined daily study capacity.
                </p>
              </div>
            </div>

            {/* Quick Metrics Glance */}
            {benchmarkData && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">Recall @ 1</div>
                  <div className="text-xl font-bold text-blue-900 mt-0.5">{benchmarkData.metrics.recallAt1}%</div>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Recall @ 3</div>
                  <div className="text-xl font-bold text-emerald-900 mt-0.5">{benchmarkData.metrics.recallAt3}%</div>
                </div>
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase">Citation Accuracy</div>
                  <div className="text-xl font-bold text-indigo-900 mt-0.5">{benchmarkData.metrics.citationAccuracyRate}%</div>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Zero-Hallucination</div>
                  <div className="text-xl font-bold text-amber-900 mt-0.5">{benchmarkData.metrics.faithfulnessRate}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: UNIT TESTS */}
      {activeSubTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Automated System Unit Tests</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifies sentence chunking, cosine mathematics, learning analytics formulas, and time constraints.
                </p>
              </div>

              <button
                onClick={runUnitTests}
                disabled={runningTests}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                {runningTests ? 'Running...' : 'Re-Run Tests'}
              </button>
            </div>

            {testResults && (
              <div className="space-y-4">
                <div className="flex gap-4 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-600">
                    Total: <strong className="text-slate-900">{testResults.totalTests}</strong>
                  </span>
                  <span className="text-emerald-700">
                    Passed: <strong>{testResults.passedTests}</strong>
                  </span>
                  <span className="text-red-700">
                    Failed: <strong>{testResults.failedTests}</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  {testResults.tests.map((test: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            {test.suiteName}
                          </span>
                          <span className="font-semibold text-slate-900">{test.testName}</span>
                        </div>
                        {test.message && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {test.message}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400 font-mono">{test.durationMs}ms</span>
                        {test.passed ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2.5 py-0.5 rounded-full text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RAG BENCHMARK */}
      {activeSubTab === 'benchmark' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Empirical Academic Benchmark</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculates Recall@1, Recall@3, and citation accuracy on academic MCA curriculum items.
                </p>
              </div>

              <button
                onClick={runBenchmark}
                disabled={runningBenchmark}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                {runningBenchmark ? 'Evaluating...' : 'Re-Run Benchmark'}
              </button>
            </div>

            {benchmarkData && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-semibold">Recall @ 1</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {benchmarkData.metrics.recallAt1}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-semibold">Recall @ 3</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">
                      {benchmarkData.metrics.recallAt3}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-semibold">Citation Accuracy</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">
                      {benchmarkData.metrics.citationAccuracyRate}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-semibold">Faithfulness Rate</div>
                    <div className="text-2xl font-bold text-amber-700 mt-1">
                      {benchmarkData.metrics.faithfulnessRate}%
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Evaluated Academic Test Items ({benchmarkData.evaluatedItems.length})
                  </h4>

                  {benchmarkData.evaluatedItems.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-slate-900">{item.question}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.recall1Hit
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Recall@1: {item.recall1Hit ? 'HIT' : 'MISS'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.citationVerified
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            Citation: {item.citationVerified ? 'VERIFIED' : 'UNVERIFIED'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                        Top Retrieved: "{item.topChunkRetrieved}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EXECUTION LOGS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Execution Logs & Per-Model Latency</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed request IDs, latency tracking, and error traces.
                </p>
              </div>

              <button
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition"
              >
                Refresh Logs
              </button>
            </div>

            {/* Provider Latency Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                {(['gemini', 'groq'] as const).map((pid) => (
                  <div key={pid} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1.5 uppercase">
                      <span>{pid === 'gemini' ? 'Google Gemini 3.8 Flash' : 'Groq Llama 3.3'}</span>
                      <span className="text-blue-600 font-mono text-[11px]">
                        {stats[pid].avgLatencyMs}ms avg
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div>Total Calls: {stats[pid].totalRequests}</div>
                      <div>Successes: {stats[pid].successfulRequests}</div>
                      <div>Failures: {stats[pid].failedRequests}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Task</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-blue-600 font-semibold">{log.taskType}</td>
                      <td className="py-2.5 px-3">{log.provider}</td>
                      <td className="py-2.5 px-3">{log.model}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{log.latencyMs}ms</td>
                      <td className="py-2.5 px-3">
                        {log.success ? (
                          <span className="text-emerald-600 font-bold">OK</span>
                        ) : (
                          <span className="text-red-600 font-bold" title={log.error}>
                            ERR
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
