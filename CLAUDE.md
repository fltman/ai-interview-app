# AI Interview App

En mobilanpassad webbklient som använder OpenAI Realtime API för att genomföra röstbaserade intervjuer och generera dokument baserat på svaren.

## Projektöversikt

**Typ:** Mobile-first webbapplikation (PWA)
**Stack:** React + TypeScript + Vite + Tailwind CSS
**AI:** OpenAI Realtime API (WebRTC för röstsamtal)
**Lagring:** LocalStorage/IndexedDB (ingen backend krävs)

## Kärnfunktionalitet

1. **Inställningssida** - Konfigurerar API-nyckel, röstval, systemprompt, intervjufrågor, slutmall, språk
2. **Intervjusida** - Röstbaserad intervju via OpenAI Realtime API
3. **Dokumentgenerering** - Skapar dokument enligt mall med möjlighet till översättning
4. **Export** - Ladda ner eller dela via mobil share API

## Arkitektur

All logik körs i klienten - ingen backend behövs. Driftsoberoende design.

```
src/
├── components/          # React-komponenter
│   ├── ui/             # Återanvändbara UI-komponenter
│   ├── interview/      # Intervjurelaterade komponenter
│   └── settings/       # Inställningskomponenter
├── hooks/              # Custom React hooks
│   ├── useRealtimeAPI.ts    # OpenAI Realtime API integration
│   ├── useAudioRecording.ts # Mikrofon-hantering
│   └── useStorage.ts        # Lokal lagring
├── pages/              # Sidkomponenter
│   ├── HomePage.tsx
│   ├── SettingsPage.tsx
│   └── InterviewPage.tsx
├── types/              # TypeScript typdefinitioner
├── utils/              # Hjälpfunktioner
│   ├── documentGenerator.ts  # Mallbaserad dokumentgenerering
│   ├── translation.ts        # Språköversättning
│   └── share.ts              # Web Share API
└── App.tsx
```

## Kommandon

```bash
# Utveckling
npm install          # Installera beroenden
npm run dev          # Starta utvecklingsserver
npm run build        # Bygg för produktion
npm run preview      # Förhandsgranska byggd app

# Kvalitet
npm run lint         # Kör ESLint
npm run typecheck    # TypeScript-kontroll
npm test             # Kör tester
```

## Verifiering

Innan commit, kör alltid:
```bash
npm run typecheck && npm run lint && npm test
```

## Viktiga integrationspunkter

### OpenAI Realtime API
- Använd WebRTC för webbläsarbaserade röstsamtal
- Dokumentation: https://platform.openai.com/docs/guides/realtime
- Kräver ephemeral token (hämtas client-side med API-nyckel)
- Stödjer text och ljud in/ut

### Web Share API
- Använd `navigator.share()` för mobil delning
- Fallback till nedladdning för desktop

### Lokal lagring
- Inställningar i localStorage
- Större data (ljudfiler, dokument) i IndexedDB

## Röstflöde

1. Användaren trycker "Starta intervju"
2. Anslut till OpenAI Realtime API med WebRTC
3. AI läser upp första frågan
4. Användaren svarar med röst
5. AI bekräftar och går vidare till nästa fråga
6. När alla frågor besvarats, sammanfattar AI
7. Användaren bekräftar eller korrigerar
8. Dokument genereras enligt mall (med valfri översättning)
9. Användaren laddar ner eller delar

## Kodstil

- Följ ESLint/Prettier-konfigurationen
- Använd TypeScript strict mode
- Komponenter: Funktionella med hooks
- Namngivning: camelCase för funktioner, PascalCase för komponenter

## Säkerhet

- API-nyckel lagras lokalt, skickas aldrig till extern server
- All kommunikation sker direkt mellan klient och OpenAI
- Ingen användardata lämnar enheten (förutom till OpenAI för bearbetning)

## Tillgänglighet

- Mobile-first responsiv design
- Touch-vänliga knappar (minst 44x44px)
- Tydlig visuell feedback vid inspelning
- Stöd för skärmläsare

## Dokumentformat

Primärt: Markdown/Text
Bonus: PDF-generering via jsPDF eller liknande

## Språkstöd

- Intervjun kan köras på valfritt språk (styrs av AI)
- Slutdokumentet kan översättas till annat språk
- Använd OpenAI för översättning vid behov
