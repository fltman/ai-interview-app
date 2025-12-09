/**
 * useRealtimeAPI Hook
 * Integrates OpenAI Realtime API with WebRTC for voice-based AI interactions
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { VoiceOption } from '../types';

// Realtime API types
export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Event callbacks
export interface RealtimeEventCallbacks {
  onUserTranscript?: (text: string) => void;
  onAITranscript?: (text: string) => void;
  onResponseDone?: () => void;
  onError?: (error: Error) => void;
}

interface UseRealtimeAPIReturn {
  connect: (apiKey: string, voice: VoiceOption, systemPrompt: string, callbacks?: RealtimeEventCallbacks) => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (text: string) => void;
  updateSession: (instructions: string) => void;
  triggerResponse: () => void;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  error: Error | null;
  connectionState: ConnectionState;
}

interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: unknown;
}

interface SessionUpdateEvent extends RealtimeEvent {
  type: 'session.update';
  session: {
    instructions?: string;
    voice?: VoiceOption;
    modalities?: string[];
    temperature?: number;
    input_audio_transcription?: {
      model: string;
    };
    turn_detection?: {
      type: string;
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    };
  };
}

// Model to use for Realtime API (GA model)
const REALTIME_MODEL = 'gpt-realtime';

// Use local PHP proxy to avoid CORS (proxy forwards to OpenAI)
const REALTIME_ENDPOINT = '/api/realtime.php';

/**
 * OpenAI Realtime API Hook
 * Manages WebRTC connection, audio streams, and event handling
 */
