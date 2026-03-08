# Prism 360 - App Web

Esta es la aplicacion principal (no extension) para inspeccion de media 360.

## Ubicacion

Proyecto en la raiz del repo:

- `src/`
- `public/`
- `index.html`
- `vite.config.ts`
- `package.json`

## Comandos

Desde la raiz del repo:

```bash
npm install
npm run dev
```

Build de produccion:

```bash
npm run build
npm run preview
```

## Para que sirve

- Visualizacion 360 (esferica y equirectangular)
- Grillas de evaluacion
- Navegacion y zoom
- Herramientas de analisis para QA visual

## Importante

Los cambios de la extension viven en `prism-360-extension/` y no afectan esta app principal, salvo que se edite explicitamente la raiz.
