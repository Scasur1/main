'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCheck,
  CheckCircle2,

  CloudDownload,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  KeyRound,
  LayoutDashboard,
  Link2,
  Mail,
  MailCheck,
  Rocket,
  Save,
  Settings,

  ShieldCheck,
  Sliders,
  Sparkles,
  UserPlus,

} from 'lucide-react';
import Confetti from 'react-confetti';
import ProgressBar from './ProgressBar';

const TOTAL_STEPS = 6;

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 200 : -200, opacity: 0 }),
};

// ---------------------------------------------------------------------------
// Reusable ChecklistItem — compact, interactive, with bold-keyword support
// ---------------------------------------------------------------------------
function ChecklistItem({ checked, onChange, icon: Icon, title, description, critical }) {
  return (
    <label
      className={`group flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
        checked
          ? 'border-emerald-300 bg-emerald-50/70 shadow-sm shadow-emerald-100'
          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
      } ${critical ? 'ring-2 ring-amber-300' : ''}`}
    >
      <div className="pt-0.5 shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            checked
              ? 'bg-emerald-500 border-emerald-500 scale-105'
              : 'border-gray-300 group-hover:border-blue-400'
          }`}
        >
          {checked && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={`w-4 h-4 shrink-0 ${checked ? 'text-emerald-500' : 'text-gray-400'}`} />}
          <p className={`text-sm font-semibold leading-tight ${checked ? 'text-emerald-700' : 'text-gray-800'}`}>
            {title}
          </p>
          {critical && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              Critical
            </span>
          )}
        </div>
        <div className={`text-[13px] mt-0.5 leading-relaxed ${checked ? 'text-emerald-600/80' : 'text-gray-500'}`}>
          {description}
        </div>
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Step Header — compact version
// ---------------------------------------------------------------------------
function StepHeader({ icon: Icon, title, description }) {
  return (
    <div className="text-center mb-4">
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 mb-2">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {description && <p className="text-gray-500 mt-1 text-sm max-w-md mx-auto leading-relaxed">{description}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Prepare Your Workspace
// ---------------------------------------------------------------------------
function StepPrepare({ checks, toggleCheck }) {
  const items = [
    {
      icon: Copy,
      title: 'Duplicate the Template',
      description: (
        <>Click the provided Notion link and press the <b>Duplicate</b> button in the top right corner to copy the template to your own workspace.</>
      ),
    },
    {
      icon: Settings,
      title: 'Configure System Settings',
      description: (
        <>Open the <b>System Settings</b> database. Enter your <b>Admin Email</b>. Ensure the <b>Safety Switch</b> is checked (✅) and <b>AI Enabled</b> is unchecked (⬜). <b className="text-amber-600">Do not touch any other fields for now.</b></>
      ),
    },
    {
      icon: UserPlus,
      title: 'Create a Sandbox Client',
      description: (
        <>Open the <b>Clients</b> database. Create a new row named <b>&apos;TEST&apos;</b>. Enter an email address different from your Admin Email and set the status to <b>&apos;New&apos;</b>.</>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        icon={Copy}
        title="Prepare Your Workspace"
      />
      <div className="space-y-5">
        {items.map((item, i) => (
          <ChecklistItem
            key={i}
            checked={checks[i]}
            onChange={() => toggleCheck(i)}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Create Your API Key
// ---------------------------------------------------------------------------
function StepApiKey({ checks, toggleCheck }) {
  const items = [
    {
      icon: ExternalLink,
      title: 'Create New Integration',
      description: (
        <>
          Click{' '}
          <a
            href="https://www.notion.so/profile/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            here
          </a>{' '}
          to open your Notion Integrations. Click <b>+ Create a new integration</b>. Name it <b>&apos;Revenue Recovery Engine&apos;</b>, select your <b>Associated workspace</b>, and click <b>Create</b>.
        </>
      ),
    },
    {
      icon: Link2,
      title: 'Authorize the Template',
      description: (
        <>
          Click the <b>Content access</b> tab at the top. Click the <b>Edit access</b> button, search for your <b>&apos;Client Follow-up Hub&apos;</b> page, select it, and click <b>Save</b>.{' '}
          <span className="italic text-gray-500">(This clears the yellow &apos;No page access&apos; warning!)</span>
        </>
      ),
      critical: true,
    },
    {
      icon: Sliders,
      title: 'Configure Capabilities',
      description: (
        <>
          Click back to the <b>Configuration</b> tab and scroll down to <b>Capabilities</b>. Ensure <b>Read</b>, <b>Update</b>, and <b>Insert content</b> are checked. Under User Capabilities, select <b>Read user information including email addresses</b>, then click <b>Save</b> at the bottom.
          <span className="block mt-1.5 text-[11px] text-gray-400 leading-snug">
            💡 <b>Quick Fix:</b> If Notion&apos;s Save button is bugged/greyed out, briefly select &apos;without email addresses&apos;, click Save, then switch back to &apos;including email addresses&apos; and Save again.
          </span>
        </>
      ),
    },
    {
      icon: Eye,
      title: 'Copy the Secret Key',
      description: (
        <>
          Scroll up to the <b>Internal integration secret</b> section. Click <b>Show</b>, and <b>Copy</b> this password.
        </>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        icon={KeyRound}
        title="Create Your API Key"
      />
      <div className="space-y-5">
        {items.map((item, i) => (
          <ChecklistItem
            key={i}
            checked={checks[i]}
            onChange={() => toggleCheck(i)}
            icon={item.icon}
            title={item.title}
            description={item.description}
            critical={item.critical}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: The Magic Engine Generator
// ---------------------------------------------------------------------------
function StepEngine({ token, setToken, apiState, onGenerate, onDownload }) {
  return (
    <div>
      <StepHeader
        icon={Sparkles}
        title="The Magic Engine Generator"
        description="Paste your Notion Secret Key below to generate your customized automation files."
      />

      <div className="space-y-4 mt-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <KeyRound className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="password"
            placeholder="ntn_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={apiState === 'loading' || apiState === 'success'}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>🔒</span> <span><b>Bank-Grade Security:</b> Your key is processed locally in your browser and is NEVER stored on our servers.</span>
        </p>

        {apiState === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onGenerate}
            disabled={!token.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 disabled:shadow-none transition-all text-sm"
          >
            Verify & Generate System Files ⚡
          </motion.button>
        )}

        {apiState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <Sparkles className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-600 font-medium text-sm animate-pulse">
              Verifying databases & generating your engine...
            </p>
          </div>
        )}

        {apiState === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">
              Something went wrong. Please check your Notion token and try again.
            </p>
            <button
              onClick={onGenerate}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {apiState === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col items-center justify-center text-center space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-emerald-800 font-medium text-sm">
                Databases verified! Your custom engine file is ready.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDownload}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/25 text-sm"
            >
              <Download className="w-4 h-4" />
              Download M5.json
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: The 90-Second Sync
// ---------------------------------------------------------------------------
function StepSync({ checks, toggleCheck }) {
  const items = [
    {
      icon: Download,
      title: 'Import the Blueprint',
      description: (
        <>
          Log into <b>Make.com</b>. Go to <b>Scenarios</b> → click the <b>+ Create Scenario</b> button. Click the <b>&apos;...&apos;</b> menu (top right) → <b>Import Blueprint</b>, and upload your downloaded <b>M5.json</b> file.
        </>
      ),
    },
    {
      icon: Database,
      title: 'Connect Your Notion',
      description: (
        <>
          Click the first black Notion module (<b>Fetch System Settings</b>). Click <b>Create a connection</b>. Select <b>Notion Internal</b> as the type, paste your <b>Secret Key</b> from Phase 2, and click <b>Save</b>.
        </>
      ),
    },
    {
      icon: CheckCheck,
      title: 'Secure All Modules',
      description: (
        <>
          Open <b>every other black Notion module</b> in the scenario. Under the connection dropdown, select the <b>&apos;My Notion Internal&apos;</b> connection you just created. <em className="text-gray-400">(Note: It may take 1-2 seconds for the module fields to load before the Save button appears. Please wait a moment.)</em>
        </>
      ),
    },
    {
      icon: Mail,
      title: 'Connect Your Gmail',
      description: (
        <>
          Click the red <b>Gmail</b> module. Click <b>Create a connection</b> → <b>Sign in with Google</b>. Select your correct email, approve the permissions.
        </>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        icon={Rocket}
        title="The 90-Second Sync"
      />
      <div className="space-y-5">
        {items.map((item, i) => (
          <ChecklistItem
            key={i}
            checked={checks[i]}
            onChange={() => toggleCheck(i)}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Run the Preflight Check
// ---------------------------------------------------------------------------
function StepPreflight({ checks, toggleCheck, allVerified }) {
  const items = [
    {
      icon: Save,
      title: 'Save & Run',
      description: (
        <>Click the yellow dotted <b>Disk icon</b> at the bottom of Make.com to <b>Save</b>, then click <b>Run once</b>.</>
      ),
    },
    {
      icon: CheckCircle2,
      title: 'Modules Ran Successfully',
      description: (
        <>Did the modules turn <b>green</b> without errors?</>
      ),
    },
    {
      icon: MailCheck,
      title: 'Email Draft Confirmed',
      description: (
        <>Check your <b>Gmail Drafts</b> folder. Is there an email titled <b>&apos;System Check: All Systems Go!&apos;</b>?</>
      ),
    },
    {
      icon: ShieldCheck,
      title: 'System Log Verified',
      description: (
        <>Check your Notion <b>System Logs</b> database. Does it say <b>&apos;M5 Success - Ready for Live&apos;</b>?</>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        icon={ShieldCheck}
        title="Run the Preflight Check"
        description="Time to verify everything works."
      />
      <div className="mb-5 p-4 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-900">
        <span className="font-semibold">💡 ⚠️ When you try to save, seeing a &quot;Connection not found&quot; error?</span> Don&apos;t worry, the system is fine! You just need to select your account in the modules. <b>Fix:</b> Click every 🖤 N (Notion) and ❤️ G (Gmail) module in Make.com and select your connection from the dropdown. Then, click <b>Save</b> again.
      </div>

      <div className="space-y-5">
        {items.map((item, i) => (
          <ChecklistItem
            key={i}
            checked={checks[i]}
            onChange={() => toggleCheck(i)}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>

      <AnimatePresence>
        {allVerified && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-5 text-center py-5 px-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
              className="text-4xl mb-2"
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Congratulations!</h3>
            <p className="text-gray-600 text-sm">You have successfully connected your main engine.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6: Deploy Core Engines
// ---------------------------------------------------------------------------
function StepDeploy({ checks, toggleCheck, apiResult, allDone }) {
  const engineFiles = ['M0', 'M1', 'M2', 'M3', 'M4', 'M6'];

  const handleDownloadEngine = (key) => {
    if (!apiResult?.blueprints?.[key]) return;
    const blob = new Blob([apiResult.blueprints[key]], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const items = [
    {
      icon: CloudDownload,
      title: 'Download Your Engines',
      description: (
        <>
          Download your personalized core engine files. You will import these into Make.com during the final Notion checklist.
          <div className="flex flex-wrap gap-1.5 mt-2">
            {engineFiles.map((key) => (
              <button
                key={key}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadEngine(key); }}
                disabled={!apiResult?.blueprints?.[key]}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-2.5 h-2.5" />
                {key}.json
              </button>
            ))}
          </div>
        </>
      ),
    },
    {
      icon: LayoutDashboard,
      title: 'The Final Notion Checklist',
      description: (
        <>
          Your API setup and Preflight test are complete! Now, return to your <b>Notion workspace</b>. Follow the built-in <b>&apos;Launch Checklist&apos;</b> there to import these files, set your follow-up rules, and safely activate your engines.
        </>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        icon={Rocket}
        title="Download Core Engines"
        description="Your infrastructure is healthy. Download your files and head to your dashboard."
      />
      <div className="space-y-5">
        {items.map((item, i) => (
          <ChecklistItem
            key={i}
            checked={checks[i]}
            onChange={() => toggleCheck(i)}
            icon={item.icon}
            title={item.title}
            description={item.description}
            critical={item.critical}
          />
        ))}
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-5 text-center py-5 px-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
              className="text-4xl mb-2"
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Congratulations!</h3>
            <p className="text-gray-600 text-sm">Your Revenue Recovery Engine is officially live.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// Main SetupWizard
// ===========================================================================
export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [step1Checks, setStep1Checks] = useState([false, false, false]);
  const [step2Checks, setStep2Checks] = useState([false, false, false, false]);
  const [token, setToken] = useState('');
  const [apiState, setApiState] = useState('idle');
  const [apiResult, setApiResult] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const [step4Checks, setStep4Checks] = useState([false, false, false, false]);
  const [step5Checks, setStep5Checks] = useState([false, false, false, false]);
  const [step6Checks, setStep6Checks] = useState([false, false]);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [step5Verified, setStep5Verified] = useState(false);

  // Trigger confetti when all Step 5 (Preflight) checks are completed
  useEffect(() => {
    if (allChecked(step5Checks) && !step5Verified) {
      setStep5Verified(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
    }
  }, [step5Checks, step5Verified]);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const makeToggle = useCallback((setter) => (index) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const allChecked = (arr) => arr.every(Boolean);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return allChecked(step1Checks);
      case 1: return allChecked(step2Checks);
      case 2: return apiState === 'success' && downloaded;
      case 3: return allChecked(step4Checks);
      case 4: return allChecked(step5Checks);
      case 5: return allChecked(step6Checks);
      default: return false;
    }
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleGenerate = async () => {
    if (!token.trim()) return;
    setApiState('loading');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionToken: token, selectedBlueprints: ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'] }),
      });
      if (!res.ok) { setApiState('error'); return; }
      const data = await res.json();
      setApiResult(data);
      setApiState('success');
    } catch {
      setApiState('error');
    }
  };

  const handleDownload = () => {
    if (!apiResult?.blueprints?.M5) return;
    const blob = new Blob([apiResult.blueprints.M5], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'M5.json';
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const handleStep6Toggle = (index) => {
    setStep6Checks((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const BUTTON_LABELS = [
    'Next Step: Get Your Keys',
    'Next Step: Generate My Engine',
    'Next Step: The 90-Second Sync',
    'Next Step: The Preflight Check',
    'Next Step: Deploy Core Engines',
    'Finish Setup & Go to Notion Dashboard',
  ];

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFinalDone = isLastStep && allChecked(step6Checks);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.15}
        />
      )}

      <div className="max-w-2xl w-full mx-auto px-4 py-5 flex flex-col flex-1">
        {/* Compact Header */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Revenue Recovery Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Wizard</h1>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Card with content + button footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden flex-1"
        >
          {/* Step Content */}
          <div className="p-5 sm:p-6 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {currentStep === 0 && (
                  <StepPrepare checks={step1Checks} toggleCheck={makeToggle(setStep1Checks)} />
                )}
                {currentStep === 1 && (
                  <StepApiKey checks={step2Checks} toggleCheck={makeToggle(setStep2Checks)} />
                )}
                {currentStep === 2 && (
                  <StepEngine
                    token={token}
                    setToken={setToken}
                    apiState={apiState}
                    onGenerate={handleGenerate}
                    onDownload={handleDownload}
                  />
                )}
                {currentStep === 3 && (
                  <StepSync checks={step4Checks} toggleCheck={makeToggle(setStep4Checks)} />
                )}
                {currentStep === 4 && (
                  <StepPreflight
                    checks={step5Checks}
                    toggleCheck={makeToggle(setStep5Checks)}
                    allVerified={allChecked(step5Checks)}
                  />
                )}
                {currentStep === 5 && (
                  <StepDeploy
                    checks={step6Checks}
                    toggleCheck={handleStep6Toggle}
                    apiResult={apiResult}
                    allDone={allChecked(step6Checks)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Card Footer — Navigation Buttons inside the card */}
          <div className="border-t border-gray-100 px-5 sm:px-6 py-3 flex items-center justify-between bg-gray-50/50">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-0 disabled:pointer-events-none transition-all"
            >
              ← Back
            </button>

            <motion.button
              whileHover={canProceed() ? { scale: 1.02 } : {}}
              whileTap={canProceed() ? { scale: 0.98 } : {}}
              onClick={isFinalDone ? () => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 6000); setTimeout(() => (window.location.href = '/'), 3000); } : nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                canProceed()
                  ? isFinalDone
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {BUTTON_LABELS[currentStep]}
              {isFinalDone ? <Rocket className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
