import React, { useState } from 'react';
import { TbMessages, TbPlayerPlay } from 'react-icons/tb';
import { fetchCouncilReport } from '../services/api';
import CardHeader from './ui/CardHeader';
import Notice from './ui/Notice';
import Spinner from './ui/Spinner';

const SECTIONS = [
  ['agreement', 'Where models agree'],
  ['outliers', 'Outliers'],
  ['historical_leader_models', 'Best track record so far'],
  ['caveats', 'Caveats'],
  ['ensemble_narrative', 'Summary'],
];

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
    <section className="card" aria-busy={loading}>
      <CardHeader
        icon={TbMessages}
        title="AI council"
        description="An LLM reads the latest picks from every model and writes up where they agree, where they don't, and what to be careful about. Advisory only."
        actions={
          <button type="button" onClick={() => load(true)} disabled={loading} className="btn-secondary btn-sm">
            {loading ? <Spinner className="h-4 w-4" /> : <TbPlayerPlay aria-hidden />}
            {loading ? 'Writing summary…' : report ? 'Run again' : 'Summarize latest picks'}
          </button>
        }
      />

      {err && (
        <Notice tone="error" title="Couldn't write the summary">
          {String(err)}
        </Notice>
      )}

      {report && (
        <div className="grid gap-3 text-sm md:grid-cols-2">
          {SECTIONS.map(([k, label]) =>
            summary[k] ? (
              <div key={k} className={`card-inset ${k === 'ensemble_narrative' ? 'md:col-span-2' : ''}`}>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-orange-300">{label}</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-silver-200">{summary[k]}</p>
              </div>
            ) : null
          )}
          {report.overlap && (
            <details className="text-xs text-silver-500 md:col-span-2">
              <summary className="inline-flex min-h-[36px] cursor-pointer items-center text-silver-400 hover:text-white">
                Overlap stats (raw)
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 font-mono">
                {JSON.stringify(report.overlap, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
};

export default CouncilPanel;
