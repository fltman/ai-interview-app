# Storage API Reference

Complete API documentation for the AI Interview App storage system.

## useLocalStorage Hook

Generic hook for managing localStorage with JSON serialization.

### Signature

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void]
```

### Parameters

- `key: string` - The localStorage key to use
- `initialValue: T` - Default value if key doesn't exist or has invalid data

### Returns

Tuple of:
- `[0]` - Current value of type T
- `[1]` - Function to update the value

### Features

- Type-safe with TypeScript generics
- Automatic JSON serialization/deserialization
- SSR-safe (checks for window existence)
- Syncs across browser tabs
- Handles parse errors gracefully
- Returns initial value on error

### Examples

```typescript
// String value
const [name, setName] = useLocalStorage('user-name', 'Guest');

// Object value
const [prefs, setPrefs] = useLocalStorage('preferences', {
  theme: 'light',
  fontSize: 14,
});

// Array value
const [tags, setTags] = useLocalStorage('tags', ['react', 'typescript']);

// Update value
setName('Alice');

// Functional update
setPrefs(prev => ({
  ...prev,
  theme: prev.theme === 'light' ? 'dark' : 'light',
}));
```

### Notes

- Changes sync automatically to other tabs
- Persists across page refreshes
- ~5-10MB storage limit per domain
- All values stored as JSON strings

---

## useIndexedDB Hook

Hook for CRUD operations on IndexedDB object stores.

### Signature

```typescript
function useIndexedDB<T extends { id: string }>(
  storeName: string
): IDBOperations<T>
```

### Generic Type Constraint

`T` must have an `id: string` field (used as primary key).

### Parameters

- `storeName: string` - Name of the object store ('interviews', 'documents', etc.)

### Returns

Object with CRUD methods:

```typescript
interface IDBOperations<T> {
  get: (id: string) => Promise<T | undefined>;
  put: (value: T) => Promise<string>;
  delete: (id: string) => Promise<void>;
  getAll: () => Promise<T[]>;
  getAllByIndex: (indexName: string, value: unknown) => Promise<T[]>;
  clear: () => Promise<void>;
  isAvailable: boolean;
}
```

### Methods

#### get(id: string)

Retrieve a single record by ID.

```typescript
const interview = await interviews.get('interview-123');
// Returns: SavedInterview | undefined
```

#### put(value: T)

Create or update a record. Auto-generates ID if not present.

```typescript
const id = await interviews.put({
  id: 'new-id',
  createdAt: new Date(),
  settings: {...},
  answers: [],
  transcript: '',
  document: '',
  status: 'draft',
});
// Returns: string (the ID)
```

#### delete(id: string)

Delete a record by ID.

```typescript
await interviews.delete('interview-123');
// Throws on error
```

#### getAll()

Retrieve all records from the store.

```typescript
const allInterviews = await interviews.getAll();
// Returns: T[] (array of all records)
```

#### getAllByIndex(indexName: string, value: unknown)

Query records using an index.

```typescript
// Get all completed interviews
const completed = await interviews.getAllByIndex('status', 'complete');

// Get interviews created after a date
const recent = await interviews.getAllByIndex('createdAt', new Date());
// Returns: T[] (matching records)
```

Available indexes:
- `interviews` store: 'createdAt', 'status'
- `documents` store: 'interviewId'

#### clear()

Delete all records from the store.

```typescript
await interviews.clear();
// Caution: Cannot be undone without restore
```

### Properties

#### isAvailable

Boolean indicating if IndexedDB is available in this browser.

```typescript
if (interviews.isAvailable) {
  const all = await interviews.getAll();
}
```

### Examples

```typescript
import { useIndexedDB } from '@/hooks';
import { SavedInterview } from '@/types';

