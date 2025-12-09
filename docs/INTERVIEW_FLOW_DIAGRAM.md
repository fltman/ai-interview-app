# Interview Flow Diagrams

## State Machine Overview

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    │         INTERVIEW STATES            │
                    │                                     │
                    └─────────────────────────────────────┘
                                     │
                                     ↓
        ┌────────────────────────────────────────────────────────┐
        │                                                        │
        │  ┌──────┐    ┌────────────┐    ┌──────────┐         │
        │  │ IDLE │───→│ CONNECTING │───→│ GREETING │         │
        │  └──────┘    └────────────┘    └──────────┘         │
        │      │             │                  │               │
        │      │             ↓                  ↓               │
        │      │         ┌───────┐      ┌──────────────┐      │
        │      │         │ ERROR │      │ QUESTIONING  │←──┐  │
        │      │         └───────┘      └──────┬───────┘   │  │
        │      │             ↑                  │            │  │
        │      │             │                  ↓            │  │
        │      │             │          ┌──────────────┐    │  │
        │      └─────────────┼──────────│ CONFIRMING   │────┘  │
        │                    │          └──────┬───────┘       │
        │                    │                 │                │
        │                    │                 ↓                │
        │                    │          ┌──────────────┐       │
        │                    │          │ GENERATING   │       │
        │                    │          └──────┬───────┘       │
        │                    │                 │                │
        │                    │                 ↓                │
        │                    │          ┌──────────────┐       │
        │                    └──────────│   COMPLETE   │       │
        │                               └──────────────┘       │
        │                                                        │
        └────────────────────────────────────────────────────────┘
