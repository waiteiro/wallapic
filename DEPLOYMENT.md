# 🚀 Deployment Guide - ImagingDay

## Backend con Netlify Functions

Este proyecto usa **Netlify Functions** como backend para proteger las API keys de Groq.

### 📋 Cómo funciona

- **Local**: Llama directamente a Groq API (las keys están en los archivos .js)
- **Producción**: Llama a `/.netlify/functions/groq-proxy` que vive en Netlify

### 🔧 Setup en Netlify

1. **Conecta tu repo a Netlify**
   - Ve a [netlify.com](https://netlify.com)
   - "Add new site" → "Import from Git"
   - Selecciona tu repositorio

2. **Configura las variables de entorno**
   - En tu sitio de Netlify: `Site configuration` → `Environment variables`
   - Agrega: `GROQ_API_KEY` con tu key de Groq
   - Las keys se obtienen en: https://console.groq.com/keys

3. **Deploy automático**
   - Netlify detecta `netlify.toml` automáticamente
   - Cada push a la rama principal hace deploy automático

### ✅ Ventajas

- ✨ Las API keys nunca se exponen en el código público
- 🔒 Backend serverless gratis (Netlify Functions)
- 🚀 Deploy automático con cada push
- 🌍 CDN global incluido

### 🧪 Probar localmente con el backend

Si quieres probar el backend localmente:

```bash
npm install -g netlify-cli
netlify dev
```

Esto levanta las functions localmente en `http://localhost:8888`

### 📝 Notas

- Los archivos `ontole-engine.js` y `ai-analyzer.js` tienen las keys hardcoded solo para desarrollo local
- En producción detectan automáticamente el entorno y usan el proxy de Netlify
- No necesitas cambiar nada en el código, funciona automático
