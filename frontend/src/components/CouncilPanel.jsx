import React, { useState } from 'react';
import { fetchCouncilReport } from '../services/api';

const CouncilPanel = ({ gameType, userKey = undefined }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState(null);

  const load = async (useLatest) => {
    if (!gameType) return;
    setLoading(true);
    setErr(null);
    try {
      const body = {
        use_latest: useLatest,
        user_key: userKey || undefined,
      };
      const { data } = await fetchCouncilReport(gameType, body);
      setReport(data.report);
    } catch (e) {
      setErr(e.response?.data?.detail || e.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const summary = report?.summary || {};

  return (
    <div className="bg-charcoal-800 rounded-xl border border-electric-500/20 p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-center mb-3">
        <h3 className="text-lg font-bold text-electric-300">AI council (advisory)</h3>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-electric-600 hover:bg-electric-500 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Summarize latest predictions'}
        </button>
      </div>
      <p className="text-xs text-silver-400 mb-3">
        Uses your LLM key on the server. Does not change ML models.
      </p>
      {err && <p className="text-red-400 text-sm">{String(err)}</p>}
      {report && (
        <div className="space-y-3 text-sm text-silver-200">
          {['agreement', 'outliers', 'historical_leader_models', 'caveats', 'ensemble_narrative'].map((k) =>
            summary[k] ? (
              <div key={k} className="border border-silver-700/50 rounded-lg p-3 bg-charcoal-900/40">
                <div className="text-orange-300 font-semibold capitalize mb-1">{k.replace(/_/g, ' ')}</div>
                <div className="whitespace-pre-wrap">{summary[k]}</div>
              </div>
            ) : null
          )}
          {report.overlap && (
            <details className="text-xs text-silver-500">
              <summary className="cursor-pointer text-silver-400">Overlap stats</summary>
              <pre className="mt-2 overflow-x-auto">{JSON.stringify(report.overlap, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default CouncilPanel;
