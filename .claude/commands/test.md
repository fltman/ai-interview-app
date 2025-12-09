# Kör tester

Kör alla tester och verifiera kodkvalitet.

## Kommandon

```bash
# Unit tests
npm test

# Med coverage
npm test -- --coverage

# Specifik fil
npm test -- --grep "useRealtimeAPI"

# Watch mode
npm test -- --watch
```

## Typkontroll

```bash
npm run typecheck
```

## Lint

```bash
npm run lint
npm run lint -- --fix
```

## Fullständig verifiering

```bash
npm run typecheck && npm run lint && npm test
```

## Lighthouse (manuellt)

1. Öppna Chrome DevTools
2. Kör Lighthouse för Mobile
3. Verifiera:
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90
   - PWA (om implementerat)
