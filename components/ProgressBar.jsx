'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const STEP_LABELS = [
  'Workspace',
  'API Key',
  'Engine',
  'Sync',
  'Preflight',
  'Deploy',
];

export default function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-4">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.08 : 1,
                    backgroundColor: isCompleted
                      ? '#10b981'
                      : isCurrent
                        ? '#3b82f6'
                        : '#e5e7eb',
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <span
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                </motion.div>
                <span
                  className={`mt-1 text-[11px] font-medium ${
                    isCompleted
                      ? 'text-emerald-600'
                      : isCurrent
                        ? 'text-blue-600'
                        : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>

              {i < totalSteps - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 mb-4 rounded-full overflow-hidden bg-gray-200">
                  <motion.div
                    initial={false}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
