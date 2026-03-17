'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Download,
  KeyRound,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Rocket,
  ShieldCheck,
  Sparkles,
  FileJson,
  Link2,
  Mail,
  LayoutDashboard,
  Settings2,
  UserPlus,
  Globe,
  Eye,
} from 'lucide-react';
import Confetti from 'react-confetti';
import ProgressBar from './ProgressBar';

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ---------------------------------------------------------------------------
// Reusable ChecklistItem
// ---------------------------------------------------------------------------
function ChecklistItem({ checked, onChange, icon: Icon, title, description, critical }) {
  return (
    <label
      className={`group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
        checked
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
      } ${critical ? 'ring-2 ring-amber-300' : ''}`}
    >
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            checked
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 group-hover:border-blue-400'
          }`}
        >
          {checked && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 text-white"
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
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
          <p className={`text-sm font-semibold ${checked ? 'text-emerald-700' : 'text-gray-800'}`}>
            {title}
          </p>
          {critical && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Critical
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </label>
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
      description:
        'Click the Notion link provided and duplicate it to your workspace.',
    },
    {
      icon: Settings2,
      title: 'Configure System Settings',
      description:
        "Open the 'System Settings' database. Make sure Safety Switch is checked, and AI Enabled is unchecked.",
    },
    {
      icon: UserPlus,
      title: 'Create a Sandbox Client',
      description:
        "Open the 'Clients' database. Create a new row, name it 'TEST', enter your own personal email address, and set the status to 'New'.",
    },
  ];

  return (
    <div>
      <StepHeader
        icon={LayoutDashboard}
        title="Prepare Your Workspace"
        description="Let's set up the backbone of your system. You don't need any technical skills — just follow these quick steps."
      />
      <div className="space-y-3 mt-6">
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
      icon: KeyRound,
      title: 'Create Integration',
      description:
        "Go to Notion Integrations. Click New integration, name it 'Revenue Recovery Engine', and save.",
    },
    {
      icon: Eye,
      title: 'Copy the Secret',
      description:
        "Scroll to 'Internal integration secret', click Show, and Copy this long password.",
    },
    {
      icon: Link2,
      title: 'Authorize the Template',
      description:
        "Go back to your Notion Dashboard. Click the '...' in the top right → Connections → Search for 'Revenue Recovery Engine' and click Confirm.",
      critical: true,
    },
  ];

  return (
    <div>
      <StepHeader
        icon={KeyRound}
        title="Create Your API Key"
        description="We need a secure key so your automation engine can read your Notion databases."
      />
      <div className="space-y-3 mt-6">
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
        description="Paste your Notion Secret Key below. Our system will scan your workspace, map your unique database IDs, and generate a customized automation file just for you."
      />

      <div className="mt-8 space-y-6">
        {/* Token Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <KeyRound className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="password"
            placeholder="ntn_... or secret_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={apiState === 'loading' || apiState === 'success'}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
          />
        </div>

        {/* Generate Button */}
        {apiState === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onGenerate}
            disabled={!token.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 disabled:shadow-none transition-all text-base"
          >
            Verify & Generate System Files ⚡
          </motion.button>
        )}

        {/* Loading State */}
        {apiState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-600 font-medium animate-pulse">
              Verifying databases & generating your engine...
            </p>
          </div>
        )}

        {/* Error State */}
        {apiState === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">
              Something went wrong. Please check your Notion token and try again.
            </p>
            <button
              onClick={onGenerate}
              className="mt-3 text-sm text-red-600 hover:text-red-800 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Success / Download State */}
        {apiState === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <p className="text-emerald-800 font-medium text-sm">
                Databases verified! Your custom engine file is ready.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDownload}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 text-base"
            >
              <Download className="w-5 h-5" />
              Download Revenue_Recovery_M5.json
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
      icon: FileJson,
      title: 'Import Blueprint',
      description:
        "Log into Make.com, create a new scenario, select 'Import Blueprint', and upload the M5.json file you just downloaded.",
      placeholder: 'import-blueprint-demo.gif',
    },
    {
      icon: Globe,
      title: 'Connect Notion',
      description:
        "Click the first black Notion module. Click Add, select 'Notion Internal', name it 'My Notion', paste your Secret Key from Step 2, and click Save. Do this for all black modules. (Ignore any blue Legacy warnings).",
      placeholder: 'connect-notion-demo.gif',
    },
    {
      icon: Mail,
      title: 'Connect Gmail',
      description:
        'Click the red Gmail module. Click Add, sign in with your Google account, and grant permission.',
      placeholder: 'connect-gmail-demo.gif',
    },
  ];

  return (
    <div>
      <StepHeader
        icon={Rocket}
        title="The 90-Second Sync"
        description="Because you used our Engine Generator, your file is perfectly pre-mapped. You do NOT need to manually search for databases or fix empty fields."
      />
      <div className="space-y-4 mt-6">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex-1">
              <ChecklistItem
                checked={checks[i]}
                onChange={() => toggleCheck(i)}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            </div>
            <div className="hidden sm:flex w-32 h-24 rounded-lg bg-gray-100 border border-gray-200 items-center justify-center shrink-0 self-center">
              <span className="text-[10px] text-gray-400 text-center px-2">
                {item.placeholder}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Run the Preflight Check
// ---------------------------------------------------------------------------
function StepPreflight({ checks, toggleCheck, allChecked }) {
  const items = [
    {
      icon: CheckCircle2,
      title: 'Modules Ran Successfully',
      description: 'Did the modules turn green without errors?',
    },
    {
      icon: Mail,
      title: 'Email Draft Confirmed',
      description:
        "Check your Gmail Drafts folder. Is there an email titled 'System Check: All Systems Go!'?",
    },
    {
      icon: ShieldCheck,
      title: 'System Log Verified',
      description:
        "Check your Notion 'System Logs'. Does it say 'M5 Success - Ready for Live'?",
    },
  ];

  return (
    <div>
      <StepHeader
        icon={ShieldCheck}
        title="Run the Preflight Check"
        description="You have successfully connected your brain (Notion) to your muscle (Make.com). Click the Disk icon at the bottom left to Save, then click the Run Once button in Make.com."
      />
      <div className="space-y-3 mt-6">
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

      {/* Celebration */}
      <AnimatePresence>
        {allChecked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-8 text-center p-8 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
              className="text-5xl mb-4"
            >
              🎉
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
            <p className="text-gray-600 text-base">
              Your infrastructure is officially flawless.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Header (reusable)
// ---------------------------------------------------------------------------
function StepHeader({ icon: Icon, title, description }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4">
        <Icon className="w-7 h-7 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

// ===========================================================================
// Main SetupWizard
// ===========================================================================
export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1 checks
  const [step1Checks, setStep1Checks] = useState([false, false, false]);
  // Step 2 checks
  const [step2Checks, setStep2Checks] = useState([false, false, false]);
  // Step 3 state
  const [token, setToken] = useState('');
  const [apiState, setApiState] = useState('idle'); // idle | loading | success | error
  const [apiResult, setApiResult] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  // Step 4 checks
  const [step4Checks, setStep4Checks] = useState([false, false, false]);
  // Step 5 checks
  const [step5Checks, setStep5Checks] = useState([false, false, false]);

  // Confetti dimensions
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize window size on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  });

  const makeToggle = useCallback((setter) => (index) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const allChecked = (arr) => arr.every(Boolean);

  // Can proceed to next step?
  const canProceed = () => {
    switch (currentStep) {
      case 0: return allChecked(step1Checks);
      case 1: return allChecked(step2Checks);
      case 2: return apiState === 'success' && downloaded;
      case 3: return allChecked(step4Checks);
      case 4: return allChecked(step5Checks);
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

  // Step 3: API call
  const handleGenerate = async () => {
    if (!token.trim()) return;
    setApiState('loading');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionToken: token, selectedBlueprints: ['M5'] }),
      });
      if (!res.ok) {
        setApiState('error');
        return;
      }
      const data = await res.json();
      setApiResult(data);
      setApiState('success');
    } catch {
      setApiState('error');
    }
  };

  // Step 3: Download
  const handleDownload = () => {
    if (!apiResult?.blueprints?.M5) return;
    const blob = new Blob([apiResult.blueprints.M5], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Revenue_Recovery_M5.json';
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  // Step 5: confetti trigger
  const handleStep5Toggle = (index) => {
    setStep5Checks((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      if (next.every(Boolean)) {
        if (typeof window !== 'undefined') {
          setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        }
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 6000);
      }
      return next;
    });
  };

  const BUTTON_LABELS = [
    'Next Step: Get Your Keys',
    'Next Step: Generate My Engine',
    'Next Step: The 90-Second Sync',
    'Next Step: The Preflight Check',
    'Finish Setup & Go to Dashboard',
  ];

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFinalDone = isLastStep && allChecked(step5Checks);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.15}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Revenue Recovery Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Setup Wizard</h1>
          <p className="text-gray-500 mt-2">5 steps to your fully automated revenue recovery system</p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-10 min-h-[420px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
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
                  toggleCheck={handleStep5Toggle}
                  allChecked={allChecked(step5Checks)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            Back
          </button>

          <motion.button
            whileHover={canProceed() ? { scale: 1.02 } : {}}
            whileTap={canProceed() ? { scale: 0.98 } : {}}
            onClick={isFinalDone ? () => (window.location.href = '/') : nextStep}
            disabled={!canProceed()}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all ${
              canProceed()
                ? isFinalDone
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {BUTTON_LABELS[currentStep]}
            {isFinalDone ? (
              <Rocket className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
