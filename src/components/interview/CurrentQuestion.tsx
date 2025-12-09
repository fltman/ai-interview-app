/**
 * CurrentQuestion Component
 * Displays the current interview question
 */

import { Question } from '../../types';
import { InterviewPhase } from '../../hooks/useInterview';

interface CurrentQuestionProps {
  question: Question | null;
  phase: InterviewPhase;
  questionIndex: number;
  totalQuestions: number;
}

export default function CurrentQuestion({
  question,
  phase,
  questionIndex,
  totalQuestions,
}: CurrentQuestionProps) {
  // Only show during questioning and confirming phases
  if (!question || (phase !== 'questioning' && phase !== 'confirming' && phase !== 'greeting')) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-sm font-medium text-gray-400">
          {phase === 'questioning' ? 'Current Question' : phase === 'greeting' ? 'First Question' : 'Last Question'}
        </h2>
        <span className="text-xs font-semibold text-violet-300 bg-violet-500/20 px-2 py-1 rounded">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
      </div>
      <p className="text-lg text-gray-200 leading-relaxed">
        {question.text}
      </p>
    </div>
  );
}
