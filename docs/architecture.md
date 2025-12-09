# Arkitektur

## Översikt

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Settings  │  │  Interview  │  │  Document Export    │  │
│  │    Page     │  │    Page     │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         ▼                ▼                     ▼             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    React State                          ││
│  │  ┌──────────┐ ┌───────────┐ ┌────────────────────────┐ ││
│  │  │ Settings │ │ Interview │ │      Document          │ ││
│  │  │  State   │ │   State   │ │       State            │ ││
│  │  └────┬─────┘ └─────┬─────┘ └───────────┬────────────┘ ││
│  └───────┼─────────────┼───────────────────┼──────────────┘│
│          │             │                   │               │
│          ▼             │                   ▼               │
│  ┌─────────────┐       │           ┌─────────────────────┐ │
│  │ LocalStorage│       │           │ Web Share API /     │ │
│  │ / IndexedDB │       │           │ File Download       │ │
│  └─────────────┘       │           └─────────────────────┘ │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         │ WebRTC
                         ▼
              ┌─────────────────────┐
              │  OpenAI Realtime    │
              │       API           │
              └─────────────────────┘
```

## Dataflöde

### 1. Inställningar
```
User Input → React State → LocalStorage
                ↓
         OpenAI Realtime Session
```

### 2. Intervju
```
Start Button → WebRTC Connect → AI Greeting
     ↓              ↓              ↓
Mic Access    Audio Stream    AI Question
     ↓              ↓              ↓
User Speaks → Transcription → Answer Stored
     ↓              ↓              ↓
Repeat      Until Complete   Confirmation
```

### 3. Dokumentgenerering
```
Interview Complete → Template Processing → Translation (optional)
         ↓                   ↓                    ↓
    Answer Map      → Fill Placeholders  →  Target Language
         ↓                   ↓                    ↓
    Metadata        →   Markdown         →   Final Document
```

## Komponenter

### Sidor
- `HomePage` - Landing med "Starta intervju"
- `SettingsPage` - All konfiguration
- `InterviewPage` - Aktivt samtal

### Hooks
- `useRealtimeAPI` - WebRTC-anslutning
- `useInterview` - Intervjulogik
- `useStorage` - Lokal lagring

### Utils
- `templateProcessor` - Mallhantering
- `documentGenerator` - Skapa dokument
- `translation` - Språköversättning
- `share` - Export-funktioner
