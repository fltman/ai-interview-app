# Kom igång med AI Interview App

## För utvecklare

### 1. Initial setup

Navigera till projektmappen och kör:
```bash
/project:setup
```

Detta sätter upp Vite, React, TypeScript, Tailwind och alla beroenden.

### 2. Implementera funktioner

Följ slash commands i ordning:

1. `/project:implement-settings` - Inställningssidan
2. `/project:implement-realtime` - OpenAI Realtime API
3. `/project:implement-interview` - Intervjulogik
4. `/project:implement-document` - Dokumentgenerering

### 3. Testa

```bash
/project:test
```

### 4. Deploya

```bash
/project:build-deploy
```

## Agent-team

Projektet har specialiserade agenter:

| Agent | Användning |
|-------|------------|
| `ui-mobile-specialist` | All mobil UI |
| `realtime-api-engineer` | WebRTC och röst |
| `interview-logic-architect` | Intervjuflöde |
| `document-generator` | Dokument och export |
| `storage-manager` | Lokal lagring |
| `test-qa-engineer` | Tester och kvalitet |

Agenterna aktiveras automatiskt baserat på uppgiften.

## Arbetsflöde

```
1. Läs CLAUDE.md för projektöversikt
2. Använd slash commands för strukturerat arbete
3. Agenterna hanterar specialiserade uppgifter
4. Testa kontinuerligt
5. Bygg och deploya
```

## Tips

- Börja alltid med att läsa CLAUDE.md
- Använd "think hard" för komplexa beslut
- Testa på verklig mobil tidigt
- Håll koll på bundle size
