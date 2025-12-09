# Settings Assistant - Röstguidad Konfiguration

En "meta-intervju" där AI:n intervjuar användaren om deras inställningar och automatiskt konfigurerar appen.

## Översikt

Settings Assistant är en innovativ funktion som använder OpenAI Realtime API för att göra appkonfiguration enkel och intuitiv. Istället för att fylla i formulär, för användaren en naturlig röstkonversation med AI:n som samlar in all nödvändig information.

## Funktioner

### Röstbaserad Konfiguration
- Naturlig konversation med AI
- Realtidsigenkänning av tal
- Visuell feedback med ljudvisualisering
- Live-transkription av samtalet

### Intelligent Informationsinsamling
AI:n samlar systematiskt in:
1. **Syfte**: Vilken typ av intervjuer (jobb, användarstudier, medicinskt, etc.)
2. **Frågor**: Specifika frågor att ställa + AI:ns förslag
3. **Dokumentformat**: Hur slutdokumentet ska struktureras
4. **Språk**: Intervjuspråk och dokumentspråk

### Automatisk Strukturering
- AI:n parsar konversationen och extraherar strukturerad data
- Genererar frågor i rätt format
- Skapar dokumentmallar med Handlebars-syntax
- Anpassar systemprompt baserat på intervjutyp

## Användning

### Från Settings-sidan

1. Klicka på den stora "Hjälp mig konfigurera"-knappen
2. Tillåt mikrofonåtkomst när du blir ombedd
3. Prata naturligt med AI:n om dina behov
4. Bekräfta när AI:n sammanfattar
5. Klicka "Använd inställningar" för att tillämpa

### Förutsättningar

- OpenAI API-nyckel måste vara inmatad först
- Mikrofontillgång i webbläsaren
- Aktiv internetanslutning

## Teknisk Implementation

### Hook: `useSettingsAssistant`

```typescript
const assistant = useSettingsAssistant((settings) => {
  // Callback när inställningar är klara
  applySettings(settings);
});

// Starta assistenten
await assistant.startAssistant(apiKey);

// Tillgängliga states
assistant.isActive      // boolean - pågår konversation?
assistant.phase         // AssistantPhase - nuvarande fas
assistant.transcript    // TranscriptEntry[] - konversationshistorik
assistant.suggestedSettings // Partial<Settings> - extraherade inställningar
```

### Faser

Assistenten går igenom flera faser:

- `idle` - Redo att börja
- `asking-purpose` - Frågar om syfte/typ av intervju
- `asking-questions` - Diskuterar intervjufrågor
- `asking-template` - Planerar dokumentformat
- `asking-language` - Väljer språk
- `confirming` - Bekräftar inställningar
- `complete` - Klart, inställningar redo

### Komponenter

#### `<SettingsAssistant />`
Modal-komponenten som visar konversationen:
- Fasindikator
- Ljudvisualisering
- Live-transkript
- Knapp för att tillämpa inställningar

#### `<AssistantButton />`
Prominent knapp med gradient och animationer:
- Sparkles-ikon
- Hover-effekter med shine-animation
- Disabled om API-nyckel saknas

### AI System Prompt

Assistenten använder en specialskriven svenska systemprompt som:
- Vägleder användaren genom processen
- Ställer följdfrågor när det behövs
- Sammanfattar och bekräftar
- Producerar strukturerad JSON vid bekräftelse

### JSON-Format

När användaren bekräftar producerar AI:n JSON enligt detta format:

```json
{
  "questions": [
    {"text": "Fråga 1"},
    {"text": "Fråga 2"}
  ],
  "documentTemplate": "# Mall\\n\\n{{#each answers}}...",
  "interviewLanguage": "sv-SE",
  "outputLanguage": "en-US",
  "systemPrompt": "Du är en professionell..."
}
```

### Parsing och Validering

Hooken extraherar JSON från markdown code blocks och transformerar till `Settings`:
- Lägger till ID och order på frågor
- Validerar språkkoder
- Säkerställer att alla fält är korrekta typer

## Användarupplevelse

### Visuell Feedback

1. **Före start**: Sparkles-ikon, gradient-knapp med shine-animation
2. **Under samtal**: Pulsande ljudvisualisering, live-transkript
3. **Vid bekräftelse**: Grön success-banner
4. **Vid fel**: Röd error-banner med meddelande

### Mobilanpassning

- Bottom sheet-stil på mobil
- Touch-vänliga knappar
- Responsive layouter
- Safe area-hantering

## Exempel på Konversation

```
AI: Hej! Jag är här för att hjälpa dig konfigurera din intervjuapp.
    Berätta gärna, vilken typ av intervjuer vill du genomföra?

Användare: Jag ska intervjua jobbkandidater för utvecklarroller.

AI: Perfekt! Vilka frågor vill du ställa i intervjun?
    Ska jag föreslå några vanliga frågor för utvecklarintervjuer?

Användare: Ja gärna!

AI: Bra! Jag föreslår: bakgrund och erfarenhet, tekniska färdigheter,
    tidigare projekt, och framtida mål. Vill du lägga till något?

[...fortsättning...]

AI: Sammanfattning: Du vill göra jobbintervjuer för utvecklare med
    4 frågor på svenska, och dokumentet ska också vara på svenska.
    Stämmer det?

Användare: Ja!

AI: Perfekt! Här är dina inställningar:
```json
{
  "questions": [...],
  ...
}
```
```

## Felhantering

### Nätverksfel
- Visa tydligt felmeddelande
- Tillåt omstart av assistenten
- Bevara tidigare inmatning när möjligt

### Mikrofonfel
- Be om tillstånd tydligt
- Visa hjälptext om avslag
- Fallback till manuell konfiguration

### Parsing-fel
- Logga varningar vid felaktig JSON
- Vänta på ny JSON-output från AI
- Timeout efter rimlig tid

## Testning

Omfattande testsvit inkluderar:
- Hook-funktionalitet
- JSON-parsing
- Fas-övergångar
- Transkript-hantering
- Error-states

Kör tester:
```bash
npm test -- useSettingsAssistant
```

## Framtida Förbättringar

- [ ] Spara vanliga konfigurationer som templates
- [ ] Möjlighet att editera inställningar innan apply
- [ ] Stöd för flera språk i UI (för närvarande svenska)
- [ ] Export/import av assistent-konversationer
- [ ] A/B-testning av olika systemprompter
- [ ] Visuell preview av dokumentmall innan apply

## Accessibility

- Fullständig tangentbordsnavigering
- ARIA-labels på alla interaktiva element
- Visuella indikatorer för ljudaktivitet
- Texttranskript som alternativ till enbart ljud
