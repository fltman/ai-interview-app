/**
 * SettingsAssistant Component
 * Modal interface for the voice-guided settings configuration assistant
 */

import React from 'react';
import { Sparkles, Check, Loader2, MessageSquare, X } from 'lucide-react';
import { AudioVisualizer } from '../ui/AudioWaveform';
import { Button } from '../ui/Button';
import type { AssistantPhase, TranscriptEntry } from '../../hooks/useSettingsAssistant';

export interface SettingsAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  phase: AssistantPhase;
  transcript: TranscriptEntry[];
  isActive: boolean;
  hasSettings: boolean;
  onApplySettings: () => void;
  error: Error | null;
}

const PHASE_LABELS: Record<AssistantPhase, string> = {
  idle: 'Ready to start',
  'asking-purpose': 'Exploring purpose',
  'asking-questions': 'Discussing questions',
  'asking-template': 'Planning document format',
  'asking-language': 'Selecting language',
  confirming: 'Confirming settings',
  complete: 'Complete!',
};

const PHASE_DESCRIPTIONS: Record<AssistantPhase, string> = {
  idle: 'The assistant is ready to help you configure the app',
  'asking-purpose': 'Tell me about the type of interviews you want to conduct',
  'asking-questions': 'Deciding which questions to ask',
  'asking-template': 'Designing how the document should look',
  'asking-language': 'Choosing language for interview and document',
  confirming: 'Confirming everything is correct',
  complete: 'Settings are ready to use',
};

export const SettingsAssistant: React.FC<SettingsAssistantProps> = ({
  isOpen,
  onClose,
  phase,
  transcript,
  isActive,
  hasSettings,
  onApplySettings,
  error,
}) => {
  if (!isOpen) return null;

  const getPhaseIcon = () => {
    if (error) {
      return <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">!</div>;
    }
    if (phase === 'complete') {
      return <Check className="w-6 h-6 text-green-400" />;
    }
    if (isActive) {
      return <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />;
    }
    return <Sparkles className="w-6 h-6 text-violet-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isActive ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white">Setup Assistant</h2>
          <button
            onClick={onClose}
            disabled={isActive}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">
                <strong>Error:</strong> {error.message}
              </p>
            </div>
          )}

          {/* Phase Indicator */}
          <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              {getPhaseIcon()}
              <h3 className="font-medium text-white">
                {PHASE_LABELS[phase]}
              </h3>
            </div>
            <p className="text-sm text-gray-400 ml-9">
              {PHASE_DESCRIPTIONS[phase]}
            </p>
          </div>

          {/* Audio Visualizer */}
          <div className="flex justify-center py-4">
            <AudioVisualizer
              isRecording={isActive}
              isSpeaking={isActive}
              size="lg"
            />
          </div>

          {/* Instructions when idle */}
          {!isActive && transcript.length === 0 && (
            <div className="text-center py-4">
              <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-3" />
              <h4 className="font-medium text-lg text-white mb-2">
                Let me help you get started
              </h4>
              <p className="text-gray-400 mb-4 text-sm">
                I'll ask you a few questions to understand how you want to use the app.
                Answer with your voice and I'll configure everything for you!
              </p>
              <div className="text-left bg-gray-800/50 p-4 rounded-xl space-y-2">
                <p className="text-sm text-gray-300">
                  <strong>We'll go through:</strong>
                </p>
                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                  <li>What type of interviews you want to conduct</li>
                  <li>What questions you want to ask</li>
                  <li>How the document should look</li>
                  <li>What language you want to use</li>
                </ul>
              </div>
            </div>
          )}

          {/* Transcript Display */}
          {transcript.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-400">Conversation</h4>
              </div>
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-2xl px-4 py-2
                      ${entry.speaker === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {entry.text}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        entry.speaker === 'user' ? 'text-violet-200' : 'text-gray-500'
                      }`}
                    >
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Success State */}
          {phase === 'complete' && hasSettings && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-300">
                    Settings are ready!
                  </p>
                  <p className="text-sm text-green-400/80 mt-1">
                    Click "Apply Settings" below to use them in the app.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isActive}
            className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
          >
            {isActive ? 'In progress...' : 'Close'}
          </Button>
          {phase === 'complete' && hasSettings && (
            <Button
              onClick={onApplySettings}
              variant="primary"
              icon={<Check className="w-4 h-4" />}
              className="bg-violet-600 hover:bg-violet-700 border-0"
            >
              Apply Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
