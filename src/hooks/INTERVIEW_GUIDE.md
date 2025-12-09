# Interview Logic Guide

This guide explains the interview flow logic and state management implemented in `useInterview.ts`.

## Overview

The interview system uses a state machine approach with clearly defined phases and transitions. It manages question sequencing, answer collection, confirmation flows, and document generation triggers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     useInterview Hook                        │
├─────────────────────────────────────────────────────────────┤
│  - Phase state machine                                      │
│  - Question sequencing                                      │
│  - Answer validation & confirmation                         │
│  - Transcript management                                    │
│  - Progress calculation                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ├── InterviewControls
                           ├── CurrentQuestion
                           ├── TranscriptDisplay
                           └── SummaryDisplay
```

## Interview Phases

### State Machine Flow

```
IDLE → CONNECTING → GREETING → QUESTIONING → CONFIRMING → GENERATING → COMPLETE
  ↓                                ↓              ↓
ERROR ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┴─ ─ ─ ─ ─ ─ ─ ┘
```

### Phase Descriptions

#### 1. IDLE
- **Purpose**: Initial state, waiting for user to start
- **UI**: Show "Start Interview" button
- **Actions**: None
- **Transitions**: → CONNECTING (on start)

#### 2. CONNECTING
- **Purpose**: Establishing connection to OpenAI Realtime API
- **UI**: Show loading spinner, "Connecting to AI..."
- **Actions**: Initialize WebRTC connection
- **Transitions**: → GREETING (on success), → ERROR (on failure)

#### 3. GREETING
- **Purpose**: AI introduces itself and explains the process
- **UI**: Show AI avatar, display greeting message
- **Actions**: AI speaks greeting message
- **Transitions**: → QUESTIONING (after greeting completes)

#### 4. QUESTIONING
- **Purpose**: Main interview loop - ask questions and collect answers
- **UI**: Show current question, recording indicator, transcript
- **Actions**:
  - Display current question
  - Listen for user response
  - Confirm understanding
  - Store confirmed answer
- **Transitions**:
  - → QUESTIONING (next question)
  - → CONFIRMING (all questions answered)
  - → ERROR (on failure)

#### 5. CONFIRMING
- **Purpose**: Review all answers with user
- **UI**: Show summary of all Q&A, confirmation buttons
- **Actions**:
  - Display all questions and answers
  - Wait for user confirmation
- **Transitions**:
  - → GENERATING (on confirm)
  - → QUESTIONING (on reject, back to question 1)

#### 6. GENERATING
- **Purpose**: Create document from answers
- **UI**: Show progress spinner, "Generating document..."
- **Actions**: Trigger document generation
- **Transitions**: → COMPLETE (when done)

#### 7. COMPLETE
- **Purpose**: Interview finished successfully
- **UI**: Show success message, download/share options
- **Actions**: None
- **Transitions**: None (terminal state)

#### 8. ERROR
- **Purpose**: Something went wrong
- **UI**: Show error message, retry option
- **Actions**: Display error details
- **Transitions**: → IDLE (on retry)

## Question Flow Logic

### Asking a Question

```typescript
1. AI: "Question 1: Can you introduce yourself?"
   → User speaks
   → Transcript captured in real-time

2. AI: "Let me confirm. You said [summary]. Is that correct?"
   → Wait for user response

3a. User: "Yes"
    → Save answer, move to next question

3b. User: "No" / "Let me clarify"
    → Clear transcript, re-ask question
```

### Implementation

```typescript
const interview = useInterview({
  settings,
  onComplete: (answers, transcript) => {
    // Handle completion
    generateDocument(answers);
  },
  onError: (error) => {
    // Handle errors
    console.error(error);
  }
});

// In component
<button onClick={interview.startInterview}>Start</button>

// Listen for user speech (from Realtime API)
useEffect(() => {
  if (userSpeech) {
    interview.setCurrentTranscript(userSpeech);
  }
}, [userSpeech]);

// When AI asks for confirmation
useEffect(() => {
  if (aiMessage.includes('Is that correct?')) {
    // User will respond yes/no
    // Parse response and call:
    interview.confirmAnswer(confirmed);
  }
}, [aiMessage]);
```

## Answer Management

### Answer Structure

```typescript
interface AnswerWithConfirmation extends Answer {
  questionId: string;
  questionText: string;
  answerText: string;
  timestamp: number;
  confirmed: boolean;  // Internal tracking
}
```

### Storage

Answers are stored in a `Map<string, AnswerWithConfirmation>` for O(1) lookup by question ID.

### Validation

- Answers must be confirmed before moving to next question
- Empty answers trigger retry
- Users can request clarification at any time

## System Prompt Generation

The `generateSystemPrompt()` function creates AI instructions including:

1. **Base personality**: Friendly, professional interviewer
2. **Language setting**: Interview language preference
3. **Question list**: All questions in order
4. **Process instructions**: Step-by-step flow
5. **Confirmation protocol**: How to validate answers

### Example Output

```
You are a professional interviewer conducting a voice-based interview...

