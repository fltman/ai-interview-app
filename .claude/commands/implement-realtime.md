# Implementera OpenAI Realtime API

Skapa WebRTC-integration för röstsamtal med OpenAI.

## Förutsättningar
- Projektet är uppsatt med `/project:setup`
- Du har läst OpenAI Realtime API dokumentation

## Steg

1. Skapa `src/hooks/useRealtimeAPI.ts` med:
   - `connect(apiKey, voice)` - Etablera WebRTC-anslutning
   - `disconnect()` - Stäng anslutning
   - `sendMessage(text)` - Skicka text till AI
   - State: `isConnected`, `isListening`, `isSpeaking`
   - Events: `onTranscript`, `onError`

2. Skapa `src/hooks/useAudioRecording.ts`:
   - Begär mikrofontillstånd
   - Hämta audio stream
   - Hantera permission denied

3. Implementera token-hämtning:
   - POST till `https://api.openai.com/v1/realtime/sessions`
   - Använd användarens API-nyckel
   - Returnera ephemeral token

4. Skapa WebRTC peer connection:
   - Lägg till audio track
   - Generera SDP offer
   - Hantera SDP answer från OpenAI
   - Sätt upp data channel för events

5. Testa grundläggande samtal:
   - Kan ansluta
   - Kan skicka text
   - Får audio tillbaka

## Verifiering
```bash
npm run typecheck
npm test -- --grep "useRealtimeAPI"
```

## Referens
- https://platform.openai.com/docs/guides/realtime
- https://platform.openai.com/docs/guides/realtime-webrtc
