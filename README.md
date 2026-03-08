# Prism 360 Workspace

Este repositorio contiene **dos proyectos distintos**:

1. **App web principal** (viewer para 360)
2. **Extension de Chrome** (version empaquetada para abrir media desde enlaces)

## Estructura rapida

- `src/`, `public/`, `vite.config.ts`, `package.json`  
  Proyecto de la **app web principal**
- `prism-360-extension/`  
  Proyecto de la **extension Chrome**

## Documentacion por proyecto

- App web: ver `WEB_APP.md`
- Extension Chrome: ver `prism-360-extension/README.md`
- Arquitectura tecnica de la app web: ver `ARCHITECTURE.md`

## Cual carpeta cargar en Chrome

Para instalar la extension manualmente:

1. Build de la extension:
   ```bash
   cd prism-360-extension
   npm install
   npm run build
   ```
2. En `chrome://extensions`, activar **Developer mode**
3. Click en **Load unpacked**
4. Seleccionar: `prism-360-extension/dist`