INTERVIEW LANGUAGE: en-US

QUESTIONS TO ASK:
1. Can you introduce yourself and tell me about your background?
2. What are your main goals and objectives?
3. What challenges or obstacles do you face?

INTERVIEW PROCESS:
1. Start with a friendly greeting...
2. Ask questions one at a time...
3. After each response, confirm understanding...
...
```

## Integration with Realtime API

The useInterview hook is designed to work with `useRealtimeAPI`:

```typescript
// In InterviewPage.tsx
const settings = useStorage().loadSettings();
const interview = useInterview({ settings });
const realtime = useRealtimeAPI({
  apiKey: settings.apiKey,
  voice: settings.voice,
  instructions: generateSystemPrompt(settings),
});

// Connect interview to realtime
useEffect(() => {
  if (interview.phase === 'connecting') {
    realtime.connect();
  }
}, [interview.phase]);

// Handle transcription
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

## Progress Calculation

```typescript
progress = (currentQuestionIndex / totalQuestions) * 100
```

- During questioning: Shows actual progress
- During confirming: 100%
- During generating: 100% (can show indeterminate)

## Error Handling

Errors are captured and stored in state:

```typescript
try {
  await startInterview();
} catch (error) {
  setState(prev => ({
    ...prev,
    phase: 'error',
    error: error instanceof Error ? error : new Error('Unknown error')
  }));
  onError?.(error);
}
```

## Best Practices

### 1. Always validate answers
```typescript
if (confirmed) {
  // Only save after confirmation
  saveAnswer(currentQuestion, currentTranscript);
}
```

### 2. Handle silence detection
```typescript
// In real implementation with Realtime API
const silenceTimeout = setTimeout(() => {
  // User stopped speaking
  waitingForConfirmation.current = true;
}, 2000);
```

### 3. Provide clear feedback
```typescript
// Use phase to show appropriate UI
{phase === 'questioning' && <CurrentQuestion {...} />}
{phase === 'confirming' && <SummaryDisplay {...} />}
```

### 4. Enable corrections
```typescript
// Always allow going back
const confirmSummary = (confirmed: boolean) => {
  if (!confirmed) {
    // Reset to first question
    setState(prev => ({ ...prev, phase: 'questioning', currentQuestionIndex: 0 }));
  }
};
```

## Testing the Flow

### Manual Testing Checklist

- [ ] Start interview transitions to connecting
- [ ] Greeting phase displays correctly
- [ ] First question appears
- [ ] User can provide answer
- [ ] AI confirms understanding
- [ ] Incorrect confirmation triggers retry
- [ ] Correct confirmation moves to next question
- [ ] All questions cycle through
- [ ] Summary displays all answers
- [ ] Rejecting summary goes back to start
- [ ] Confirming summary generates document
- [ ] Complete phase shows success

### Unit Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useInterview } from './useInterview';

test('should start in idle phase', () => {
  const { result } = renderHook(() => useInterview({ settings }));
  expect(result.current.phase).toBe('idle');
});

test('should transition through phases', async () => {
  const { result } = renderHook(() => useInterview({ settings }));

  await act(async () => {
    await result.current.startInterview();
  });

  expect(result.current.phase).toBe('connecting');
  // Wait for greeting
  // ... etc
});
```

## Common Issues

### Issue: Phase doesn't progress
**Solution**: Check that transitions are properly triggered. Use console.log or React DevTools to track phase changes.

### Issue: Answers not saved
**Solution**: Ensure `confirmAnswer(true)` is called. Check that the answer Map is being updated correctly.

### Issue: Summary is empty
**Solution**: Verify answers were confirmed and stored before reaching confirming phase.

## Future Enhancements

1. **Skip optional questions**: Add `required` field to Question type
2. **Multi-language support**: Detect user language, translate questions
3. **Audio playback**: Review recorded answers
4. **Partial saves**: Save draft after each answer
5. **Question branching**: Conditional follow-up questions
6. **Time limits**: Auto-move after timeout
7. **Voice activity detection**: Better silence handling
8. **Emotion detection**: Adjust AI tone based on user sentiment
