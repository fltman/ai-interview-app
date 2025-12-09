# Interview Logic Quick Reference

## Import Statements

```typescript
// Hook
import { useInterview, generateSystemPrompt } from '@/hooks';
import type { UseInterviewReturn, InterviewPhase } from '@/hooks';

// Components
import {
  InterviewControls,
  TranscriptDisplay,
  CurrentQuestion,
  SummaryDisplay
} from '@/components/interview';

// Types
import type { Settings, Question, Answer, TranscriptEntry } from '@/types';
```

## Hook Usage

```typescript
const interview = useInterview({
  settings: Settings,
  onComplete?: (answers: Answer[], transcript: TranscriptEntry[]) => void,
  onError?: (error: Error) => void,
});
```

## State Properties

| Property | Type | Description |
|----------|------|-------------|
| `phase` | `InterviewPhase` | Current state (idle, connecting, etc.) |
| `currentQuestionIndex` | `number` | Index of active question |
| `questions` | `Question[]` | All questions (sorted by order) |
| `answers` | `Map<string, Answer>` | Collected answers |
| `currentTranscript` | `string` | Real-time user speech |
| `summary` | `string` | AI-generated summary |
| `error` | `Error \| null` | Error if any |
| `progress` | `number` | Progress percentage (0-100) |
| `currentQuestion` | `Question \| null` | Active question object |
| `isActive` | `boolean` | Whether interview is running |

## Action Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `startInterview` | `() => Promise<void>` | Begin interview |
| `stopInterview` | `() => void` | Stop interview |
| `confirmAnswer` | `(confirmed: boolean) => void` | Confirm/reject current answer |
| `confirmSummary` | `(confirmed: boolean) => void` | Confirm/reject final summary |
| `retryQuestion` | `() => void` | Clear transcript, re-ask |
| `skipQuestion` | `() => void` | Move to next question |
| `addTranscriptEntry` | `(speaker: 'ai' \| 'user', text: string) => void` | Add to transcript |
| `setCurrentTranscript` | `(text: string) => void` | Update real-time transcript |

## Phases

| Phase | Description | isActive |
|-------|-------------|----------|
| `idle` | Ready to start | false |
| `connecting` | Establishing connection | true |
| `greeting` | AI introduction | true |
| `questioning` | Main interview loop | true |
| `confirming` | Review answers | true |
| `generating` | Creating document | true |
| `complete` | Finished successfully | false |
| `error` | Error occurred | false |

## Phase Transitions

```typescript
idle ──start──> connecting ──success──> greeting ──done──> questioning
                    │
                    └──fail──> error

questioning ──all answered──> confirming

confirming ──confirm──> generating ──done──> complete
    │
    └──reject──> questioning (back to first question)

ANY ──error──> error
```

## Component Props

### InterviewControls

```typescript
interface InterviewControlsProps {
  phase: InterviewPhase;
  progress: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onRetry?: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
}
```

### TranscriptDisplay

```typescript
interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  currentTranscript?: string;
  currentSpeaker?: 'ai' | 'user';
  showEmpty?: boolean;
  maxHeight?: string;
}
```

### CurrentQuestion

```typescript
interface CurrentQuestionProps {
  question: Question | null;
  phase: InterviewPhase;
  questionIndex: number;
  totalQuestions: number;
}
```

### SummaryDisplay

```typescript
interface SummaryDisplayProps {
  answers: Map<string, Answer>;
  summary?: string;
  onConfirm: (confirmed: boolean) => void;
  showActions?: boolean;
}
```

## Common Patterns

### Basic Setup

```typescript
const settings = useStorage().loadSettings();
const interview = useInterview({ settings });

return (
  <>
    <InterviewControls {...controlProps} />
    <CurrentQuestion {...questionProps} />
    <TranscriptDisplay {...transcriptProps} />
  </>
);
```

### Phase-Based Rendering

```typescript
{interview.phase === 'idle' && <WelcomeScreen />}
{interview.phase === 'questioning' && <CurrentQuestion ... />}
{interview.phase === 'confirming' && <SummaryDisplay ... />}
{interview.phase === 'complete' && <SuccessScreen />}
```

### Integration with Realtime API

```typescript
// Connect on start
useEffect(() => {
  if (interview.phase === 'connecting') {
    realtimeAPI.connect();
  }
}, [interview.phase]);

// Handle transcription
useEffect(() => {
  if (realtimeAPI.userTranscript) {
    interview.setCurrentTranscript(realtimeAPI.userTranscript);
  }
}, [realtimeAPI.userTranscript]);

// Handle AI messages
useEffect(() => {
  if (realtimeAPI.aiMessage) {
    interview.addTranscriptEntry('ai', realtimeAPI.aiMessage);
  }
}, [realtimeAPI.aiMessage]);
```

