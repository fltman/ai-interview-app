# AI Interview App

A mobile-first web application for conducting voice-based interviews using OpenAI's Realtime API, with automatic document generation from the conversation.

## Project Status

The project scaffold has been successfully set up with all core configuration files, pages, and basic structure. The development server runs successfully.

## Setup Complete

### Configuration Files
- `package.json` - Project dependencies and scripts
- `vite.config.ts` - Vite build configuration with React plugin
- `tsconfig.json` - TypeScript configuration with strict mode
- `tsconfig.node.json` - TypeScript config for Node files
- `tailwind.config.js` - Tailwind CSS with mobile-first utilities
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer
- `eslint.config.js` - ESLint configuration
- `vitest.config.ts` - Vitest test configuration
- `.gitignore` - Git ignore rules

### Application Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (empty, ready for components)
│   ├── interview/       # Interview-specific components (empty, ready)
│   └── settings/        # Settings components (empty, ready)
├── hooks/
│   ├── useIndexedDB.ts      # IndexedDB operations hook
│   ├── useLocalStorage.ts   # LocalStorage operations hook
│   ├── useStorage.ts        # Combined storage hook
│   ├── index.ts             # Hook exports
│   └── __tests__/           # Hook tests
├── pages/
│   ├── HomePage.tsx         # Home page with welcome and start button
│   ├── SettingsPage.tsx     # Settings configuration page
│   └── InterviewPage.tsx    # Interview conduct page
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/
│   └── storage.ts           # Storage utilities and constants
├── App.tsx                  # Main app with routing logic
├── main.tsx                 # React entry point
└── index.css                # Global styles with Tailwind directives
```

### Pages Implemented

1. **HomePage** (`/Users/andersbj/Projekt/ai-interview-app/src/pages/HomePage.tsx`)
   - Welcome screen
   - Feature overview
   - Start interview button
   - Settings navigation
   - API key validation check

2. **SettingsPage** (`/Users/andersbj/Projekt/ai-interview-app/src/pages/SettingsPage.tsx`)
   - OpenAI API key configuration
   - Voice selection (6 voice options)
   - Language selection (14 languages)
   - System prompt customization
   - Interview questions editor
   - Document template editor
   - Settings persistence to localStorage

3. **InterviewPage** (`/Users/andersbj/Projekt/ai-interview-app/src/pages/InterviewPage.tsx`)
   - Interview status display
   - Progress indicator
   - Current question display
   - Transcript view
   - Start/Stop controls
   - Document generation (stub)

### Core Features

- **Type-safe Storage Hooks**: Complete localStorage and IndexedDB hooks with tests
- **Mobile-first Design**: Tailwind configured with safe areas and touch-friendly sizes
- **Responsive Layout**: Mobile-optimized with proper viewport settings
- **Client-side Routing**: Simple state-based routing in App.tsx
- **Settings Management**: Full CRUD for app settings with validation

### Type Definitions

Complete TypeScript types in `/Users/andersbj/Projekt/ai-interview-app/src/types/index.ts`:
- `Settings` - App configuration
- `Question` - Interview questions
- `Answer` - User responses
- `InterviewState` - Interview session state
- `TranscriptEntry` - Conversation transcript
- `GeneratedDocument` - Output document
- `VoiceOption` - OpenAI voice selections
- `LanguageOption` - Supported languages
- `RouteType` - Navigation routes

### Dependencies Installed

**Production:**
- react, react-dom (18.3.1)
- idb (8.0.0) - IndexedDB wrapper
- jspdf (2.5.1) - PDF generation
- lucide-react (0.460.0) - Icon library

**Development:**
- vite (5.4.10) - Build tool
- typescript (5.6.2)
- tailwindcss (3.4.14)
- vitest (2.1.4) - Testing framework
- eslint, prettier - Code quality

## Quick Start

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Build for production
npm run build
```

## Next Steps

To complete the application, implement:

1. **OpenAI Realtime API Integration**
   - Create `src/hooks/useRealtimeAPI.ts`
   - Implement WebRTC connection to OpenAI
   - Handle audio streaming
   - Manage conversation flow

2. **Audio Recording**
   - Create `src/hooks/useAudioRecording.ts`
   - Browser microphone access
   - Audio level visualization
   - Recording state management

3. **Document Generation**
   - Create `src/utils/documentGenerator.ts`
   - Handlebars template processing
   - Markdown to PDF conversion
   - Translation support

4. **UI Components**
   - Button component (`src/components/ui/Button.tsx`)
   - Input components
   - Modal/Dialog
   - Toast notifications

5. **Share Functionality**
   - Create `src/utils/share.ts`
   - Web Share API integration
   - Fallback download
   - Mobile sharing

## Development Server Status

The dev server starts successfully on http://localhost:3000 with:
- Hot module replacement
- React Fast Refresh
- TypeScript compilation
- Tailwind CSS processing

All typechecks pass with no errors.

## Architecture Notes

- **No Backend Required**: All processing happens client-side
- **Offline Capable**: IndexedDB for persistent storage
- **Progressive Web App**: PWA-ready with proper meta tags
- **Mobile Optimized**: Safe areas, touch targets, viewport settings
- **Type Safety**: Strict TypeScript with comprehensive types
