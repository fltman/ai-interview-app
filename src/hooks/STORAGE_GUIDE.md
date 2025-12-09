# Storage Management Guide

This guide explains the storage system for the AI Interview App.

## Overview

The storage system uses two mechanisms:
1. **localStorage** - For small, simple settings data
2. **IndexedDB** - For larger, structured data like interviews and documents

## Storage Architecture

### LocalStorage
Used for:
- User settings (API key, voice choice, system prompt)
- UI preferences (theme, language, compact mode)
- Last interview configuration

Benefits:
- Simple key-value interface
- Synchronous operations
- Automatically persisted
- Can be inspected in DevTools

Limitations:
- ~5-10MB storage limit
- Only stores strings (we serialize to JSON)
- Not suitable for large files

### IndexedDB
Used for:
- Saved interviews
- Generated documents
- Transcript data
- Optional: Audio recordings

Benefits:
- Much larger storage capacity (~hundreds of MB)
- Structured database with indexes
- Asynchronous operations
- Better performance for large data sets

Limitations:
- More complex API
- Async operations required
- Requires browser support

## Hooks

### useLocalStorage

Generic hook for localStorage with JSON serialization and sync across tabs.

```typescript
import { useLocalStorage } from '@/hooks';

function MyComponent() {
  const [settings, setSettings] = useLocalStorage('key', defaultValue);

  // Use like useState
  setSettings(newValue);
  setSettings(prev => ({ ...prev, field: 'value' }));

  return <div>{settings.field}</div>;
}
```

Features:
- Type-safe with generics
- JSON serialization/deserialization
- Syncs across browser tabs
- Handles SSR (checks if window exists)
- Error handling for quota exceeded

### useIndexedDB

Hook for IndexedDB operations on a specific object store.

```typescript
import { useIndexedDB } from '@/hooks';
import { SavedInterview } from '@/types';

function InterviewsComponent() {
  const interviews = useIndexedDB<SavedInterview>('interviews');

  // CRUD operations
  const interview = await interviews.get(id);
  const id = await interviews.put(newInterview);
  await interviews.delete(id);
  const all = await interviews.getAll();
  const filtered = await interviews.getAllByIndex('status', 'complete');
  await interviews.clear();

  return <div>Interviews: {all.length}</div>;
}
```

Operations:
- `get(id)` - Get a single record
- `put(value)` - Create or update a record
- `delete(id)` - Delete a record
- `getAll()` - Get all records
- `getAllByIndex(indexName, value)` - Query by index
- `clear()` - Delete all records

### useStorage

High-level hook combining both storage mechanisms. This is the recommended hook for most use cases.

```typescript
import { useStorage } from '@/hooks';

function MyApp() {
  const storage = useStorage();

  // Settings
  storage.saveSettings(settings);
  const settings = storage.loadSettings();
  storage.resetSettings();

  // Interviews
  const id = await storage.saveInterview(interviewData);
  const interview = await storage.getInterview(id);
  const interviews = await storage.getInterviews();
  await storage.updateInterview(updatedInterview);
  await storage.deleteInterview(id);

  // UI Preferences
  storage.saveUIPreferences(prefs);
  const prefs = storage.loadUIPreferences();

  // Utility
  const json = await storage.exportData();
  await storage.clearAllData();
}
```

### useInterviewStorage

Specialized hook for interview-specific operations.

```typescript
import { useInterviewStorage } from '@/hooks';

function InterviewHistory() {
  const storage = useInterviewStorage();

  // Get completed vs draft interviews
  const completed = await storage.getCompletedInterviews();
  const drafts = await storage.getDraftInterviews();

  // Save a completed interview
  const id = await storage.saveCompletedInterview(interviewData);

  // All other storage operations also available
}
```

## Database Schema

### Interviews Store