```

## Detailed Question Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                      QUESTIONING PHASE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Display Question                                           │
│     ┌─────────────────────────────────────────┐              │
│     │ Current Question: "Tell me about..."     │              │
│     └─────────────────────────────────────────┘              │
│                      ↓                                          │
│  2. AI Asks Question (via Realtime API)                       │
│     ┌─────────────────────────────────────────┐              │
│     │ AI: "Question 1: Tell me about..."       │              │
│     └─────────────────────────────────────────┘              │
│                      ↓                                          │
│  3. User Speaks                                                │
│     ┌─────────────────────────────────────────┐              │
│     │ User: "I am a developer with..."         │              │
│     │ [Real-time transcript update]            │              │
│     └─────────────────────────────────────────┘              │
│                      ↓                                          │
│  4. Silence Detected (user stops)                             │
│     waitingForConfirmation = true                              │
│                      ↓                                          │
│  5. AI Confirms Understanding                                 │
│     ┌─────────────────────────────────────────┐              │
│     │ AI: "Let me confirm. You are a          │              │
│     │      developer with... Is that correct?"  │              │
│     └─────────────────────────────────────────┘              │
│                      ↓                                          │
│  6. User Confirms                                              │
│     ┌──────────────┬──────────────┐                          │
│     │              │              │                          │
│     ↓              ↓              ↓                          │
│  YES           CLARIFY          NO                           │
│     │              │              │                          │
│     ↓              ↓              ↓                          │
│  Save Answer    Clear &        Clear &                       │
│     │           Re-ask        Re-ask                         │
│     ↓              │              │                          │
│  Next Question     └──────────────┘                          │
│     │                     ↑                                    │
│     │                     │                                    │
│     └─────────────────────┘                                    │
│                                                                 │
│  Repeat until all questions answered                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────────┐
│                         InterviewPage                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐                                         │
│  │  useInterview()    │                                         │
│  │  ┌──────────────┐  │                                         │
│  │  │ State        │  │                                         │
│  │  │ - phase      │  │                                         │
│  │  │ - questions  │  │                                         │
│  │  │ - answers    │  │                                         │
│  │  │ - transcript │  │                                         │
│  │  └──────────────┘  │                                         │
│  └─────────┬──────────┘                                         │
│            │                                                     │
│            │  Provides state & actions                          │
│            │                                                     │
│  ┌─────────┴──────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐           │   │
│  │  │ InterviewControls│  │ CurrentQuestion  │           │   │
│  │  │ - Start/Stop     │  │ - Display Q      │           │   │
│  │  │ - Progress bar   │  │ - Question #     │           │   │
│  │  │ - Mic indicator  │  └──────────────────┘           │   │
│  │  └──────────────────┘                                   │   │
│  │                                                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐           │   │
│  │  │ TranscriptDisplay│  │ SummaryDisplay   │           │   │
│  │  │ - Conversation   │  │ - Review answers │           │   │
│  │  │ - Auto-scroll    │  │ - Confirm/Reject │           │   │
│  │  └──────────────────┘  └──────────────────┘           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────┐                                         │
│  │ useRealtimeAPI()   │                                         │
│  │ - WebRTC connect   │                                         │
│  │ - Audio stream     │                                         │
│  │ - Transcription    │                                         │
│  └────────────────────┘                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. User Action
   ↓
   [Click "Start Interview"]
   ↓
2. Hook Action
   ↓
   useInterview.startInterview()
   ↓
3. State Update
   ↓
   setState({ phase: 'connecting' })
   ↓
4. Component Re-render
   ↓
   <InterviewControls phase="connecting" />
   ↓
5. UI Update
   ↓
   [Show loading spinner, "Connecting..."]

────────────────────────────────────────────────────────────────

1. Realtime API Event
   ↓
   [User speech detected]
   ↓
2. Transcript Update
   ↓
   realtimeAPI.onTranscript(text)
   ↓
3. Hook Update
   ↓
   interview.setCurrentTranscript(text)
   ↓
4. State Update
   ↓
   setState({ currentTranscript: text })
   ↓
5. Component Re-render
   ↓
   <TranscriptDisplay currentTranscript={text} />
   ↓
6. UI Update
   ↓
   [Show real-time transcript with pulse effect]

────────────────────────────────────────────────────────────────

1. Confirmation Trigger
   ↓
   [Silence detected OR user says "yes"]
   ↓
2. Hook Action
   ↓
   interview.confirmAnswer(true)
   ↓
3. State Updates (multiple)
   ↓
   - Save answer to Map
   - Increment currentQuestionIndex
   - Clear currentTranscript
   - Update phase if last question
   ↓
4. Component Re-renders
   ↓
   - <CurrentQuestion> shows next question
   - <InterviewControls> updates progress
   - <TranscriptDisplay> adds entry
   ↓
5. UI Updates
   ↓
   [Show next question, update progress bar]
```

## Answer Storage Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANSWER STORAGE                              │
└─────────────────────────────────────────────────────────────────┘

Map<string, AnswerWithConfirmation>
│
├─ "q1" → {
│    questionId: "q1",
│    questionText: "Tell me about yourself?",
│    answerText: "I am a developer with 5 years experience...",
│    timestamp: 1234567890,
│    confirmed: true
│  }
│
├─ "q2" → {
│    questionId: "q2",
│    questionText: "What are your goals?",
│    answerText: "I want to build great products...",
│    timestamp: 1234567920,
│    confirmed: true
│  }
│
└─ "q3" → { ... }

↓ (when complete)

Convert to Array<Answer> for callbacks/storage:
[
  { questionId: "q1", questionText: "...", answerText: "...", timestamp: ... },
  { questionId: "q2", questionText: "...", answerText: "...", timestamp: ... },
  { questionId: "q3", questionText: "...", answerText: "...", timestamp: ... }
]
```

## Progress Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROGRESS CALCULATION                          │
└─────────────────────────────────────────────────────────────────┘

Questions: [Q1, Q2, Q3, Q4, Q5]
           Total: 5

State: currentQuestionIndex = 0
       ↓
       Progress = (0 / 5) × 100 = 0%
       UI: [                    ] 0/5

State: currentQuestionIndex = 1 (Q1 answered)
       ↓
       Progress = (1 / 5) × 100 = 20%
       UI: [████                ] 1/5

State: currentQuestionIndex = 2 (Q2 answered)
       ↓
       Progress = (2 / 5) × 100 = 40%
       UI: [████████            ] 2/5

State: currentQuestionIndex = 5 (All answered)
       ↓
       Progress = (5 / 5) × 100 = 100%
       UI: [████████████████████] 5/5
       Phase: 'confirming'
```

