# Prism 360 - Chrome Extension

Esta carpeta contiene la version extension de Prism 360.

## Ubicacion

- Codigo fuente: `prism-360-extension/src/`
- Archivos de extension: `manifest.json`, `content.js`, `background.js`
- Build final para Chrome: `prism-360-extension/dist/`

## Comandos

Desde `prism-360-extension/`:

```bash
npm install
npm run dev
```

Build para cargar en Chrome:

```bash
npm run build
```

## Instalar en Chrome (manual)

1. Ir a `chrome://extensions`
2. Activar **Developer mode**
3. Click en **Load unpacked**
4. Seleccionar carpeta: `prism-360-extension/dist`

## Estado funcional actual

- UI simplificada (sin upload ni selectores de media)
- Modo inicial por defecto: `equirectangular`
- Disenada para recibir media por parametro `src` en la URL interna de la extension