function InterviewManager() {
  const db = useIndexedDB<SavedInterview>('interviews');

  // Save new interview
  const handleSave = async (interview) => {
    const id = await db.put(interview);
    console.log('Saved as:', id);
  };

  // Load interview
  const handleLoad = async (id) => {
    const interview = await db.get(id);
    if (interview) {
      console.log(interview);
    }
  };

  // List all
  const handleList = async () => {
    const interviews = await db.getAll();
    interviews.forEach(i => console.log(i.id));
  };

  // Filter by status
  const handleCompleted = async () => {
    const done = await db.getAllByIndex('status', 'complete');
    return done;
  };
}
```

### Notes

- All operations are asynchronous
- Errors are logged to console, then thrown
- Automatic database initialization
- Supports up to ~50MB storage
- Ideal for structured data

---

## useStorage Hook

High-level API combining localStorage and IndexedDB.

### Signature

```typescript
function useStorage(): StorageOperations
```

### Returns

Object with all storage operations:

```typescript
interface StorageOperations {
  // Settings
  saveSettings: (settings: Settings) => void;
  loadSettings: () => Settings;
  resetSettings: () => void;

  // Interviews
  saveInterview: (interview: Omit<SavedInterview, 'id'>) => Promise<string>;
  getInterview: (id: string) => Promise<SavedInterview | undefined>;
  getInterviews: () => Promise<SavedInterview[]>;
  updateInterview: (interview: SavedInterview) => Promise<void>;
  deleteInterview: (id: string) => Promise<void>;

  // UI Preferences
  saveUIPreferences: (prefs: UIPreferences) => void;
  loadUIPreferences: () => UIPreferences;

  // Utility
  clearAllData: () => Promise<void>;
  exportData: () => Promise<string>;
}
```

### Settings Methods

#### saveSettings(settings: Settings)

Save user settings (synchronous).

```typescript
const storage = useStorage();

const newSettings: Settings = {
  apiKey: 'sk-...',
  voice: 'nova',
  systemPrompt: 'You are...',
  questions: [...],
  documentTemplate: '...',
  language: 'en-US',
  targetLanguage: 'sv-SE',
};

storage.saveSettings(newSettings);
// Validation is performed automatically
```

#### loadSettings()

Load current settings (synchronous).

```typescript
const settings = storage.loadSettings();
console.log(settings.voice); // 'nova'
```

#### resetSettings()

Reset settings to defaults (synchronous).

```typescript
storage.resetSettings();
// All settings reverted to DEFAULT_SETTINGS
```

### Interview Methods

#### saveInterview(interview: Omit<SavedInterview, 'id'>)

Save a new interview (asynchronous).

```typescript
const id = await storage.saveInterview({
  createdAt: new Date(),
  settings: currentSettings,
  answers: [
    {
      questionId: '1',
      questionText: 'What is your name?',
      answerText: 'Alice',
      timestamp: Date.now(),
    },
  ],
  transcript: 'Q: What is your name?\\nA: Alice',
  document: '# Interview Summary\\n...',
  status: 'complete',
});

console.log('Interview ID:', id);
```

#### getInterview(id: string)

Get a single interview by ID.

```typescript
const interview = await storage.getInterview('interview-123');

if (interview) {
  console.log(interview.status);
  console.log(interview.answers.length);
}
```

#### getInterviews()

Get all saved interviews.

```typescript
const allInterviews = await storage.getInterviews();
console.log(`Found ${allInterviews.length} interviews`);

allInterviews.forEach(i => {
  console.log(`${i.id}: ${i.status}`);
});
```

#### updateInterview(interview: SavedInterview)

Update an existing interview.

```typescript
const interview = await storage.getInterview(id);

if (interview) {
  interview.document = newGeneratedDoc;
  await storage.updateInterview(interview);
}
```

#### deleteInterview(id: string)

Delete an interview (shows confirmation dialog).

```typescript
await storage.deleteInterview('interview-123');
// Shows: "Är du säker på att du vill ta bort denna intervju?"
// Only deletes if user confirms
```

### UI Preferences Methods

#### saveUIPreferences(prefs: UIPreferences)

Save UI preferences (synchronous).

```typescript
interface UIPreferences {
  theme: 'light' | 'dark';
  language: string;
  compactMode: boolean;
}

