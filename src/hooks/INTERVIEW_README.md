# Interview Logic Implementation

Complete implementation of the AI Interview App's interview flow and state management.

## Files Created

### Core Hook
- **`useInterview.ts`** - Main interview state management hook
  - State machine with 8 phases
  - Question sequencing logic
  - Answer validation and confirmation
  - Progress tracking
  - Error handling

### UI Components
- **`InterviewControls.tsx`** - Controls for starting, stopping, retrying
  - Phase-aware button states
  - Progress bar
  - Microphone status indicator

- **`TranscriptDisplay.tsx`** - Conversation history display
  - Real-time transcript updates
  - Speaker distinction (AI vs User)
  - Auto-scroll to latest message
  - Timestamp display

- **`CurrentQuestion.tsx`** - Active question display
  - Question text
  - Question number indicator
  - Phase-aware visibility

- **`SummaryDisplay.tsx`** - Interview summary for confirmation
  - All Q&A pairs displayed
  - AI-generated summary
  - Confirm/reject actions

### Example & Documentation
- **`InterviewExample.tsx`** - Complete integration example
- **`INTERVIEW_GUIDE.md`** - Comprehensive guide
- **`INTERVIEW_README.md`** - This file
- **`__tests__/useInterview.test.ts`** - Unit tests

### Exports
- **`components/interview/index.ts`** - Component exports
- **`hooks/index.ts`** - Hook exports (updated)

## Quick Start

### 1. Basic Usage

```typescript
import { useInterview, generateSystemPrompt } from '@/hooks';
import { InterviewControls, TranscriptDisplay, CurrentQuestion } from '@/components/interview';

function InterviewPage() {
  const settings = useStorage().loadSettings();

  const interview = useInterview({
    settings,
    onComplete: (answers, transcript) => {
      console.log('Interview complete!', answers);
      // Generate document
    },
    onError: (error) => {
      console.error('Interview error:', error);
    }
  });

  return (
    <div>
      <InterviewControls
        phase={interview.phase}
        progress={interview.progress}
        currentQuestionIndex={interview.currentQuestionIndex}
        totalQuestions={interview.questions.length}
        isActive={interview.isActive}
        onStart={interview.startInterview}
        onStop={interview.stopInterview}
      />

      <CurrentQuestion
        question={interview.currentQuestion}
        phase={interview.phase}
        questionIndex={interview.currentQuestionIndex}
        totalQuestions={interview.questions.length}
      />

      <TranscriptDisplay
        transcript={interview.transcript}
        currentTranscript={interview.currentTranscript}
      />
    </div>
  );
}
```

### 2. With Realtime API Integration

```typescript
const interview = useInterview({ settings });
const realtime = useRealtimeAPI({
  apiKey: settings.apiKey,
  voice: settings.voice,
  instructions: generateSystemPrompt(settings),
});

// Connect when interview starts
useEffect(() => {
  if (interview.phase === 'connecting') {
    realtime.connect();
  }
}, [interview.phase]);

// Handle user speech
useEffect(() => {
  if (realtime.userTranscript) {
    interview.setCurrentTranscript(realtime.userTranscript);
  }
}, [realtime.userTranscript]);

// Handle AI messages
useEffect(() => {
  if (realtime.aiMessage) {
    interview.addTranscriptEntry('ai', realtime.aiMessage);
  }
}, [realtime.aiMessage]);
```

## Interview Flow

```
1. User clicks "Start Interview"
   ↓
2. CONNECTING: WebRTC connection established
   ↓
3. GREETING: AI says hello, explains process
   ↓
4. QUESTIONING: Loop through questions
   │
   ├─→ AI asks question
   ├─→ User answers (speech → transcript)
   ├─→ AI confirms understanding
   ├─→ User confirms (yes → save, no → retry)
   └─→ Next question
   ↓
5. CONFIRMING: Show summary of all answers
   │
   ├─→ User reviews
   └─→ Confirm (yes → generate, no → back to Q1)
   ↓
6. GENERATING: Create document
   ↓
7. COMPLETE: Show result, download/share
```

## State Machine

### Phases

| Phase | Description | UI State | Transitions |
|-------|-------------|----------|-------------|
| `idle` | Ready to start | Show start button | → `connecting` |
| `connecting` | Establishing connection | Loading spinner | → `greeting` or `error` |
| `greeting` | AI greeting | AI speaking | → `questioning` |
| `questioning` | Main interview loop | Show question, record | → `questioning`, `confirming`, or `error` |
| `confirming` | Review answers | Show summary | → `generating` or `questioning` |
| `generating` | Creating document | Loading spinner | → `complete` |
| `complete` | Finished | Success message | Terminal |
| `error` | Something failed | Error message | → `idle` (retry) |

### Computed Values

```typescript
interface UseInterviewReturn {
  // State
  phase: InterviewPhase;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Map<string, AnswerWithConfirmation>;
  currentTranscript: string;
  summary: string;
  error: Error | null;

  // Actions
  startInterview: () => Promise<void>;
  stopInterview: () => void;
  confirmAnswer: (confirmed: boolean) => void;
  confirmSummary: (confirmed: boolean) => void;
  retryQuestion: () => void;
  skipQuestion: () => void;

  // Computed
  progress: number;               // 0-100
  currentQuestion: Question | null;
  isActive: boolean;

  // Transcript
  addTranscriptEntry: (speaker: 'ai' | 'user', text: string) => void;
  setCurrentTranscript: (text: string) => void;
}
```

