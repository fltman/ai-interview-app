# Implementera Inställningssida

Bygg konfigurationsgränssnittet för appen.

## Komponenter att skapa

1. **SettingsPage.tsx** - Huvudsida för inställningar

2. **ApiKeyInput.tsx** - Säker input för API-nyckel
   - Password-typ input
   - Visa/dölj toggle
   - Validering (testar anslutning)

3. **VoiceSelector.tsx** - Dropdown för röstval
   - alloy, echo, fable, onyx, nova, shimmer
   - Preview-knapp (bonus)

4. **QuestionEditor.tsx** - Hantera intervjufrågor
   - Lägg till/ta bort frågor
   - Drag-and-drop sortering
   - Required-toggle per fråga

5. **SystemPromptEditor.tsx** - Textarea för systemprompt
   - Förvalda mallar
   - Variabelförklaringar

6. **TemplateEditor.tsx** - Dokumentmall
   - Syntax highlighting
   - Platshållar-infogning
   - Preview

7. **LanguageSelector.tsx** - Välj språk för slutdokument

## Lagring

Använd `useLocalStorage` hook för att:
- Spara automatiskt vid ändringar
- Ladda vid sidvisning
- Exportera/importera konfiguration

## UI/UX

- Mobile-first layout
- Collapsible sections
- Tydliga labels
- Hjälptexter
- Spara-bekräftelse

## Verifiering
```bash
npm run typecheck
npm test -- --grep "Settings"
```
