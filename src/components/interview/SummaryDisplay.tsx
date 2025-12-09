/**
 * SummaryDisplay Component
 * Shows interview summary for confirmation
 */

import { Check, Edit2 } from 'lucide-react';
import { Answer } from '../../types';

interface SummaryDisplayProps {
  answers: Map<string, Answer>;
  summary?: string;
  onConfirm: (confirmed: boolean) => void;
  showActions?: boolean;
}

export default function SummaryDisplay({
  answers,
  summary,
  onConfirm,
  showActions = true,
}: SummaryDisplayProps) {
  const answersArray = Array.from(answers.values());

  if (answersArray.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Interview Summary
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Please review your answers below. If everything looks correct, confirm to proceed.
          Otherwise, you can go back and make corrections.
        </p>

        <div className="space-y-4">
          {answersArray.map((answer, index) => (
            <div
              key={answer.questionId}
              className="border-l-4 border-primary-400 pl-4 py-2"
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-700">
                  Question {index + 1}
                </h3>
                <span className="text-xs text-gray-500">
                  {new Date(answer.timestamp).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-800 mb-2 font-medium">
                {answer.questionText}
              </p>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {answer.answerText}
                </p>
              </div>
            </div>
          ))}
        </div>

        {summary && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              AI Summary
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="card bg-gray-50">
          <p className="text-center text-sm text-gray-700 mb-4 font-medium">
            Is this information correct?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onConfirm(false)}
              className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
              aria-label="Go back and correct"
            >
              <Edit2 className="w-4 h-4" />
              Make Corrections
            </button>
            <button
              onClick={() => onConfirm(true)}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              aria-label="Confirm and continue"
            >
              <Check className="w-4 h-4" />
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
