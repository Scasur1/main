'use client';

import { useState } from 'react';

const BLUEPRINTS = [
  { id: 'M0', name: 'Inbound Webhook Engine' },
  { id: 'M1', name: 'Minute 0 Engine' },
  { id: 'M2', name: 'Daily Engine' },
  { id: 'M3', name: 'Reply Detector' },
  { id: 'M4', name: 'Daily Digest Engine' },
  { id: 'M5', name: 'Preflight Validator' },
  { id: 'M6', name: 'KPI Refresh Job' },
];

const STEPS = [
  'Validating your Notion token...',
  'Searching for your databases...',
  'Finding Main Config page...',
  'Personalizing blueprints...',
  'Done! Your blueprints are ready.',
];

export default function Home() {
  const [token, setToken] = useState('');
  const [selected, setSelected] = useState(BLUEPRINTS.map(b => b.id));
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const allSelected = selected.length === BLUEPRINTS.length;

  function toggleAll() {
    setSelected(allSelected ? [] : BLUEPRINTS.map(b => b.id));
  }

  function toggleOne(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function downloadBlueprint(id, jsonString) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadAllAsZip(blueprints) {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const [id, jsonString] of Object.entries(blueprints)) {
      zip.file(`${id}.json`, jsonString);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blueprints.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setStep(0);

    if (!token.startsWith('ntn_')) {
      setError('Please enter a valid Notion Integration Token (starts with ntn_)');
      return;
    }

    if (selected.length === 0) {
      setError('Please select at least one blueprint.');
      return;
    }

    setLoading(true);

    // Simulate step progress
    setStep(0);
    const stepTimer1 = setTimeout(() => setStep(1), 800);
    const stepTimer2 = setTimeout(() => setStep(2), 2000);
    const stepTimer3 = setTimeout(() => setStep(3), 3500);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionToken: token, selectedBlueprints: selected }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'An unexpected error occurred.');
        setLoading(false);
        return;
      }

      setStep(4);
      setResult(data);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Blueprint Personalizer</h1>
        <p className="text-slate-400">
          Personalize your Make.com blueprints with your Notion database IDs
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Token Input */}
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-1">
            Notion Integration Token
          </label>
          <div className="relative">
            <input
              id="token"
              type="password"
              placeholder="ntn_..."
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Your token is never stored
          </p>
        </div>

        {/* Blueprint Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Select Blueprints</span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2">
            {BLUEPRINTS.map(bp => (
              <label
                key={bp.id}
                className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 border border-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(bp.id)}
                  onChange={() => toggleOne(bp.id)}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-sm text-white font-mono">{bp.id}</span>
                <span className="text-sm text-slate-400">— {bp.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Blueprints'}
        </button>
      </form>

      {/* Loading Steps */}
      {loading && (
        <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="space-y-2">
            {STEPS.map((text, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${i <= step ? 'text-white' : 'text-slate-600'}`}>
                {i < step ? (
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : i === step ? (
                  <svg className="w-4 h-4 text-blue-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 shrink-0" />
                )}
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <p className="text-red-500/70 text-xs mt-1">
            Make sure your Notion Integration Token is correct and that you have shared all 4 databases with the integration.
          </p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Summary */}
          <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-green-400 font-medium text-sm mb-2">Blueprints generated successfully!</p>
            <div className="space-y-1">
              {result.summary.databasesFound.map(name => (
                <div key={name} className="flex items-center gap-2 text-sm text-green-300">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {name}
                </div>
              ))}
              {result.summary.mainConfigPageFound && (
                <div className="flex items-center gap-2 text-sm text-green-300">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Main Config Page
                </div>
              )}
            </div>
            <p className="text-green-400/70 text-xs mt-2">
              {result.summary.totalReplacements} replacements made
            </p>
          </div>

          {/* Download Buttons */}
          <div className="space-y-2">
            {Object.entries(result.blueprints).map(([id, json]) => (
              <button
                key={id}
                onClick={() => downloadBlueprint(id, json)}
                className="w-full flex items-center justify-between px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <span className="text-sm text-white font-mono">{id}.json</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            ))}
          </div>

          {/* Download All */}
          <button
            onClick={() => downloadAllAsZip(result.blueprints)}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Download All as ZIP
          </button>
        </div>
      )}
    </main>
  );
}