## Components

### InterviewControls

Displays interview controls and status.

**Props:**
- `phase`: Current interview phase
- `progress`: Progress percentage (0-100)
- `currentQuestionIndex`: Index of current question
- `totalQuestions`: Total number of questions
- `isActive`: Whether interview is in progress
- `onStart`: Start button handler
- `onStop`: Stop button handler
- `onRetry?`: Retry current question
- `onSkip?`: Skip current question
- `canSkip?`: Whether skip is allowed

### TranscriptDisplay

Shows conversation history.

**Props:**
- `transcript`: Array of transcript entries
- `currentTranscript?`: Real-time transcript (user still speaking)
- `currentSpeaker?`: 'ai' or 'user'
- `showEmpty?`: Show empty state when no transcript
- `maxHeight?`: CSS max-height value

### CurrentQuestion

Displays the active question.

**Props:**
- `question`: Current question or null
- `phase`: Current interview phase
- `questionIndex`: Current question index
- `totalQuestions`: Total questions

### SummaryDisplay

Shows interview summary for confirmation.

**Props:**
- `answers`: Map of answers
- `summary?`: AI-generated summary text
- `onConfirm`: Callback with boolean (confirmed or not)
- `showActions?`: Whether to show confirm/reject buttons

## System Prompt

The `generateSystemPrompt()` function creates detailed AI instructions:

```typescript
const prompt = generateSystemPrompt(settings);
// Returns:
// - Base personality from settings.systemPrompt
// - Interview language setting
// - Complete list of questions
// - Step-by-step process instructions
// - Confirmation protocol details
```

Use this prompt when initializing the Realtime API.

## Testing

Run tests:
```bash
npm test -- useInterview
```

Tests cover:
- ✓ Phase transitions
- ✓ Question sequencing
- ✓ Answer confirmation
- ✓ Progress calculation
- ✓ Transcript management
- ✓ Summary generation
- ✓ Completion callback
- ✓ Error handling

## Progress Tracking

```typescript
// Progress is calculated as:
progress = (currentQuestionIndex / totalQuestions) * 100

// Examples:
// 0 of 3 questions → 0%
// 1 of 3 questions → 33%
// 2 of 3 questions → 67%
// 3 of 3 questions → 100%
```

## Answer Management

Answers are stored in a Map for efficient lookups:

```typescript
const answers = new Map<string, AnswerWithConfirmation>();

// Add answer
answers.set(questionId, {
  questionId: 'q1',
  questionText: 'What is your name?',
  answerText: 'My name is John',
  timestamp: Date.now(),
  confirmed: true
});

// Retrieve answer
const answer = answers.get('q1');

// Convert to array for callbacks
const answersArray = Array.from(answers.values());
```

## Error Handling

Errors are caught and stored in state:

```typescript
try {
  await interview.startInterview();
} catch (error) {
  // Error is captured in interview.error
  // onError callback is called
}

// In UI:
{interview.error && (
  <div className="error">
    {interview.error.message}
  </div>
)}
```

## Best Practices

### 1. Always confirm before saving
```typescript
// Don't save immediately
interview.setCurrentTranscript(userSpeech);

// Wait for AI confirmation, then:
interview.confirmAnswer(true); // or false to retry
```

### 2. Handle all phases in UI
```typescript
{phase === 'idle' && <StartButton />}
{phase === 'connecting' && <LoadingSpinner />}
{phase === 'greeting' && <Greeting />}
{phase === 'questioning' && <Question />}
{phase === 'confirming' && <Summary />}
{phase === 'generating' && <Loading />}
{phase === 'complete' && <Success />}
{phase === 'error' && <ErrorMessage />}
```

### 3. Provide clear feedback
```typescript
// Show what's happening
<InterviewControls phase={interview.phase} ... />

// Show current question
<CurrentQuestion question={interview.currentQuestion} ... />

// Show conversation history
<TranscriptDisplay transcript={interview.transcript} ... />
```

### 4. Enable corrections
```typescript
// In confirming phase
<SummaryDisplay
  answers={interview.answers}
  onConfirm={(confirmed) => {
    if (!confirmed) {
      // User can go back and fix answers
      interview.confirmSummary(false);
    }
  }}
/>
```

## Next Steps

1. **Integrate with useRealtimeAPI** - Connect to OpenAI for actual voice interaction
2. **Add document generation** - Implement template-based document creation
3. **Add persistence** - Save interview progress to IndexedDB
4. **Add audio playback** - Review recorded answers
5. **Add translations** - Support target language translation
6. **Add analytics** - Track interview metrics

## Support

- See `INTERVIEW_GUIDE.md` for detailed documentation
- See `InterviewExample.tsx` for complete integration example
- Run tests for implementation verification

## License

Part of the AI Interview App project.
