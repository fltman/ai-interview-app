/**
 * useInterview Hook
 * Manages the complete interview flow and state machine
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Question, Answer, TranscriptEntry, Settings } from '../types';
import { generateId } from '../utils/storage';

/**
 * Interview phase state machine
 */
export type InterviewPhase =
  | 'idle'
  | 'connecting'
  | 'greeting'
  | 'questioning'
  | 'confirming'
  | 'generating'
  | 'complete'
  | 'error';

/**
 * Answer with confirmation state
 */
interface AnswerWithConfirmation extends Answer {
  confirmed: boolean;
}

/**
 * Interview state
 */
interface InterviewState {
  phase: InterviewPhase;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Map<string, AnswerWithConfirmation>;
  transcript: TranscriptEntry[];
  currentTranscript: string;
  summary: string;
  error: Error | null;
  startTime?: number;
  endTime?: number;
}

/**
 * Return type for useInterview hook
 */
export interface UseInterviewReturn {
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
  progress: number;
  currentQuestion: Question | null;
  isActive: boolean;

  // Transcript management
  addTranscriptEntry: (speaker: 'ai' | 'user', text: string) => void;
  setCurrentTranscript: (text: string) => void;
}

/**
 * Hook configuration
 */
interface UseInterviewConfig {
  settings: Settings;
  onComplete?: (answers: Answer[], transcript: TranscriptEntry[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Generate AI system prompt based on settings
 */
export function generateSystemPrompt(settings: Settings): string {
  const { language, questions, systemPrompt } = settings;

  const questionsText = questions
    .sort((a, b) => a.order - b.order)
    .map((q, index) => `${index + 1}. ${q.text}`)
    .join('\n');

  const totalQuestions = questions.length;

  return `${systemPrompt}

INTERVIEW LANGUAGE: ${language}

YOU HAVE EXACTLY ${totalQuestions} QUESTIONS TO ASK:
${questionsText}

INTERVIEW PROCESS:
1. Greet the user briefly
2. Ask question 1, wait for answer, confirm with [ANSWER_CONFIRMED:1]
3. Ask question 2, wait for answer, confirm with [ANSWER_CONFIRMED:2]
${questions.map((_, i) => i > 1 ? `${i + 2}. Ask question ${i + 1}, wait for answer, confirm with [ANSWER_CONFIRMED:${i + 1}]` : '').filter(Boolean).join('\n')}
${totalQuestions + 2}. After ALL ${totalQuestions} questions are answered, say [SUMMARY_START] and give a brief summary
${totalQuestions + 3}. When user confirms summary, say [INTERVIEW_COMPLETE]

MANDATORY EVENT SIGNALS - YOU MUST USE THESE EXACTLY:

[ANSWER_CONFIRMED:1] - Say this IMMEDIATELY after user answers question 1
[ANSWER_CONFIRMED:2] - Say this IMMEDIATELY after user answers question 2
[ANSWER_CONFIRMED:3] - Say this IMMEDIATELY after user answers question 3
(continue for all ${totalQuestions} questions)

[SUMMARY_START] - Say this BEFORE giving the final summary
[INTERVIEW_COMPLETE] - Say this AFTER user confirms the summary

EXAMPLE FLOW:
You: "Hello! Let's start. [Question 1 text]?"
User: "[their answer]"
You: "Got it. [ANSWER_CONFIRMED:1] Next question: [Question 2 text]?"
User: "[their answer]"
You: "Thank you. [ANSWER_CONFIRMED:2] Now: [Question 3 text]?"
...continue until all questions done...
You: "[SUMMARY_START] Here's what you told me: [summary]. Is this correct?"
User: "Yes"
You: "Great! [INTERVIEW_COMPLETE] Thank you for your time."

CRITICAL RULES:
- You MUST say [ANSWER_CONFIRMED:X] after EVERY question answer (X = question number)
- You MUST say [SUMMARY_START] before the summary
- You MUST say [INTERVIEW_COMPLETE] when done
- Do NOT skip any signal
- Do NOT combine multiple questions
- Ask questions ONE AT A TIME
- The signals are filtered out - the user won't hear them`;
}

/**
 * Main interview hook
 */
export function useInterview(config: UseInterviewConfig): UseInterviewReturn {
  const { settings, onComplete, onError } = config;

  // Initialize state
  const [state, setState] = useState<InterviewState>({
    phase: 'idle',
    currentQuestionIndex: 0,
    questions: settings.questions.sort((a, b) => a.order - b.order),
    answers: new Map(),
    transcript: [],
    currentTranscript: '',
    summary: '',
    error: null,
  });

  // Track if waiting for confirmation
  const waitingForConfirmation = useRef(false);
  const waitingForSummaryConfirmation = useRef(false);

  /**
   * Add entry to transcript
   */
  const addTranscriptEntry = useCallback((speaker: 'ai' | 'user', text: string) => {
    setState(prev => ({
      ...prev,
      transcript: [
        ...prev.transcript,
        {
          id: generateId(),
          speaker,
          text,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  /**
   * Set current transcript (for real-time updates)
   */
  const setCurrentTranscript = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      currentTranscript: text,
    }));
  }, []);

  /**
   * Move to next question
   */
  const moveToNextQuestion = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentQuestionIndex + 1;

      if (nextIndex >= prev.questions.length) {
        // All questions answered, move to confirming phase
        return {
          ...prev,
          phase: 'confirming',
          currentQuestionIndex: nextIndex,
        };
      }

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        phase: 'questioning',
      };
    });

    waitingForConfirmation.current = false;
  }, []);