## Timeline View

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERVIEW TIMELINE                           │
└─────────────────────────────────────────────────────────────────┘

t=0s    │ [User clicks Start]
        │ Phase: idle → connecting
        │
t=1s    │ [WebRTC connected]
        │ Phase: connecting → greeting
        │
t=4s    │ AI: "Hello! Welcome to the interview..."
        │ Phase: greeting → questioning
        │
t=8s    │ AI: "Let's begin. Question 1: Tell me about yourself?"
        │ currentQuestionIndex: 0
        │
t=10s   │ User: "I am a software developer..."
        │ currentTranscript: updating in real-time
        │
t=25s   │ [User stops speaking]
        │ waitingForConfirmation: true
        │
t=27s   │ AI: "Let me confirm. You are a software developer... Correct?"
        │
t=30s   │ User: "Yes"
        │ confirmAnswer(true)
        │ answers.set('q1', { ... })
        │ currentQuestionIndex: 1
        │
t=32s   │ AI: "Great! Question 2: What are your goals?"
        │ [Repeat cycle]
        │
t=150s  │ [All questions answered]
        │ Phase: questioning → confirming
        │
t=152s  │ AI: "Let me summarize your answers..."
        │ summary: generated
        │
t=165s  │ User: [Reviews summary] "Looks good!"
        │ confirmSummary(true)
        │ Phase: confirming → generating
        │
t=167s  │ [Document generation starts]
        │
t=170s  │ [Document complete]
        │ Phase: generating → complete
        │ onComplete callback fired
        │
t=172s  │ [User downloads/shares document]
        │ Interview finished
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                             │
└─────────────────────────────────────────────────────────────────┘

Happy Path:
  idle → connecting → greeting → ... → complete

Error Scenarios:

1. Connection Failure:
   idle → connecting ✗
                ↓
              error
   UI: "Failed to connect. Please check your API key."
   Action: [Retry] → idle

2. API Error During Interview:
   questioning ✗
        ↓
      error
   UI: "An error occurred. Your progress has been saved."
   Action: [Resume] → questioning (same question)

3. Network Interruption:
   ANY_PHASE ✗
        ↓
      error
   UI: "Connection lost. Attempting to reconnect..."
   Action: Auto-retry → previous phase

4. User Cancellation:
   ANY_ACTIVE_PHASE
        ↓
   [User clicks Stop]
        ↓
      idle
   UI: "Interview stopped. Progress saved."
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│               INTEGRATION ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   InterviewPage │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌──────────┐  ┌──────────────┐
│useInterview│ │useRealtimeAPI│
└─────┬──────┘ └──────┬───────┘
      │                │
      │ ←─── Events ───┤
      │                │
      │ Commands ─────→│
      │                │
      ↓                ↓
┌──────────────────────────────┐
│    OpenAI Realtime API       │
│    (WebRTC Connection)       │
└──────────────────────────────┘

Integration Points:

1. Phase Changes:
   useInterview.phase === 'connecting'
   → realtimeAPI.connect()

2. User Speech:
   realtimeAPI.onUserTranscript(text)
   → interview.setCurrentTranscript(text)

3. AI Messages:
   realtimeAPI.onAIMessage(message)
   → interview.addTranscriptEntry('ai', message)

4. Confirmations:
   Detect "yes"/"no" in AI message
   → interview.confirmAnswer(boolean)

5. System Instructions:
   generateSystemPrompt(settings)
   → realtimeAPI.setInstructions(prompt)
```
