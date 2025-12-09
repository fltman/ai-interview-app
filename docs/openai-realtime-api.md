# OpenAI Realtime API Guide

## Översikt

OpenAI Realtime API möjliggör röstsamtal med AI i realtid via WebRTC.

## Anslutningsflöde

### 1. Hämta Ephemeral Token

```typescript
async function getEphemeralToken(apiKey: string, voice: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: voice,
    }),
  });

  const data = await response.json();
  return data.client_secret.value;
}
```

### 2. Skapa WebRTC Peer Connection

```typescript
const pc = new RTCPeerConnection();

// Lägg till audio element för AI:s röst
const audioEl = document.createElement('audio');
audioEl.autoplay = true;
pc.ontrack = (e) => {
  audioEl.srcObject = e.streams[0];
};

// Lägg till mikrofon-track
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
stream.getTracks().forEach(track => pc.addTrack(track, stream));

// Skapa data channel för events
const dc = pc.createDataChannel('oai-events');
```

### 3. Etablera anslutning

```typescript
// Generera SDP offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// Skicka till OpenAI
const response = await fetch(
  `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ephemeralToken}`,
      'Content-Type': 'application/sdp',
    },
    body: offer.sdp,
  }
);

// Hantera SDP answer
const answerSdp = await response.text();
await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
```

### 4. Hantera events

```typescript
dc.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'session.created':
      // Session är redo
      break;
    case 'input_audio_buffer.speech_started':
      // Användaren börjar prata
      break;
    case 'input_audio_buffer.speech_stopped':
      // Användaren slutar prata
      break;
    case 'response.audio_transcript.delta':
      // AI:s text (streaming)
      break;
    case 'conversation.item.input_audio_transcription.completed':
      // Användarens transkriberade tal
      break;
  }
};
```

### 5. Skicka meddelanden

```typescript
function sendMessage(text: string) {
  const event = {
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text }],
    },
  };
  dc.send(JSON.stringify(event));

  // Trigga respons
  dc.send(JSON.stringify({ type: 'response.create' }));
}
```

## Röstval

| Voice | Beskrivning |
|-------|-------------|
| alloy | Neutral, balanserad |
| echo | Mjukare, varm |
| fable | Expressiv, berättande |
| onyx | Djup, auktoritär |
| nova | Energisk, optimistisk |
| shimmer | Klar, tydlig |

## Felhantering

- **Nätverksfel**: Implementera reconnect med exponentiell backoff
- **Mikrofontillstånd**: Visa tydlig dialog för att begära åtkomst
- **Token-utgång**: Sessions varar 30 min, förnya innan timeout

## Kostnad

Realtime API faktureras per:
- Input audio tokens
- Output audio tokens
- Text tokens

Se OpenAI pricing för aktuella priser.
