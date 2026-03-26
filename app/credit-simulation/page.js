'use client';

import { useState, useMemo } from 'react';

/*
 * Make.com Credit Simulation for Revenue Recovery Engine
 *
 * Billing rules:
 *  - 1 module execution = 1 operation (op)
 *  - Routers are FREE (0 ops)
 *  - Aggregators count as 1 op for the output bundle
 *  - When a search returns N items, downstream modules run N times
 *
 * Scenario map (happy paths):
 *  M0: Webhook intake        → runs 1× per new lead
 *  M1: Minute-0 processing   → runs 1× per new lead (AI draft)
 *  M2: Daily follow-up engine → runs daily for each ACTIVE lead
 *  M3: Reply detector         → runs per incoming reply
 *  M4: Daily digest           → runs 1× per day (fixed)
 *  M5: Preflight check        → runs 1× per day (fixed)
 *  M6: KPI refresh            → runs 1× per day (fixed)
 */

const SCENARIOS = {
  M0: {
    name: 'M0 — Webhook (Lead Intake)',
    description: 'Yeni lead geldiginde tetiklenir. Webhook → Ayar kontrolu → Duplicate check → Lead olustur.',
    trigger: 'per_lead',
    paths: {
      happy: {
        label: 'Yeni Lead (Basarili)',
        ops: 4, // Webhook + N1 Settings + N4 Dup Check + N5 Create Lead
        modules: ['Webhook (1)', 'N1 Settings (1)', 'N4 Dup Check (1)', 'N5 Create Lead (1)'],
      },
      duplicate: {
        label: 'Duplicate Lead',
        ops: 4, // Webhook + N1 + N4 + N6 Dup Log
        modules: ['Webhook (1)', 'N1 Settings (1)', 'N4 Dup Check (1)', 'N6 Dup Log (1)'],
      },
      spam: {
        label: 'Gecersiz Token / Spam',
        ops: 3, // Webhook + N1 + N3 Invalid
        modules: ['Webhook (1)', 'N1 Settings (1)', 'N3 Invalid Log (1)'],
      },
    },
  },
  M1: {
    name: 'M1 — Minute 0 (Ilk Islem)',
    description: 'Yeni leadleri bulur, AI ile kisisellestirilmis ilk email taslagi olusturur.',
    trigger: 'per_lead',
    paths: {
      happy_ai: {
        label: 'AI Mode ON (Basarili)',
        ops: 10, // N1 + SetVars + N4 Find + N8 DupCheck + A1 AI + A2 AI + ParseJSON + N13 Refresh + G2 Gmail + N16 Update
        modules: [
          'N1 Settings (1)', 'Set Variables (1)', 'N4 Find NEW (1)', 'N8 Dup Check (1)',
          'A1 AI Inference (1)', 'A2 AI Message (1)', 'Parse JSON (1)',
          'N13 Refresh (1)', 'G2 Gmail Draft (1)', 'N16 Update (1)',
        ],
      },
      happy_noai: {
        label: 'AI Mode OFF (Template)',
        ops: 6, // N1 + SetVars + N4 + N8 + G1 Gmail + N11 Update
        modules: [
          'N1 Settings (1)', 'Set Variables (1)', 'N4 Find NEW (1)',
          'N8 Dup Check (1)', 'G1 Gmail Draft (1)', 'N11 Update (1)',
        ],
      },
      duplicate: {
        label: 'Duplicate Yakalandi',
        ops: 5, // N1 + SetVars + N4 + N8 + N9 Update + N10 Log
        modules: [
          'N1 Settings (1)', 'Set Variables (1)', 'N4 Find NEW (1)',
          'N9 Dup Update (1)', 'N10 Dup Log (1)',
        ],
      },
    },
  },
  M2: {
    name: 'M2 — Daily Engine (Takip)',
    description: 'Her gun aktif leadlere AI ile follow-up email taslagi olusturur.',
    trigger: 'per_active_lead_per_day',
    fixedPerRun: 3, // N1 + SetVars + N4 Find Active (runs once per execution)
    paths: {
      happy: {
        label: 'Follow-up (Basarili)',
        ops: 7, // G1 FindDraft + A1 AI + A2 AI + N11 Refresh + G2 Draft + Delay + N14 Update
        modules: [
          'G1 Find Draft (1)', 'A1 AI Inference (1)', 'A2 AI Message (1)',
          'N11 Refresh (1)', 'G2 Create Draft (1)', 'Calculate Delay (1)', 'N14 Update (1)',
        ],
      },
      max_step: {
        label: 'Limit Reached (Kapandi)',
        ops: 2, // N5 Close + N6 Log
        modules: ['N5 Close Lead (1)', 'N6 Log Complete (1)'],
      },
    },
  },
  M3: {
    name: 'M3 — Reply Detector',
    description: 'Gelen email yanıtlarini izler, AI ile niyetini analiz eder (pozitif/OOO/opt-out).',
    trigger: 'per_reply',
    paths: {
      positive: {
        label: 'Pozitif / Objection Yanit',
        ops: 7, // G1 Watch + N1 Find + N4 Settings + SetVars + A1 Intent + N13 Update + N14 Log
        modules: [
          'G1 Watch (1)', 'N1 Find Client (1)', 'N4 Settings (1)',
          'Set Variables (1)', 'A1 AI Intent (1)', 'N13 Update (1)', 'N14 Log (1)',
        ],
      },
      ooo: {
        label: 'Out of Office',
        ops: 7,
        modules: [
          'G1 Watch (1)', 'N1 Find Client (1)', 'N4 Settings (1)',
          'Set Variables (1)', 'A1 AI Intent (1)', 'N8 Update OOO (1)', 'N11 Log (1)',
        ],
      },
      optout: {
        label: 'Opt-Out / Unsubscribe',
        ops: 7,
        modules: [
          'G1 Watch (1)', 'N1 Find Client (1)', 'N4 Settings (1)',
          'Set Variables (1)', 'A1 AI Intent (1)', 'N12 Update (1)', 'N15 Log (1)',
        ],
      },
      bounce: {
        label: 'Bounce',
        ops: 4, // G1 + N1 + N2 Update + N3 Log
        modules: ['G1 Watch (1)', 'N1 Find Client (1)', 'N2 Pause (1)', 'N3 Log (1)'],
      },
    },
  },
  M4: {
    name: 'M4 — Daily Digest',
    description: 'Gunluk ozet emaili gonderir (taslaklardan, yanitlardan, hatalardan).',
    trigger: 'daily_fixed',
    paths: {
      happy: {
        label: 'Normal Calisma',
        ops: 15,
        modules: [
          'N1 Settings (1)', 'N2 Drafts (1)', 'Count Drafts (1)', 'Set DraftCount (1)',
          'N3 Replies (1)', 'Merge Names (1)', 'Set ReplyNames (1)',
          'N4 Reply Logs (1)', 'Count Replies (1)', 'Set ReplyCount (1)',
          'N5 Errors (1)', 'Count Errors (1)', 'Set ErrorCount (1)',
          'Get All Vars (1)', 'G5 Send Email (1)',
        ],
      },
    },
  },
  M5: {
    name: 'M5 — Preflight',
    description: 'Sistem sagligi kontrolu yapar (config, sandbox, Gmail baglantisi).',
    trigger: 'daily_fixed',
    paths: {
      happy: {
        label: 'Basarili Kontrol',
        ops: 7, // N1 + N2 + SetVars + N5 Find Test + G1 Gmail + N10 Log + N11 KPI
        modules: [
          'N1 Settings (1)', 'N2 Find KPI (1)', 'Set Variables (1)',
          'N5 Find Test (1)', 'G1 Gmail Test (1)', 'N10 Log Success (1)', 'N11 Update KPI (1)',
        ],
      },
    },
  },
  M6: {
    name: 'M6 — KPI Refresh',
    description: 'Aktif, takip, durdurulmus ve yanitlanan lead metriklerini gunceller.',
    trigger: 'daily_fixed',
    paths: {
      happy: {
        label: 'Normal Calisma',
        ops: 17, // N1 + (N3+Count+N4+N5) + (N6+Count+N7+N8) + (N9+Count+N10+N11) + (N12+Count+N13+N14)
        modules: [
          'N1 Settings (1)', 'N3 Active Search (1)', 'Count Active (1)',
          'N4 Find KPI (1)', 'N5 Update KPI (1)', 'N6 Today Search (1)',
          'Count Today (1)', 'N7 Find KPI (1)', 'N8 Update KPI (1)',
          'N9 Paused Search (1)', 'Count Paused (1)', 'N10 Find KPI (1)',
          'N11 Update KPI (1)', 'N12 Replied Search (1)', 'Count Replied (1)',
          'N13 Find KPI (1)', 'N14 Update KPI (1)',
        ],
      },
    },
  },
};

