import { ArrowLeft, Download } from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { generateSystemPrompt } from '../hooks/useInterview'
import { useRealtimeAPI, RealtimeEventCallbacks } from '../hooks/useRealtimeAPI'
import { useToast } from '../components/ui/Toast'
import InterviewControls from '../components/interview/InterviewControls'
import TranscriptDisplay from '../components/interview/TranscriptDisplay'
import CurrentQuestion from '../components/interview/CurrentQuestion'
import { DocumentPreview } from '../components/interview/DocumentPreview'
import type { TranscriptEntry, Answer, Settings } from '../types'
import type { InterviewPhase } from '../hooks/useInterview'

interface InterviewPageProps {
  onNavigate: (route: 'home' | 'settings' | 'interview') => void
  settings: Settings
}

export default function InterviewPage({ onNavigate, settings }: InterviewPageProps) {
  const { success, error: showError } = useToast()

  // Interview state
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [showDocument, setShowDocument] = useState(false)
  const [conversationTranscript, setConversationTranscript] = useState<TranscriptEntry[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map())
  const [summary, setSummary] = useState<string>('')

  // Realtime API hook
  const realtimeAPI = useRealtimeAPI()

  // Refs for tracking - use refs so callbacks always have latest values
  const userResponseCountRef = useRef(0)
  const questionsRef = useRef(settings.questions)
  const realtimeAPIRef = useRef(realtimeAPI)

  // Keep refs in sync
  useEffect(() => {
    questionsRef.current = settings.questions
  }, [settings.questions])

  useEffect(() => {
    realtimeAPIRef.current = realtimeAPI
  }, [realtimeAPI])

  /**
   * Parse ALL event signals from AI speech (there can be multiple!)
   * Returns array of signals found
   */
  const parseEventSignals = useCallback((text: string): Array<{ type: string; questionNum?: number }> => {
    const signals: Array<{ type: string; questionNum?: number }> = []

    // Check for answer confirmed: [ANSWER_CONFIRMED:1]
    const answerMatch = text.match(/\[ANSWER_CONFIRMED:(\d+)\]/)
    if (answerMatch && answerMatch[1]) {
      signals.push({ type: 'answer_confirmed', questionNum: parseInt(answerMatch[1], 10) })
    }

    // Check for summary start
    if (text.includes('[SUMMARY_START]')) {
      signals.push({ type: 'summary_start' })
    }

    // Check for interview complete
    if (text.includes('[INTERVIEW_COMPLETE]')) {
      signals.push({ type: 'complete' })
    }

    // Check for correction needed
    if (text.includes('[CORRECTION_NEEDED]')) {
      signals.push({ type: 'correction' })
    }

    return signals
  }, [])

  /**
   * Remove event signals from text for display
   */
  const cleanTextForDisplay = useCallback((text: string): string => {
    return text
      .replace(/\[ANSWER_CONFIRMED:\d+\]/g, '')
      .replace(/\[SUMMARY_START\]/g, '')
      .replace(/\[INTERVIEW_COMPLETE\]/g, '')
      .replace(/\[CORRECTION_NEEDED\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])

  // Track all user responses in order (for building answers at the end)
  const userResponsesRef = useRef<string[]>([])
  // Track the last recorded answer for the current question
  const lastAnswerRef = useRef<string>('')
  // Track if we're collecting summary text
  const isCollectingSummaryRef = useRef(false)
  const summaryTextRef = useRef<string>('')

  /**
   * Build answers Map from collected user responses and questions
   */
  const buildAnswersFromResponses = useCallback(() => {
    const questions = questionsRef.current
    const responses = userResponsesRef.current

    console.log('Building answers from responses:', responses.length, 'responses for', questions.length, 'questions')

    const newAnswers = new Map<string, Answer>()

    questions.forEach((question, index) => {
      const responseText = responses[index] || ''
      if (responseText) {
        newAnswers.set(question.id, {
          questionId: question.id,
          questionText: question.text,
          answerText: responseText,
          timestamp: Date.now(),
        })
      }
    })

    setAnswers(newAnswers)
    console.log('Built answers:', newAnswers.size)
  }, [])

  // Event callbacks for Realtime API - use refs to avoid stale closures
  const createCallbacks = useCallback((): RealtimeEventCallbacks => ({
    // When user finishes speaking
    onUserTranscript: (text: string) => {
      console.log('User said:', text)

      // Add to conversation display
      setConversationTranscript(prev => [...prev, {
        id: `user-${Date.now()}`,
        speaker: 'user',
        text,
        timestamp: Date.now(),
      }])

      // Store as potential answer (will be saved when AI confirms)
      if (text.trim().length > 5) {
        lastAnswerRef.current = text
      }
    },

    // When AI finishes speaking
    onAITranscript: (text: string) => {
      console.log('AI said:', text)

      // Parse ALL event signals from the text (there can be multiple!)
      const events = parseEventSignals(text)
      const cleanText = cleanTextForDisplay(text)

      // Add cleaned text to conversation display
      if (cleanText) {
        setConversationTranscript(prev => [...prev, {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          text: cleanText,
          timestamp: Date.now(),
        }])
      }

      const questions = questionsRef.current

      // If we're collecting summary, add this text to summary
      if (isCollectingSummaryRef.current && cleanText) {
        summaryTextRef.current += ' ' + cleanText
      }

      // Process ALL events in order
      if (events.length > 0) {
        console.log('Event signals detected:', events)

        for (const event of events) {
          console.log('Processing event:', event)

          switch (event.type) {
            case 'answer_confirmed': {
              // AI confirmed answer for question X
              const questionNum = event.questionNum || 1
              const questionIdx = questionNum - 1 // Convert to 0-based
              const question = questions[questionIdx]

              if (question && lastAnswerRef.current) {
                console.log(`Saving confirmed answer for question ${questionNum}: ${lastAnswerRef.current.substring(0, 50)}...`)

                // Store in responses array at the correct index
                userResponsesRef.current[questionIdx] = lastAnswerRef.current

                // Also update answers Map immediately
                setAnswers(prev => {
                  const newAnswers = new Map(prev)
                  newAnswers.set(question.id, {
                    questionId: question.id,
                    questionText: question.text,
                    answerText: lastAnswerRef.current,
                    timestamp: Date.now(),
                  })
                  return newAnswers
                })
                lastAnswerRef.current = '' // Clear for next question
              }

              // Move to next question in UI
              const nextIdx = questionNum // This is already the next question (1-based becomes 0-based next)
              if (nextIdx < questions.length) {
                userResponseCountRef.current = nextIdx
                setCurrentQuestionIndex(nextIdx)
                console.log(`Moving to question ${nextIdx + 1} of ${questions.length}`)
              } else {
                // All questions answered, update progress to 100%
                userResponseCountRef.current = questions.length
                setCurrentQuestionIndex(questions.length)
                console.log('All questions answered!')
              }
              break
            }

            case 'summary_start':
              console.log('AI is giving summary')
              // Save last answer before summary if we have one
              if (lastAnswerRef.current) {
                const currentIdx = userResponseCountRef.current
                userResponsesRef.current[currentIdx] = lastAnswerRef.current
                lastAnswerRef.current = ''
              }
              // Start collecting summary text
              isCollectingSummaryRef.current = true
              summaryTextRef.current = cleanText // Start with this text (after the signal)
              // Build all answers from collected responses
              buildAnswersFromResponses()
              setPhase('confirming')
              break

            case 'complete': {
              console.log('Interview complete!')
              // Stop collecting summary and save it
              isCollectingSummaryRef.current = false
              const finalSummary = summaryTextRef.current.trim()
              console.log('Final summary:', finalSummary.substring(0, 100) + '...')
              setSummary(finalSummary)
              // Build answers one more time to ensure we have everything
              buildAnswersFromResponses()
              setTimeout(() => {
                setPhase('complete')
                realtimeAPIRef.current.disconnect()
                success('Interview completed!')
              }, 1000)
              break
            }

            case 'correction':
              console.log('User requested correction')
              // Stay in current phase, AI will handle it
              break
          }
        }
      }
    },

    // When AI response is fully done
    onResponseDone: () => {
      console.log('AI response done')
    },

    // On error
    onError: (error: Error) => {
      console.error('Realtime error:', error)
      showError(error.message)
      setPhase('error')
    },
  }), [success, showError, parseEventSignals, cleanTextForDisplay, buildAnswersFromResponses])

  // Handle start interview
  const handleStartInterview = useCallback(async () => {
    if (!settings.apiKey) {
      showError('Please configure your API key in settings')
      return
    }

    try {
      // Reset state
      setConversationTranscript([])
      setCurrentQuestionIndex(0)
      setAnswers(new Map())
      setSummary('')
      userResponseCountRef.current = 0
      userResponsesRef.current = []
      lastAnswerRef.current = ''
      isCollectingSummaryRef.current = false
      summaryTextRef.current = ''
      setPhase('connecting')

      // Connect to Realtime API with callbacks
      const systemPrompt = generateSystemPrompt(settings)
      await realtimeAPI.connect(
        settings.apiKey,
        settings.voice,
        systemPrompt,
        createCallbacks()
      )

      setPhase('questioning')
      success('Connected! AI will start the interview.')
    } catch (err) {
      console.error('Failed to start interview:', err)
      showError('Failed to start interview. Please check your API key.')
      setPhase('error')
    }
  }, [settings, realtimeAPI, createCallbacks, success, showError])

  // Auto-start interview when page loads
  const hasStartedRef = useRef(false)
  useEffect(() => {
    if (!hasStartedRef.current && settings.apiKey) {
      hasStartedRef.current = true
      handleStartInterview()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle stop interview
  const handleStopInterview = useCallback(() => {
    realtimeAPI.disconnect()
    setPhase('idle')
    success('Interview stopped')
  }, [realtimeAPI, success])

  // Handle generate document
  const handleGenerateDocument = useCallback(() => {
    setShowDocument(true)
  }, [])

  // Handle back to home
  const handleBackToHome = useCallback(() => {
    if (phase === 'questioning' || phase === 'connecting') {
      const confirmed = window.confirm(
        'Interview is still in progress. Are you sure you want to leave?'
      )
      if (!confirmed) return
      handleStopInterview()
    }
    onNavigate('home')
  }, [phase, handleStopInterview, onNavigate])

  // Current question to display
  const currentQuestion = currentQuestionIndex < settings.questions.length
    ? settings.questions[currentQuestionIndex]
    : null

  // Progress calculation
  const progress = settings.questions.length > 0
    ? Math.round((currentQuestionIndex / settings.questions.length) * 100)
    : 0

  // Check if complete
  const isComplete = phase === 'complete'
  const isActive = phase === 'questioning' || phase === 'connecting'

  // Show document preview
  if (showDocument && isComplete) {
    const answersArray = Array.from(answers.values())

    return (
      <div className="min-h-screen bg-gray-950">
        <DocumentPreview
          answers={answersArray}
          questions={settings.questions}
          template={settings.documentTemplate}
          summary={summary}
          format={settings.documentFormat}
          metadata={{
            language: settings.language,
            outputLanguage: settings.targetLanguage,
          }}
          apiKey={settings.apiKey}
          onClose={() => setShowDocument(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="pt-safe px-4 py-4 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={handleBackToHome}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <h1 className="text-xl font-semibold text-gray-200">Interview</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-8 pb-safe">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Interview Controls */}
          <InterviewControls
            phase={phase}
            progress={progress}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={settings.questions.length}
            isActive={isActive}
            onStop={handleStopInterview}
          />

          {/* Error Display */}
          {realtimeAPI.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h3 className="text-red-400 font-semibold mb-2">Error</h3>
              <p className="text-red-300 text-sm">
                {realtimeAPI.error.message}
              </p>
            </div>
          )}

          {/* Current Question */}
          {!isComplete && currentQuestion && (
            <CurrentQuestion
              question={currentQuestion}
              phase={phase}
              questionIndex={currentQuestionIndex}
              totalQuestions={settings.questions.length}
            />
          )}

          {/* Transcript */}
          <TranscriptDisplay
            transcript={conversationTranscript}
            currentTranscript=""
            currentSpeaker={realtimeAPI.isListening ? 'user' : realtimeAPI.isSpeaking ? 'ai' : undefined}
            showEmpty={phase !== 'idle'}
            maxHeight="24rem"
          />

          {/* Completed state actions */}
          {isComplete && (
            <div className="space-y-3">
              <button
                onClick={handleGenerateDocument}
                className="w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-5 h-5" />
                View & Export Document
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="w-full py-3 px-6 rounded-xl font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
