/**
 * InterviewControls Component
 * Displays interview controls, status, and progress
 */

import { Square, Mic } from 'lucide-react';
import { InterviewPhase } from '../../hooks/useInterview';

interface InterviewControlsProps {
  phase: InterviewPhase;
  progress: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  isActive: boolean;
  onStop: () => void;
}

/**
 * Get phase display information
 */
function getPhaseDisplay(phase: InterviewPhase): {
  label: string;
  color: string;
  icon?: React.ReactNode;
} {
  switch (phase) {
    case 'idle':
      return {
        label: 'Starting...',
        color: 'text-violet-400',
        icon: (
          <div className="w-16 h-16 border-4 border-violet-900 border-t-violet-400 rounded-full animate-spin" />
        ),
      };
    case 'connecting':
      return {
        label: 'Connecting to AI...',
        color: 'text-violet-400',
        icon: (
          <div className="w-16 h-16 border-4 border-violet-900 border-t-violet-400 rounded-full animate-spin" />
        ),
      };
    case 'greeting':
      return {
        label: 'AI is greeting you',
        color: 'text-violet-400',
        icon: <Mic className="w-16 h-16 text-violet-400" />,
      };
    case 'questioning':
      return {
        label: 'Interview in progress',
        color: 'text-green-400',
        icon: (
          <div className="relative inline-block">
            <Mic className="w-16 h-16 text-green-400" />
            <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-30" />
          </div>
        ),
      };
    case 'confirming':
      return {
        label: 'Reviewing your answers',
        color: 'text-blue-400',
        icon: <Mic className="w-16 h-16 text-blue-400" />,
      };
    case 'generating':
      return {
        label: 'Generating document...',
        color: 'text-fuchsia-400',
        icon: (
          <div className="w-16 h-16 border-4 border-fuchsia-900 border-t-fuchsia-400 rounded-full animate-spin" />
        ),
      };
    case 'complete':
      return {
        label: 'Interview completed!',
        color: 'text-green-400',
        icon: (
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-3xl text-green-400">✓</span>
          </div>
        ),
      };
    case 'error':
      return {
        label: 'An error occurred',
        color: 'text-red-400',
        icon: (
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-3xl text-red-400">!</span>
          </div>
        ),
      };
  }
}

export default function InterviewControls({
  phase,
  progress,
  currentQuestionIndex,
  totalQuestions,
  isActive,
  onStop,
}: InterviewControlsProps) {
  const phaseDisplay = getPhaseDisplay(phase);

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <div className="mb-4">
          <div className={`mb-3 flex justify-center ${phaseDisplay.color}`}>
            {phaseDisplay.icon}
          </div>
          <p className={`text-lg font-semibold ${phaseDisplay.color}`}>
            {phaseDisplay.label}
          </p>
        </div>

        {/* Stop button - only show when interview is active */}
        {isActive && phase !== 'generating' && phase !== 'complete' && (
          <button
            onClick={onStop}
            className="w-full max-w-xs mx-auto py-4 px-6 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-colors"
            aria-label="Stop interview"
          >
            <Square className="w-5 h-5" />
            Stop Interview
          </button>
        )}
      </div>

      {/* Progress bar */}
      {(isActive || phase === 'complete') && totalQuestions > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-2">Progress</h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="text-sm font-medium text-gray-400">
              {currentQuestionIndex} / {totalQuestions}
            </span>
          </div>
        </div>
      )}

      {/* Microphone status indicator */}
      {isActive && phase !== 'generating' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <Mic className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Microphone active</span>
          </div>
        </div>
      )}
    </div>
  );
}