const MAKE_PLANS = [
  { name: 'Free', ops: 1000, price: 0, currency: 'USD' },
  { name: 'Core', ops: 10000, price: 10.59, currency: 'USD' },
  { name: 'Pro', ops: 10000, price: 18.82, currency: 'USD' },
  { name: 'Teams', ops: 10000, price: 34.12, currency: 'USD' },
  { name: 'Enterprise', ops: 10000, price: null, currency: 'USD' },
];

function formatNumber(n) {
  return n.toLocaleString('tr-TR');
}

function ScenarioCard({ id, scenario, expanded, onToggle }) {
  const mainPath = Object.values(scenario.paths)[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
      >
        <div>
          <span className="font-semibold text-gray-900">{scenario.name}</span>
          <p className="text-sm text-gray-500 mt-0.5">{scenario.description}</p>
        </div>
        <span className="text-gray-400 text-xl ml-4">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100">
          <div className="mt-3 space-y-3">
            {Object.entries(scenario.paths).map(([key, path]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{path.label}</span>
                  <span className="text-sm font-bold text-purple-600">{path.ops} ops</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {path.modules.map((mod, i) => (
                    <span
                      key={i}
                      className="inline-block bg-white border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-600"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {scenario.fixedPerRun && (
            <p className="mt-2 text-xs text-amber-600">
              + Her calistirmada sabit {scenario.fixedPerRun} ops (ayar yuklemesi)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PlanRecommendation({ totalMonthly }) {
  const suitable = MAKE_PLANS.filter(
    (p) => p.ops !== null && p.ops >= totalMonthly
  );
  const extraOpsNeeded = (plan) => Math.max(0, totalMonthly - plan.ops);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Make.com Plan Onerisi</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MAKE_PLANS.filter((p) => p.price !== null).map((plan) => {
          const extra = extraOpsNeeded(plan);
          const fits = extra === 0;
          const extraCost = Math.ceil(extra / 10000) * (plan.name === 'Free' ? 0 : 10);
          return (
            <div
              key={plan.name}
              className={`rounded-lg border-2 p-4 ${
                fits
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="font-semibold text-gray-900">{plan.name}</div>
              <div className="text-sm text-gray-500">
                {formatNumber(plan.ops)} ops/ay — ${plan.price}/ay
              </div>
              {fits ? (
                <div className="mt-2 text-sm text-green-700 font-medium">Yeterli</div>
              ) : (
                <div className="mt-2 text-sm text-red-600">
                  {formatNumber(extra)} ops eksik
                  {plan.name !== 'Free' && (
                    <span className="block text-xs text-gray-500">
                      ~${extraCost} ek maliyet (10K ops paket)
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CreditSimulationPage() {
  // Inputs
  const [leadsPerMonth, setLeadsPerMonth] = useState(100);
  const [followUpDays, setFollowUpDays] = useState(5);
  const [replyRate, setReplyRate] = useState(20);
  const [bounceRate, setBounceRate] = useState(5);
  const [duplicateRate, setDuplicateRate] = useState(10);
  const [aiMode, setAiMode] = useState(true);
  const [daysInMonth, setDaysInMonth] = useState(30);

  // Expanded scenario cards
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (id) =>
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));

  const simulation = useMemo(() => {
    const leads = leadsPerMonth;
    const uniqueLeads = Math.round(leads * (1 - duplicateRate / 100));
    const duplicateLeads = leads - uniqueLeads;
    const repliedLeads = Math.round(uniqueLeads * (replyRate / 100));
    const bouncedLeads = Math.round(uniqueLeads * (bounceRate / 100));
    const activeLeads = uniqueLeads - repliedLeads - bouncedLeads;

    // M0: Per lead intake
    const m0_unique = uniqueLeads * SCENARIOS.M0.paths.happy.ops;
    const m0_duplicate = duplicateLeads * SCENARIOS.M0.paths.duplicate.ops;
    const m0_total = m0_unique + m0_duplicate;

    // M1: Per new unique lead
    const m1_path = aiMode ? SCENARIOS.M1.paths.happy_ai : SCENARIOS.M1.paths.happy_noai;
    const m1_total = uniqueLeads * m1_path.ops;

    // M2: Daily engine — runs daily for active leads
    // Average active lead stays active for followUpDays days
    // Total lead-days = uniqueLeads * followUpDays (simplified)
    // But some leads reply or bounce partway through, so we adjust:
    // - Leads that reply: average followUpDays/2 days active before reply
    // - Leads that bounce: average 1 day active
    // - Leads that complete sequence: followUpDays days active
    const leadDays_replied = repliedLeads * Math.ceil(followUpDays / 2);
    const leadDays_bounced = bouncedLeads * 1;
    const leadDays_completed = activeLeads * followUpDays;
    const totalLeadDays = leadDays_replied + leadDays_bounced + leadDays_completed;
    const m2_fixed = daysInMonth * SCENARIOS.M2.fixedPerRun; // Fixed ops per daily run
    const m2_perLead = totalLeadDays * SCENARIOS.M2.paths.happy.ops;
    const m2_total = m2_fixed + m2_perLead;

    // M3: Reply detector — per reply
    const m3_replied = repliedLeads * SCENARIOS.M3.paths.positive.ops;
    const m3_bounced = bouncedLeads * SCENARIOS.M3.paths.bounce.ops;
    const m3_total = m3_replied + m3_bounced;

    // Fixed daily scenarios
    const m4_total = daysInMonth * SCENARIOS.M4.paths.happy.ops;
    const m5_total = daysInMonth * SCENARIOS.M5.paths.happy.ops;
    const m6_total = daysInMonth * SCENARIOS.M6.paths.happy.ops;

    const fixedDaily = m4_total + m5_total + m6_total;
    const leadBased = m0_total + m1_total + m2_total + m3_total;
    const totalMonthly = fixedDaily + leadBased;

    return {
      uniqueLeads,
      duplicateLeads,
      repliedLeads,
      bouncedLeads,
      activeLeads,
      totalLeadDays,
      breakdown: {
        M0: { total: m0_total, detail: `${uniqueLeads} unique × ${SCENARIOS.M0.paths.happy.ops} + ${duplicateLeads} dup × ${SCENARIOS.M0.paths.duplicate.ops}` },
        M1: { total: m1_total, detail: `${uniqueLeads} lead × ${m1_path.ops} ops (${aiMode ? 'AI ON' : 'AI OFF'})` },
        M2: { total: m2_total, detail: `${formatNumber(totalLeadDays)} lead-gun × ${SCENARIOS.M2.paths.happy.ops} + ${daysInMonth} gun × ${SCENARIOS.M2.fixedPerRun} sabit` },
        M3: { total: m3_total, detail: `${repliedLeads} yanit × ${SCENARIOS.M3.paths.positive.ops} + ${bouncedLeads} bounce × ${SCENARIOS.M3.paths.bounce.ops}` },
        M4: { total: m4_total, detail: `${daysInMonth} gun × ${SCENARIOS.M4.paths.happy.ops} ops` },
        M5: { total: m5_total, detail: `${daysInMonth} gun × ${SCENARIOS.M5.paths.happy.ops} ops` },
        M6: { total: m6_total, detail: `${daysInMonth} gun × ${SCENARIOS.M6.paths.happy.ops} ops` },
      },
      fixedDaily,
      leadBased,
      totalMonthly,
    };
  }, [leadsPerMonth, followUpDays, replyRate, bounceRate, duplicateRate, aiMode, daysInMonth]);

  const maxOp = Math.max(...Object.values(simulation.breakdown).map((b) => b.total));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Make.com Kredi Simulasyonu
          </h1>
          <p className="text-gray-500 mt-1">
            Revenue Recovery Engine — Aylik Operasyon Tahmini
          </p>
        </div>

        {/* Input Panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Parametreler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aylik Lead Sayisi
              </label>
              <input
                type="number"
                min={1}
                value={leadsPerMonth}
                onChange={(e) => setLeadsPerMonth(Math.max(1, +e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ortalama Follow-up Gunu
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={followUpDays}
                onChange={(e) => setFollowUpDays(Math.max(1, Math.min(30, +e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yanit Orani (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={replyRate}
                onChange={(e) => setReplyRate(Math.max(0, Math.min(100, +e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bounce Orani (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={bounceRate}
                onChange={(e) => setBounceRate(Math.max(0, Math.min(100, +e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duplicate Orani (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={duplicateRate}
                onChange={(e) => setDuplicateRate(Math.max(0, Math.min(100, +e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Modu
              </label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setAiMode(true)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    aiMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  AI ON
                </button>
                <button
                  onClick={() => setAiMode(false)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    !aiMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  AI OFF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(simulation.totalMonthly)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Toplam Aylik Ops</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(simulation.leadBased)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Lead Bazli Ops</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {formatNumber(simulation.fixedDaily)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Sabit Gunluk Ops</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {simulation.totalMonthly > 0
                ? Math.round(simulation.totalMonthly / leadsPerMonth)
                : 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Ops / Lead</div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Senaryo Bazli Dagilim</h2>
          <div className="space-y-3">
            {Object.entries(simulation.breakdown).map(([key, data]) => {
              const pct = maxOp > 0 ? (data.total / maxOp) * 100 : 0;
              const colors = {
                M0: 'bg-blue-500',
                M1: 'bg-indigo-500',
                M2: 'bg-purple-500',
                M3: 'bg-pink-500',
                M4: 'bg-gray-400',
                M5: 'bg-gray-300',
                M6: 'bg-gray-500',
              };
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {SCENARIOS[key].name}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatNumber(data.total)} ops
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${colors[key]} h-3 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{data.detail}</p>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">TOPLAM AYLIK</span>
            <span className="text-xl font-bold text-purple-600">
              {formatNumber(simulation.totalMonthly)} ops
            </span>
          </div>
        </div>

        {/* Plan Recommendation */}
        <PlanRecommendation totalMonthly={simulation.totalMonthly} />

        {/* Scenario Details (collapsible) */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Senaryo Detaylari (Modul Bazli)
          </h2>
          <div className="space-y-3">
            {Object.entries(SCENARIOS).map(([id, scenario]) => (
              <ScenarioCard
                key={id}
                id={id}
                scenario={scenario}
                expanded={!!expandedCards[id]}
                onToggle={() => toggleCard(id)}
              />
            ))}
          </div>
        </div>

        {/* Lead Lifecycle Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Lead Yasam Dongusu Ozeti</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">{leadsPerMonth}</div>
              <div className="text-xs text-gray-500">Gelen Lead</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-lg font-bold text-red-500">{simulation.duplicateLeads}</div>
              <div className="text-xs text-gray-500">Duplicate</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">{simulation.uniqueLeads}</div>
              <div className="text-xs text-gray-500">Unique Lead</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-600">{simulation.repliedLeads}</div>
              <div className="text-xs text-gray-500">Yanit Alinan</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-lg font-bold text-amber-600">{simulation.bouncedLeads}</div>
              <div className="text-xs text-gray-500">Bounce</div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className="text-sm text-gray-500">
              Toplam aktif lead-gun: <strong>{formatNumber(simulation.totalLeadDays)}</strong>
              {' '}(M2 Daily Engine her lead-gun icin calisir)
            </span>
          </div>
        </div>

        {/* Scale Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Olcek Tablosu</h2>
          <p className="text-sm text-gray-500 mb-3">
            Farkli lead hacimlerinde tahmini aylik operasyon tuketimi
            (mevcut parametrelerle)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Lead/Ay</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Lead Ops</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Sabit Ops</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Toplam</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Ops/Lead</th>
                </tr>
              </thead>
              <tbody>
                {[10, 25, 50, 100, 200, 500, 1000].map((n) => {
                  const scale = n / leadsPerMonth;
                  const leadOps = Math.round(simulation.leadBased * scale);
                  const total = leadOps + simulation.fixedDaily;
                  const perLead = total > 0 ? Math.round(total / n) : 0;
                  const isCurrentRow = n === leadsPerMonth;
                  return (
                    <tr
                      key={n}
                      className={`border-b border-gray-100 ${
                        isCurrentRow ? 'bg-purple-50 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-gray-900">{formatNumber(n)}</td>
                      <td className="py-2 px-3 text-right text-gray-700">
                        {formatNumber(leadOps)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-500">
                        {formatNumber(simulation.fixedDaily)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900 font-medium">
                        {formatNumber(total)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-500">{perLead}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Bu simulasyon Make.com blueprint analizine dayali bir tahmindir.
          Gercek tuketim, filter kosullarına ve hata oranlarına gore degisebilir.
          Router modulleri ucretsizdir ve hesaplamaya dahil degildir.
        </p>
      </div>
    </div>
  );
}
