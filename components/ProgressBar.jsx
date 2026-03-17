'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const STEP_LABELS = [
  'Workspace',
  'API Key',
  'Engine',
  'Sync',
  'Preflight',
];

export default function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={label} className="flex flex-1 items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? '#10b981'
                      : isCurrent
                        ? '#3b82f6'
                        : '#e5e7eb',
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                </motion.div>
                <span
                  className={`mt-2 text-xs font-medium ${
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

              {/* Connector line */}
              {i < totalSteps - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full overflow-hidden bg-gray-200">
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
