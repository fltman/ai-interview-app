/**
 * AssistantButton Component
 * A prominent button to trigger the voice-guided settings assistant
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

export interface AssistantButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const AssistantButton: React.FC<AssistantButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative w-full
        bg-gradient-to-r from-violet-600 to-fuchsia-600
        hover:from-violet-700 hover:to-fuchsia-700
        disabled:from-gray-700 disabled:to-gray-800
        text-white font-semibold
        px-6 py-4 rounded-xl
        shadow-lg hover:shadow-xl
        transform transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50
        focus:outline-none focus:ring-4 focus:ring-violet-500/30
        ${className}
      `}
      aria-label="Start setup assistant"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-3">
        <Sparkles className="w-6 h-6 animate-pulse" />
        <div className="text-left">
          <div className="text-base sm:text-lg leading-tight">
            Help me configure
          </div>
          <div className="text-xs sm:text-sm opacity-90 font-normal">
            Talk to the AI assistant
          </div>
        </div>
      </div>

      {/* Shine effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transform: 'translateX(-100%)',
          animation: 'shine 2s infinite',
        }}
      />
    </button>
  );
};