### Error Handling

```typescript
const interview = useInterview({
  settings,
  onError: (error) => {
    console.error('Interview error:', error);
    toast.error(error.message);
  }
});

// In JSX
{interview.error && (
  <ErrorAlert message={interview.error.message} />
)}
```

### Completion Handling

```typescript
const interview = useInterview({
  settings,
  onComplete: async (answers, transcript) => {
    // Generate document
    const doc = await generateDocument(answers, settings.documentTemplate);

    // Save to storage
    await saveInterview({
      createdAt: new Date(),
      settings,
      answers,
      transcript: JSON.stringify(transcript),
      document: doc,
      status: 'complete'
    });

    // Navigate to results
    navigate('/results');
  }
});
```

## System Prompt

```typescript
const prompt = generateSystemPrompt(settings);
// Use with Realtime API initialization
```

Generated prompt includes:
- Base personality (from settings.systemPrompt)
- Interview language
- All questions in order
- Step-by-step instructions
- Confirmation protocol

## Answer Access

```typescript
// Get all answers as array
const answersArray = Array.from(interview.answers.values());

// Get specific answer
const answer = interview.answers.get('question-id');

// Check if answered
const hasAnswer = interview.answers.has('question-id');

// Count answers
const answerCount = interview.answers.size;
```

## Progress Calculation

```typescript
progress = (currentQuestionIndex / totalQuestions) * 100

// Examples:
// 0 / 5 = 0%
// 1 / 5 = 20%
// 3 / 5 = 60%
// 5 / 5 = 100%
```

## Confirmation Flow

```typescript
// When user speaks
interview.setCurrentTranscript(userSpeech);

// AI asks "Is that correct?"
// Parse user's yes/no response

// If yes
interview.confirmAnswer(true);
// → Answer saved, move to next question

// If no
interview.confirmAnswer(false);
// → Transcript cleared, ask again
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useInterview } from '@/hooks';

test('should start interview', async () => {
  const { result } = renderHook(() =>
    useInterview({ settings })
  );

  await act(async () => {
    await result.current.startInterview();
  });

  expect(result.current.phase).toBe('connecting');
});
```

## Debugging

```typescript
// Log phase changes
useEffect(() => {
  console.log('Phase:', interview.phase);
}, [interview.phase]);

// Log answers
useEffect(() => {
  console.log('Answers:',
    Array.from(interview.answers.values())
  );
}, [interview.answers]);

// Check state in DevTools
// Component name: useInterview
```

## Common Issues

### Issue: Phase doesn't progress

```typescript
// Check if transitions are triggered
console.log('Current phase:', interview.phase);

// Ensure async operations complete
await interview.startInterview();
```

### Issue: Answers not saved

```typescript
// Ensure confirmAnswer is called
interview.confirmAnswer(true); // Not false

// Check answer was added
console.log('Answer count:', interview.answers.size);
```

### Issue: Transcript not updating

```typescript
// Ensure setCurrentTranscript is called
interview.setCurrentTranscript(text);

// Not addTranscriptEntry (that's for completed messages)
```

## File Locations

```
src/
├── hooks/
│   ├── useInterview.ts              # Main hook
│   ├── INTERVIEW_GUIDE.md          # Detailed guide
│   ├── INTERVIEW_README.md         # Quick start
│   └── __tests__/useInterview.test.ts
│
├── components/interview/
│   ├── InterviewControls.tsx       # Controls
│   ├── TranscriptDisplay.tsx       # Transcript
│   ├── CurrentQuestion.tsx         # Question
│   ├── SummaryDisplay.tsx          # Summary
│   ├── InterviewExample.tsx        # Example
│   └── index.ts                    # Exports
│
└── docs/
    ├── INTERVIEW_FLOW_DIAGRAM.md   # Diagrams
    └── QUICK_REFERENCE.md          # This file
```

## Resources

- **Detailed Documentation**: `src/hooks/INTERVIEW_GUIDE.md`
- **Complete Example**: `src/components/interview/InterviewExample.tsx`
- **Unit Tests**: `src/hooks/__tests__/useInterview.test.ts`
- **Flow Diagrams**: `docs/INTERVIEW_FLOW_DIAGRAM.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
