# Implementera Intervjuflöde

Bygg intervjulogiken som driver samtalet.

## Förutsättningar
- Realtime API är implementerat
- Inställningssidan existerar med frågor konfigurerade

## Steg

1. Skapa `src/types/interview.ts`:
   - `InterviewPhase` enum
   - `InterviewState` interface
   - `Question`, `Answer` interfaces

2. Skapa `src/hooks/useInterview.ts`:
   - State machine för intervjufaser
   - Frågesekvensering
   - Svarsinsamling
   - Bekräftelselogik

3. Implementera fasövergångar:
   ```
   IDLE → CONNECTING → GREETING → QUESTIONING → CONFIRMING → COMPLETE
   ```

4. Skapa systemprompt för AI:
   - Vänlig intervjuare
   - En fråga i taget
   - Bekräftar svar
   - Sammanfattar i slutet

5. Implementera `InterviewPage.tsx`:
   - Startknapp
   - Visuell feedback (vem pratar)
   - Transkription
   - Framstegsindikatorn

6. Hantera edge cases:
   - Användaren säger "Jag förstår inte"
   - Otydligt svar
   - Användaren vill gå tillbaka

## Verifiering
```bash
npm run typecheck
npm test -- --grep "useInterview"
```

## Systemprompt-mall
```
Du är en vänlig intervjuare. Ställ en fråga i taget och vänta på svar.
Efter varje svar, bekräfta att du förstått rätt.
När alla frågor är besvarade, sammanfatta svaren och fråga om allt stämmer.
Frågor att ställa: {{questions}}
```
