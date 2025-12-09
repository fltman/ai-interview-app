# Implementera Dokumentgenerering

Bygg dokumentgenerering och export.

## Steg

1. Skapa `src/utils/templateProcessor.ts`:
   - Parse mall med platshållare
   - Ersätt `{{variabel}}` med värden
   - Hantera `{{#each}}` loopar
   - Hantera saknade värden

2. Skapa `src/utils/documentGenerator.ts`:
   - Ta emot intervjuresultat och mall
   - Generera Markdown
   - Konvertera till ren text
   - Generera PDF (bonus)

3. Skapa `src/utils/translation.ts`:
   - Anropa OpenAI Chat API
   - Översätt dokument med bevarad formatering
   - Hantera fel gracefully

4. Skapa `src/utils/share.ts`:
   - Web Share API integration
   - Fallback till download
   - Kopiera till urklipp

5. Skapa `DocumentPreview.tsx`:
   - Markdown rendering
   - Scroll för långa dokument
   - Export-knappar

## Mallprocessering

Input:
```markdown
# Rapport för {{namn}}
{{#each answers}}
## {{question}}
{{answer}}
{{/each}}
```

Output:
```markdown
# Rapport för Anna
## Vad heter du?
Anna Andersson
## Hur gammal är du?
32 år
```

## Export-alternativ

1. **Dela** (mobil) - Web Share API
2. **Ladda ner** - Fil download
3. **Kopiera** - Clipboard API
4. **E-post** - mailto: länk

## Verifiering
```bash
npm run typecheck
npm test -- --grep "document"
```
