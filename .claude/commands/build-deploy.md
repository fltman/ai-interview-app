# Bygg och Deploya

Bygg för produktion och förbered för driftsättning.

## Bygg

```bash
npm run build
```

Output hamnar i `dist/`.

## Preview

```bash
npm run preview
```

Öppna http://localhost:4173 för att testa produktionsbygget lokalt.

## Driftsättning

Eftersom appen är helt klientbaserad kan den driftas var som helst:

### Statisk hosting
- **Vercel**: `vercel deploy`
- **Netlify**: Drag och släpp `dist/`
- **GitHub Pages**: Push till `gh-pages` branch
- **Cloudflare Pages**: Anslut repo

### Egen server
Servera `dist/` mappen som statiska filer:
- nginx
- Apache
- Express static
- Python http.server

### Docker (valfritt)

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

## PWA (bonus)

Om PWA är implementerat:
1. Registrera service worker
2. Lägg till manifest.json
3. Ikoner i olika storlekar
4. Testa offline-funktionalitet

## Verifiering

Efter deploy:
- [ ] Appen laddar
- [ ] Settings sparas
- [ ] Intervju startar (med giltig API-nyckel)
- [ ] Dokument genereras
- [ ] Export fungerar