storage.saveUIPreferences({
  theme: 'dark',
  language: 'sv-SE',
  compactMode: false,
});
```

#### loadUIPreferences()

Load UI preferences (synchronous).

```typescript
const prefs = storage.loadUIPreferences();

if (prefs.theme === 'dark') {
  document.body.classList.add('dark-mode');
}
```

### Utility Methods

#### exportData()

Export all settings and interviews as JSON (asynchronous).

```typescript
const jsonString = await storage.exportData();

// Format:
// {
//   "version": "1.0",
//   "exportedAt": "2024-01-15T10:30:00.000Z",
//   "settings": {...},
//   "interviews": [...]
// }

// Download as file
const blob = new Blob([jsonString], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'interview-export.json';
link.click();
URL.revokeObjectURL(url);
```

#### clearAllData()

Clear all storage (shows confirmation dialog).

```typescript
await storage.clearAllData();
// Shows: "Vill du verkligen radera all data? Den här åtgärden kan inte ångras."
// Only clears if user confirms
// Clears both localStorage and IndexedDB
// Resets to default settings
```

### Examples

```typescript
import { useStorage } from '@/hooks';

function MyComponent() {
  const storage = useStorage();

  // Load on mount
  useEffect(() => {
    const settings = storage.loadSettings();
    setCurrentSettings(settings);
  }, []);

  // Save interview after completion
  const handleComplete = async (interview) => {
    const id = await storage.saveInterview({
      ...interview,
      status: 'complete',
    });
    console.log(`Interview saved: ${id}`);
  };

  // List completed interviews
  const handleShowCompleted = async () => {
    const all = await storage.getInterviews();
    const completed = all.filter(i => i.status === 'complete');
    return completed;
  };

  // Export for backup
  const handleExport = async () => {
    const json = await storage.exportData();
    // Send via email, save to file, etc.
  };
}
```

### Notes

- Settings operations are synchronous (from localStorage)
- Interview operations are asynchronous (from IndexedDB)
- Validation performed on saveSettings
- Confirmation dialogs for destructive operations
- Error handling built-in

---

## useInterviewStorage Hook

Specialized hook for interview-specific operations.

### Signature

```typescript
function useInterviewStorage(): StorageOperations & {
  getCompletedInterviews: () => Promise<SavedInterview[]>;
  getDraftInterviews: () => Promise<SavedInterview[]>;
  saveCompletedInterview: (
    interview: Omit<SavedInterview, 'id'>
  ) => Promise<string>;
}
```

### Additional Methods

#### getCompletedInterviews()

Get all completed interviews.

```typescript
const storage = useInterviewStorage();
const finished = await storage.getCompletedInterviews();
// Returns only interviews with status === 'complete'
```

#### getDraftInterviews()

Get all draft interviews.

```typescript
const drafts = await storage.getDraftInterviews();
// Returns only interviews with status === 'draft'
```

#### saveCompletedInterview(interview: Omit<SavedInterview, 'id'>)

Save an interview with status automatically set to 'complete'.

```typescript
const id = await storage.saveCompletedInterview({
  createdAt: new Date(),
  settings,
  answers,
  transcript,
  document,
  // status is automatically set to 'complete'
});
```

### Inherited Methods

All methods from `useStorage` are available:
- saveSettings/loadSettings/resetSettings
- getInterview/getInterviews/updateInterview/deleteInterview
- saveUIPreferences/loadUIPreferences
- exportData/clearAllData

### Examples

```typescript
import { useInterviewStorage } from '@/hooks';

function InterviewHistory() {
  const storage = useInterviewStorage();

  const loadCompleted = async () => {
    const completed = await storage.getCompletedInterviews();
    setInterviews(completed);
  };

  const loadDrafts = async () => {
    const drafts = await storage.getDraftInterviews();
    setDrafts(drafts);
  };

  useEffect(() => {
    loadCompleted();
  }, []);

  return (
    <div>
      {/* Display completed and draft interviews */}
    </div>
  );
}
```

---

## Type Definitions

### Settings

```typescript
interface Settings {
  apiKey: string;                    // OpenAI API key
  voice: VoiceOption;               // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  systemPrompt: string;             // AI system instructions
  questions: Question[];            // Interview questions
  documentTemplate: string;         // Template for document generation
  language: LanguageOption;         // Interview language
  targetLanguage?: LanguageOption;  // Optional: translation target
}
```

### SavedInterview

```typescript
interface SavedInterview {
  id: string;                    // Unique identifier
  createdAt: Date;              // When created
  settings: Settings;           // Settings used
  answers: Answer[];            // Answers given
  transcript: string;           // Full transcript
  document: string;             // Generated document
  status: 'draft' | 'complete'; // Interview status
}
```

### Answer

```typescript
interface Answer {
  questionId: string;   // Reference to question.id
  questionText: string; // The question that was asked
  answerText: string;   // The answer provided
  timestamp: number;    // When answered (milliseconds since epoch)
}
```

### Question

```typescript
interface Question {
  id: string;  // Unique identifier
  text: string; // Question text
  order: number; // Display order
}
```

### UIPreferences

```typescript
interface UIPreferences {
  theme: 'light' | 'dark';
  language: string;
  compactMode: boolean;
}
```

---

## Constants

### Storage Keys

```typescript
const STORAGE_KEYS = {
  SETTINGS: 'ai-interview-settings',
  LAST_INTERVIEW_CONFIG: 'ai-interview:last-config',
  UI_PREFERENCES: 'ai-interview:ui-prefs',
};
```

### Database Config

```typescript
const DB_CONFIG = {
  NAME: 'ai-interview-db',
  VERSION: 1,
  STORES: {
    INTERVIEWS: 'interviews',
    DOCUMENTS: 'documents',
  },
};
```

### Voice Options

```typescript
const VOICE_OPTIONS: Array<{ value: VoiceOption; label: string }> = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];
```

### Language Options

```typescript
const LANGUAGE_OPTIONS: Array<{ value: LanguageOption; label: string }> = [
  { value: 'sv-SE', label: 'Swedish' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'de-DE', label: 'German' },
  { value: 'fr-FR', label: 'French' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-PT', label: 'Portuguese' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'pl-PL', label: 'Polish' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
];
```

---

## Error Handling

All functions include error handling:

```typescript
// useLocalStorage automatically returns initialValue on error
const [value] = useLocalStorage('key', default);

// useIndexedDB logs errors to console
try {
  const data = await db.get(id);
} catch (error) {
  console.error('Error getting data:', error);
}

// useStorage includes try-catch blocks
try {
  storage.saveSettings(newSettings);
} catch (error) {
  console.error('Settings error:', error);
}
```

---

## Complete Example

```typescript
import { useEffect, useState } from 'react';
import { useStorage } from '@/hooks';
import { SavedInterview, Settings } from '@/types';

export default function AppManager() {
  const storage = useStorage();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [interviews, setInterviews] = useState<SavedInterview[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings (sync)
        const currentSettings = storage.loadSettings();
        setSettings(currentSettings);

        // Load interviews (async)
        const allInterviews = await storage.getInterviews();
        setInterviews(allInterviews);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveSettings = (newSettings: Settings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleSaveInterview = async (interview: Omit<SavedInterview, 'id'>) => {
    const id = await storage.saveInterview(interview);
    // Reload interviews
    const updated = await storage.getInterviews();
    setInterviews(updated);
    return id;
  };

  const handleDeleteInterview = async (id: string) => {
    await storage.deleteInterview(id);
    // Reload interviews
    const updated = await storage.getInterviews();
    setInterviews(updated);
  };

  const handleExportData = async () => {
    const json = await storage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Interview Manager</h1>
      <p>Settings: {settings?.voice}</p>
      <p>Interviews: {interviews.length}</p>
      <button onClick={() => handleExportData()}>Export Data</button>
    </div>
  );
}
```

---

## Migration Guide

When the database schema changes, migrations handle updates automatically:

```typescript
// In src/utils/storage.ts
export const MIGRATIONS: Record<number, Migration> = {
  1: (db) => {
    // Initial schema
  },
  2: (db) => {
    // Schema for version 2
    // Called automatically if DB_CONFIG.VERSION >= 2
  },
};
```

Update `DB_CONFIG.VERSION` and add migrations as needed.

---

## useRealtimeAPI Hook

WebRTC-based hook for OpenAI Realtime API voice interactions.

### Signature

```typescript
function useRealtimeAPI(): UseRealtimeAPIReturn

interface UseRealtimeAPIReturn {
  connect: (apiKey: string, voice: VoiceOption, systemPrompt: string) => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (text: string) => void;
  updateSession: (instructions: string) => void;
  isConnected: boolean;
  isListening: boolean;  // User is speaking
  isSpeaking: boolean;   // AI is speaking
  transcript: TranscriptEntry[];
  error: Error | null;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
}
```

### Features

- WebRTC-based real-time voice communication
- Automatic ephemeral token generation
- Server-side Voice Activity Detection (VAD)
- Bidirectional audio streaming
- Real-time transcription
- Automatic cleanup on unmount
- Error handling and recovery

### Methods

#### connect(apiKey, voice, systemPrompt)

Establish WebRTC connection to OpenAI Realtime API.

```typescript
const realtime = useRealtimeAPI();

await realtime.connect(
  'sk-...',              // OpenAI API key
  'alloy',               // Voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  'You are a helpful interviewer...' // System prompt
);
```

**Process:**
1. Gets ephemeral token from OpenAI
2. Requests microphone access
3. Creates RTCPeerConnection
4. Establishes audio bidirectional stream
5. Creates data channel for events
6. Configures session with voice and system prompt

**Throws:** Error if connection fails or microphone access denied

#### disconnect()

Close the connection and clean up resources.

```typescript
realtime.disconnect();
```

**Cleanup:**
- Closes data channel
- Closes peer connection
- Stops all media tracks
- Removes audio element
- Resets state

#### sendTextMessage(text)

Send a text message to the AI (triggers voice response).

```typescript
realtime.sendTextMessage('Please introduce yourself');
```

**Use cases:**
- Start interview with first question
- Send instructions without user speaking
- Provide context or corrections

#### updateSession(instructions)

Update system instructions mid-session.

```typescript
realtime.updateSession('Now focus on technical questions only');
```

**Use cases:**
- Change AI behavior during interview
- Update context for different sections
- Adjust tone or style

### State Properties

#### isConnected

Boolean indicating active connection.

```typescript
if (realtime.isConnected) {
  // Show "Connected" indicator
}
```

#### isListening

Boolean indicating user is currently speaking (detected by server-side VAD).

```typescript
{realtime.isListening && (
  <div className="listening-indicator">Listening...</div>
)}
```

#### isSpeaking

Boolean indicating AI is currently speaking.

```typescript
{realtime.isSpeaking && (
  <div className="speaking-indicator">AI is speaking...</div>
)}
```

#### transcript

Array of conversation entries with role, content, and timestamp.

```typescript
interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Display transcript
{realtime.transcript.map((entry, i) => (
  <div key={i} className={entry.role}>
    <strong>{entry.role}:</strong> {entry.content}
    <small>{entry.timestamp.toLocaleTimeString()}</small>
  </div>
))}
```

#### error

Error object if connection or operation failed.

```typescript
{realtime.error && (
  <div className="error">
    Connection error: {realtime.error.message}
  </div>
)}
```

#### connectionState

Current state: 'disconnected' | 'connecting' | 'connected' | 'error'

```typescript
switch (realtime.connectionState) {
  case 'connecting':
    return <Spinner />;
  case 'connected':
    return <InterviewUI />;
  case 'error':
    return <ErrorMessage error={realtime.error} />;
  default:
    return <ConnectButton />;
}
```

### Complete Example

```typescript
import { useRealtimeAPI } from '@/hooks';
import { useState } from 'react';

function VoiceInterview() {
  const realtime = useRealtimeAPI();
  const [apiKey, setApiKey] = useState('');

  const handleConnect = async () => {
    try {
      await realtime.connect(
        apiKey,
        'nova',
        'You are conducting a professional interview. Ask questions clearly and listen carefully.'
      );

      // Start with first question
      realtime.sendTextMessage('Please introduce yourself');
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    realtime.disconnect();
  };

  return (
    <div>
      <h1>Voice Interview</h1>

      {/* Connection status */}
      <div className="status">
        Status: {realtime.connectionState}
        {realtime.isListening && ' - User speaking'}
        {realtime.isSpeaking && ' - AI speaking'}
      </div>

      {/* Controls */}
      {!realtime.isConnected ? (
        <>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="OpenAI API Key"
          />
          <button onClick={handleConnect}>Connect</button>
        </>
      ) : (
        <button onClick={handleDisconnect}>Disconnect</button>
      )}

      {/* Error display */}
      {realtime.error && (
        <div className="error">Error: {realtime.error.message}</div>
      )}

      {/* Transcript */}
      <div className="transcript">
        <h2>Conversation</h2>
        {realtime.transcript.map((entry, i) => (
          <div key={i} className={`message ${entry.role}`}>
            <strong>{entry.role === 'user' ? 'You' : 'AI'}:</strong>
            <p>{entry.content}</p>
            <small>{entry.timestamp.toLocaleTimeString()}</small>
          </div>
        ))}
      </div>

      {/* Send text message */}
      {realtime.isConnected && (
        <button onClick={() => realtime.sendTextMessage('Please continue')}>
          Prompt AI
        </button>
      )}
    </div>
  );
}
```

### Configuration

The hook uses these OpenAI Realtime API settings:

```typescript
// Model
model: 'gpt-4o-realtime-preview-2024-12-17'

// Session config
modalities: ['text', 'audio']
temperature: 0.8

// Voice Activity Detection
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,              // Sensitivity (0-1)
  prefix_padding_ms: 300,      // Buffer before speech
  silence_duration_ms: 500,    // Silence to detect end
}
```

### Events Handled

The hook automatically handles these OpenAI events:

- `session.created` - Connection established
- `session.updated` - Configuration changed
- `input_audio_buffer.speech_started` - User starts speaking
- `input_audio_buffer.speech_stopped` - User stops speaking
- `conversation.item.input_audio_transcription.completed` - User's speech transcribed
- `response.audio_transcript.delta` - AI response chunks
- `response.audio_transcript.done` - AI response complete
- `response.audio.delta` - Audio chunks received
- `response.done` - Response complete
- `error` - Error occurred

### Important Notes

- **API Key Security**: Never commit API keys. Load from user settings.
- **Microphone Permission**: Browser will prompt for microphone access.
- **Token Lifetime**: Ephemeral tokens last 30 minutes.
- **Auto Cleanup**: Connection closes automatically on unmount.
- **Audio Format**: Uses PCM16 for minimal latency.
- **Browser Support**: Requires WebRTC support (modern browsers).

### Troubleshooting

**Microphone access denied:**
```typescript
// Check permissions first
const hasPermission = await navigator.permissions.query({ name: 'microphone' });
if (hasPermission.state === 'denied') {
  // Show instructions to enable microphone
}
```

**Connection timeout:**
```typescript
// Implement timeout wrapper
const connectWithTimeout = async (timeout = 10000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timeout')), timeout)
  );

  await Promise.race([
    realtime.connect(apiKey, voice, prompt),
    timeoutPromise
  ]);
};
```

**Network interruption:**
```typescript
// Monitor connection state
useEffect(() => {
  if (realtime.connectionState === 'error') {
    // Attempt reconnection
    setTimeout(() => {
      realtime.connect(apiKey, voice, prompt);
    }, 3000);
  }
}, [realtime.connectionState]);
```

---

**Last Updated**: 2024-12-09
**API Version**: 1.0
**Status**: Complete and Production Ready