  /**
   * Start interview
   */
  const startInterview = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        phase: 'connecting',
        startTime: Date.now(),
        error: null,
      }));

      // Simulate connection delay (in real implementation, this would be the WebRTC connection)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setState(prev => ({
        ...prev,
        phase: 'greeting',
      }));

      // Move to first question after greeting
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          phase: 'questioning',
        }));
      }, 3000); // Give time for AI to greet

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start interview');
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: err,
      }));
      onError?.(err);
    }
  }, [onError]);

  /**
   * Stop interview
   */
  const stopInterview = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'idle',
      endTime: Date.now(),
    }));
  }, []);

  /**
   * Confirm answer
   */
  const confirmAnswer = useCallback((confirmed: boolean) => {
    if (!waitingForConfirmation.current) {
      return;
    }

    if (confirmed) {
      // Save the answer and move to next question
      const currentQuestion = state.questions[state.currentQuestionIndex];
      if (!currentQuestion) {
        return;
      }

      const answerText = state.currentTranscript;

      setState(prev => {
        const newAnswers = new Map(prev.answers);
        newAnswers.set(currentQuestion.id, {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          answerText,
          timestamp: Date.now(),
          confirmed: true,
        });

        return {
          ...prev,
          answers: newAnswers,
          currentTranscript: '',
        };
      });

      moveToNextQuestion();
    } else {
      // Ask the question again
      waitingForConfirmation.current = false;
      setState(prev => ({
        ...prev,
        currentTranscript: '',
      }));
    }
  }, [state.questions, state.currentQuestionIndex, state.currentTranscript, moveToNextQuestion]);

  /**
   * Confirm summary
   */
  const confirmSummary = useCallback((confirmed: boolean) => {
    if (!waitingForSummaryConfirmation.current) {
      return;
    }

    if (confirmed) {
      setState(prev => ({
        ...prev,
        phase: 'generating',
      }));

      // Simulate document generation
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          phase: 'complete',
          endTime: Date.now(),
        }));

        // Convert Map to array for callback
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const answersArray = Array.from(state.answers.values()).map(({ confirmed, ...rest }) => rest);
        onComplete?.(answersArray, state.transcript);
      }, 2000);
    } else {
      // Go back to questioning to allow corrections
      setState(prev => ({
        ...prev,
        phase: 'questioning',
        currentQuestionIndex: 0,
      }));
      waitingForSummaryConfirmation.current = false;
    }
  }, [state.answers, state.transcript, onComplete]);

  /**
   * Retry current question
   */
  const retryQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTranscript: '',
    }));
    waitingForConfirmation.current = false;
  }, []);

  /**
   * Skip current question (if not required)
   */
  const skipQuestion = useCallback(() => {
    // Only allow skipping if question is not required
    // (For now, we'll allow it - in production, check question.required property)
    moveToNextQuestion();
  }, [moveToNextQuestion]);

  /**
   * Detect when user finishes speaking in questioning phase
   */
  useEffect(() => {
    if (state.phase === 'questioning' && state.currentTranscript && !waitingForConfirmation.current) {
      // In a real implementation, this would be triggered by silence detection
      // For now, we set a flag to indicate we're waiting for AI confirmation
      const timer = setTimeout(() => {
        waitingForConfirmation.current = true;
      }, 2000); // Wait 2s of "silence"

      return () => clearTimeout(timer);
    }
  }, [state.phase, state.currentTranscript]);

  /**
   * Handle confirming phase
   */
  useEffect(() => {
    if (state.phase === 'confirming' && !waitingForSummaryConfirmation.current) {
      // Generate summary from answers
      const summaryText = Array.from(state.answers.values())
        .map((answer, index) => `${index + 1}. ${answer.questionText}\n   ${answer.answerText}`)
        .join('\n\n');

      setState(prev => ({
        ...prev,
        summary: summaryText,
      }));

      waitingForSummaryConfirmation.current = true;
    }
  }, [state.phase, state.answers]);

  // Computed values
  const progress = state.questions.length > 0
    ? Math.round((state.currentQuestionIndex / state.questions.length) * 100)
    : 0;

  const currentQuestion = (state.currentQuestionIndex < state.questions.length
    ? state.questions[state.currentQuestionIndex]
    : null) ?? null;

  const isActive = ['connecting', 'greeting', 'questioning', 'confirming', 'generating'].includes(state.phase);

  return {
    // State
    phase: state.phase,
    currentQuestionIndex: state.currentQuestionIndex,
    questions: state.questions,
    answers: state.answers,
    currentTranscript: state.currentTranscript,
    summary: state.summary,
    error: state.error,

    // Actions
    startInterview,
    stopInterview,
    confirmAnswer,
    confirmSummary,
    retryQuestion,
    skipQuestion,

    // Computed
    progress,
    currentQuestion,
    isActive,

    // Transcript management
    addTranscriptEntry,
    setCurrentTranscript,
  };
}
