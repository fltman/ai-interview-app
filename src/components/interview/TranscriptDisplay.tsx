/**
 * TranscriptDisplay Component
 * Shows conversation history with speaker distinction and auto-scroll
 */

import { useEffect, useRef } from 'react';
import { TranscriptEntry } from '../../types';

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  currentTranscript?: string;
  currentSpeaker?: 'ai' | 'user';
  showEmpty?: boolean;
  maxHeight?: string;
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * TranscriptEntry component
 */
function TranscriptEntryItem({ entry }: { entry: TranscriptEntry }) {
  return (
    <div
      className={`p-3 rounded-lg transition-all duration-200 ${
        entry.speaker === 'ai'
          ? 'bg-violet-500/10 text-gray-200 border border-violet-500/20'
          : 'bg-gray-800 text-gray-200 border border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium uppercase tracking-wide">
          {entry.speaker === 'ai' ? (
            <span className="text-violet-400">AI Interviewer</span>
          ) : (
            <span className="text-gray-400">You</span>
          )}
        </div>
        <time className="text-xs text-gray-500" dateTime={new Date(entry.timestamp).toISOString()}>
          {formatTime(entry.timestamp)}
        </time>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>
    </div>
  );
}

/**
 * Current transcript (real-time updates)
 */
function CurrentTranscript({
  text,
  speaker,
}: {
  text: string;
  speaker: 'ai' | 'user';
}) {
  return (
    <div
      className={`p-3 rounded-lg animate-pulse border-2 ${
        speaker === 'ai'
          ? 'bg-violet-500/20 text-gray-200 border-violet-500/40'
          : 'bg-gray-800/50 text-gray-200 border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium uppercase tracking-wide">
          {speaker === 'ai' ? (
            <span className="text-violet-400">AI Interviewer</span>
          ) : (
            <span className="text-gray-400">You</span>
          )}
        </div>
        <span className="text-xs text-gray-500">Speaking...</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {text || '...'}
      </p>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <p className="text-sm">Conversation will appear here</p>
      <p className="text-xs mt-1 text-gray-600">Start the interview to begin</p>
    </div>
  );
}

export default function TranscriptDisplay({
  transcript,
  currentTranscript,
  currentSpeaker,
  showEmpty = true,
  maxHeight = '24rem',
}: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasContent = transcript.length > 0 || currentTranscript;

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentTranscript]);

  if (!hasContent && showEmpty) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Transcript</h2>
        <EmptyState />
      </div>
    );
  }

  if (!hasContent && !showEmpty) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-200">Transcript</h2>
        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
          {transcript.length} {transcript.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="space-y-3 overflow-y-auto scroll-smooth"
        style={{ maxHeight }}
      >
        {transcript.map((entry) => (
          <TranscriptEntryItem key={entry.id} entry={entry} />
        ))}

        {currentTranscript && currentSpeaker && (
          <CurrentTranscript text={currentTranscript} speaker={currentSpeaker} />
        )}
      </div>
    </div>
  );
}
