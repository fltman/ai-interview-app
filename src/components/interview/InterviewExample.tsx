/**
 * InterviewExample Component
 * Demonstrates complete integration of useInterview hook with all components
 * This can be used as a reference or directly in the InterviewPage
 */

import { useEffect } from 'react';
import { useInterview } from '../../hooks';
import { Settings, Answer, TranscriptEntry } from '../../types';
import InterviewControls from './InterviewControls';
import TranscriptDisplay from './TranscriptDisplay';
import CurrentQuestion from './CurrentQuestion';
import SummaryDisplay from './SummaryDisplay';

interface InterviewExampleProps {
  settings: Settings;
  onComplete?: (answers: Answer[], transcript: TranscriptEntry[]) => void;
  onError?: (error: Error) => void;
}

export default function InterviewExample({
  settings,
  onComplete,
  onError,
}: InterviewExampleProps) {
  const interview = useInterview({
    settings,
    onComplete,
    onError,
  });

  // Log phase changes for debugging
  useEffect(() => {
    console.log('Interview phase changed:', interview.phase);
  }, [interview.phase]);

  return (
    <div className="space-y-6">
      {/* Interview Controls */}
      <InterviewControls
        phase={interview.phase}
        progress={interview.progress}
        currentQuestionIndex={interview.currentQuestionIndex}
        totalQuestions={interview.questions.length}
        isActive={interview.isActive}
        onStart={interview.startInterview}
        onStop={interview.stopInterview}
        onRetry={interview.retryQuestion}
        onSkip={interview.skipQuestion}
        canSkip={true} // In production, check if current question is optional
      />

      {/* Current Question Display */}
      <CurrentQuestion
        question={interview.currentQuestion}
        phase={interview.phase}
        questionIndex={interview.currentQuestionIndex}
        totalQuestions={interview.questions.length}
      />

      {/* Summary Display (during confirming phase) */}
      {interview.phase === 'confirming' && (
        <SummaryDisplay
          answers={interview.answers}
          summary={interview.summary}
          onConfirm={interview.confirmSummary}
          showActions={true}
        />
      )}

      {/* Transcript Display */}
      {(interview.transcript.length > 0 || interview.currentTranscript) && (
        <TranscriptDisplay
          transcript={interview.transcript}
          currentTranscript={interview.currentTranscript}
          currentSpeaker={interview.phase === 'questioning' ? 'user' : 'ai'}
          showEmpty={false}
          maxHeight="32rem"
        />
      )}

      {/* Error Display */}
      {interview.error && (
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                An error occurred
              </h3>
              <p className="text-sm text-red-700">
                {interview.error.message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary mt-3 text-sm"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete State Actions */}
      {interview.phase === 'complete' && (
        <div className="card bg-green-50 border border-green-200">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Interview Complete!
            </h2>
            <p className="text-sm text-green-700">
              Your interview has been completed successfully.
            </p>
          </div>

          <div className="space-y-2">
            <button className="btn btn-primary w-full">
              Generate Document
            </button>
            <button className="btn btn-secondary w-full">
              View Summary
            </button>
          </div>
        </div>
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="card bg-gray-50 text-xs">
          <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
            Debug Info
          </summary>
          <pre className="overflow-x-auto text-gray-600">
            {JSON.stringify(
              {
                phase: interview.phase,
                progress: interview.progress,
                currentQuestionIndex: interview.currentQuestionIndex,
                totalQuestions: interview.questions.length,
                answersCount: interview.answers.size,
                transcriptEntries: interview.transcript.length,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