export function useRealtimeAPI(): UseRealtimeAPIReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Transcript accumulation buffers
  const aiResponseBufferRef = useRef<string>('');

  // Event callbacks ref
  const callbacksRef = useRef<RealtimeEventCallbacks>({});

  /**
   * Cleanup function to properly close all connections
   */
  const cleanup = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }

    setIsListening(false);
    setIsSpeaking(false);
    aiResponseBufferRef.current = '';
  }, []);

  /**
   * Handle incoming events from the data channel
   */
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    console.log('Realtime event:', event.type, event);

    switch (event.type) {
      case 'session.created':
        setConnectionState('connected');
        console.log('Session created successfully');
        break;

      case 'session.updated':
        console.log('Session updated');
        break;

      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        console.log('User started speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        console.log('User stopped speaking');
        break;

      // User's speech transcribed
      case 'conversation.item.input_audio_transcription.completed': {
        const transcriptionEvent = event as RealtimeEvent & { transcript?: string };
        const transcription = transcriptionEvent.transcript || '';
        if (transcription) {
          console.log('User transcription:', transcription);

          // Add to transcript
          setTranscript(prev => [...prev, {
            role: 'user',
            content: transcription,
            timestamp: new Date(),
          }]);

          // Call callback
          callbacksRef.current.onUserTranscript?.(transcription);
        }
        break;
      }

      // AI speech delta (streaming)
      case 'response.audio_transcript.delta': {
        const deltaEvent = event as RealtimeEvent & { delta?: string };
        const delta = deltaEvent.delta || '';
        aiResponseBufferRef.current += delta;
        break;
      }

      // AI speech complete
      case 'response.audio_transcript.done': {
        const finalText = aiResponseBufferRef.current;
        if (finalText) {
          console.log('AI response:', finalText);

          // Add to transcript
          setTranscript(prev => [...prev, {
            role: 'assistant',
            content: finalText,
            timestamp: new Date(),
          }]);

          // Call callback
          callbacksRef.current.onAITranscript?.(finalText);
        }
        aiResponseBufferRef.current = '';
        break;
      }

      case 'response.audio.delta': {
        setIsSpeaking(true);
        break;
      }

      // Full response done (AI finished speaking)
      case 'response.done': {
        setIsSpeaking(false);
        const responseEvent = event as RealtimeEvent & { response?: { status?: string; status_details?: { error?: { message?: string } } } };
        console.log('AI response complete', responseEvent.response?.status, responseEvent.response?.status_details);

        // Check for errors in the response
        if (responseEvent.response?.status === 'failed') {
          const errorMsg = responseEvent.response?.status_details?.error?.message || 'Response generation failed';
          console.error('Response failed:', errorMsg);
        }

        // Call callback
        callbacksRef.current.onResponseDone?.();
        break;
      }

      case 'error': {
        const errorEvent = event as RealtimeEvent & { error?: { message?: string } };
        const errorMessage = errorEvent.error?.message || 'Unknown error';
        const err = new Error(`Realtime API error: ${errorMessage}`);
        setError(err);
        setConnectionState('error');
        console.error('Realtime API error:', event);

        // Call callback
        callbacksRef.current.onError?.(err);
        break;
      }

      // Transcription failed
      case 'conversation.item.input_audio_transcription.failed': {
        const failEvent = event as RealtimeEvent & { error?: { type?: string; message?: string } };
        console.error('Transcription failed:', failEvent.error?.type, failEvent.error?.message);
        break;
      }

      default:
        console.log('Unhandled event:', event.type, event);
    }
  }, []);

  /**
   * Send an event to the Realtime API via data channel
   */
  const sendEvent = useCallback((event: RealtimeEvent) => {
    if (dataChannelRef.current?.readyState === 'open') {
      const message = JSON.stringify(event);
      dataChannelRef.current.send(message);
      console.log('Sent event:', event.type);
    } else {
      console.warn('Data channel not open, cannot send event:', event.type);
    }
  }, []);

  /**
   * Update session instructions (system prompt)
   */
  const updateSession = useCallback((instructions: string) => {
    const event: SessionUpdateEvent = {
      type: 'session.update',
      session: {
        instructions,
        modalities: ['text', 'audio'],
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    };
    sendEvent(event);
  }, [sendEvent]);

  /**
   * Trigger AI to start speaking (generate a response)
   */
  const triggerResponse = useCallback(() => {
    sendEvent({ type: 'response.create' });
  }, [sendEvent]);

  /**
   * Send a text message to the AI
   */
  const sendTextMessage = useCallback((text: string) => {
    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    };
    sendEvent(event);
    triggerResponse();
  }, [sendEvent, triggerResponse]);

  /**
   * Connect to OpenAI Realtime API with WebRTC
   */
  const connect = useCallback(async (
    apiKey: string,
    voice: VoiceOption,
    systemPrompt: string,
    callbacks?: RealtimeEventCallbacks
  ) => {
    try {
      setConnectionState('connecting');
      setError(null);
      setTranscript([]);

      // Store callbacks
      callbacksRef.current = callbacks || {};

      // Request microphone access
      console.log('Requesting microphone access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = mediaStream;

      // Create peer connection
      console.log('Creating peer connection...');
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Create audio element for playback
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      document.body.appendChild(audioEl);

      // Handle incoming audio track
      pc.ontrack = (e) => {
        console.log('Received remote audio track');
        if (e.streams && e.streams[0]) {
          audioEl.srcObject = e.streams[0];
        }
      };

      // Add local audio track
      mediaStream.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });

      // Create data channel for events
      console.log('Creating data channel...');
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      // Handle data channel events
      dc.onopen = () => {
        console.log('Data channel open');

        // Configure session with system prompt, voice, and enable transcription
        const sessionUpdate: SessionUpdateEvent = {
          type: 'session.update',
          session: {
            instructions: systemPrompt,
            voice,
            modalities: ['text', 'audio'],
            temperature: 0.8,
            input_audio_transcription: {
              model: 'whisper-1',  // Enable user speech transcription
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };
        sendEvent(sessionUpdate);

        // Trigger AI to start the conversation immediately
        setTimeout(() => {
          console.log('Triggering AI to start conversation...');
          sendEvent({ type: 'response.create' });
        }, 500);
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as RealtimeEvent;
          handleRealtimeEvent(event);
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      };

      dc.onerror = (err) => {
        console.error('Data channel error:', err);
        setError(new Error('Data channel error'));
        setConnectionState('error');
      };

      dc.onclose = () => {
        console.log('Data channel closed');
        setConnectionState('disconnected');
      };

      // Create and set local description
      console.log('Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI Realtime API via PHP proxy
      console.log('Sending offer via proxy...');
      const sdpResponse = await fetch(`${REALTIME_ENDPOINT}?model=${REALTIME_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to send offer: ${sdpResponse.status}`);
      }

      // Set remote description from answer
      const answerSdp = await sdpResponse.text();
      console.log('Received answer, setting remote description...');
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      console.log('WebRTC connection established');

    } catch (err) {
      console.error('Connection error:', err);
      setError(err as Error);
      setConnectionState('error');
      cleanup();
      throw err;
    }
  }, [cleanup, handleRealtimeEvent, sendEvent]);

  /**
   * Disconnect from the API
   */
  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    cleanup();
    setConnectionState('disconnected');
    setError(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connect,
    disconnect,
    sendTextMessage,
    updateSession,
    triggerResponse,
    isConnected: connectionState === 'connected',
    isListening,
    isSpeaking,
    transcript,
    error,
    connectionState,
  };
}