```typescript
interface SavedInterview {
  id: string;                    // Primary key
  createdAt: Date;              // Index: for sorting
  settings: Settings;           // Configuration used
  answers: Answer[];            // Interview answers
  transcript: string;           // Full transcript
  document: string;             // Generated document
  status: 'draft' | 'complete'; // Index: for filtering
}

interface Answer {
  questionId: string;   // Reference to question
  questionText: string; // The question asked
  answerText: string;   // The answer given
  timestamp: number;    // When answered (epoch ms)
}
```

### Documents Store

```typescript
interface StoredDocument {
  id: string;              // Primary key
  interviewId: string;     // Index: reference to interview
  content: string;         // Document content
  createdAt: Date;         // When created
}
```

## Usage Patterns

### Saving an Interview

```typescript
const storage = useStorage();

const newInterview: Omit<SavedInterview, 'id'> = {
  createdAt: new Date(),
  settings: currentSettings,
  answers: interviewAnswers,
  transcript: interviewTranscript,
  document: generatedDocument,
  status: 'complete',
};

const interviewId = await storage.saveInterview(newInterview);
```

### Loading and Modifying an Interview

```typescript
const storage = useStorage();

const interview = await storage.getInterview(id);
if (interview) {
  interview.document = newDocument;
  await storage.updateInterview(interview);
}
```

### Exporting Data

```typescript
const storage = useStorage();

const jsonData = await storage.exportData();
// Format: {
//   version: '1.0',
//   exportedAt: '2024-01-15T...',
//   settings: {...},
//   interviews: [...]
// }

// Download as file
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'interview-export.json';
a.click();
```

### Clearing Data

```typescript
const storage = useStorage();

// Shows confirmation dialog first
await storage.clearAllData();
```

## Storage Limits

### LocalStorage
- Typical limit: 5-10MB per domain
- Stores: Settings + UI preferences
- Expected size: < 100KB

### IndexedDB
- Typical limit: 50MB+ per domain
- Stores: Interviews, documents, transcripts
- Can handle hundreds of interviews

To check available space:

```typescript
if (navigator.storage && navigator.storage.estimate) {
  const {usage, quota} = await navigator.storage.estimate();
  console.log(`Using ${usage} bytes out of ${quota} bytes`);
}
```

## Migration Strategy

When the database schema changes:

1. Increment `DB_CONFIG.VERSION` in `src/utils/storage.ts`
2. Add a migration function to `MIGRATIONS`
3. Migrations run automatically on app load

```typescript
export const MIGRATIONS: Record<number, Migration> = {
  1: (db) => {
    // Initial schema
  },
  2: (db) => {
    // Add new field to store
    // The migration is applied during db.upgrade
  },
};
```

## Security Considerations

- API keys are stored in localStorage (same as browser security model)
- Consider encryption for sensitive data in production
- All data stays on device - no backend required
- User can export/clear data anytime

## Error Handling

```typescript
try {
  const settings = storage.loadSettings();
  storage.saveSettings(newSettings);
} catch (error) {
  console.error('Storage error:', error);
  // Graceful fallback to defaults
}
```

## Testing

Storage functions are fully tested in `__tests__/` directory:
- `useLocalStorage.test.ts` - localStorage tests
- `useStorage.test.ts` - High-level API tests

Run tests:
```bash
npm test
npm test:watch
npm test:coverage
```

## Debugging

### Check localStorage
```javascript
// In browser console
localStorage.getItem('ai-interview-settings');
```

### Check IndexedDB
1. Open DevTools
2. Go to "Application" tab
3. Expand "IndexedDB"
4. Database: "ai-interview-db"
5. Explore stores and records

### Clear all storage
```javascript
// In browser console
localStorage.clear();
// For IndexedDB, open DevTools > Application > IndexedDB > ai-interview-db > right-click > Delete
```

## Performance Tips

1. Use `useStorage` for most operations - it handles both mechanisms
2. Load settings once in app root, pass via context if needed
3. Lazy load interviews when listing them
4. Archive old interviews if needed

## Browser Support

- localStorage: All modern browsers
- IndexedDB: All modern browsers (IE 10+)
- The app gracefully degrades if IndexedDB unavailable
