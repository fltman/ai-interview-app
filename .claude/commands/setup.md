# Initial Project Setup

Sätt upp projektet från grunden.

## Steg

1. Skapa Vite React TypeScript projekt:
   ```bash
   npm create vite@latest . -- --template react-ts
   ```

2. Installera beroenden:
   ```bash
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npm install @radix-ui/react-dialog @radix-ui/react-slot
   npm install lucide-react
   npm install idb  # IndexedDB wrapper
   npm install jspdf  # PDF generation
   ```

3. Konfigurera Tailwind:
   ```bash
   npx tailwindcss init -p
   ```

4. Uppdatera `tailwind.config.js` för mobile-first

5. Skapa grundläggande mappstruktur enligt CLAUDE.md

6. Sätt upp routing (React Router eller enkel state-baserad)

7. Verifiera att dev server startar:
   ```bash
   npm run dev
   ```

## Verifiering
- Dev server körs utan fel
- TypeScript kompilerar
- Tailwind CSS fungerar
