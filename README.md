# WallaPic

**Escribe a través de la imagen. La imagen no es el tema, es el umbral.**

WallaPic es una aplicación web de escritura reflexiva donde una imagen se convierte en el punto de partida para escribir sobre tu día. Una herramienta minimalista que prioriza la experiencia de escritura sin fricciones.

## 🚀 Cómo usar

### Inicio rápido (sin configuración)

1. Abre `index.html` en tu navegador
2. La app funcionará con imágenes de demostración
3. Selecciona tu mood, escribe, y guarda

### Con imágenes de Unsplash (recomendado)

1. Crea una cuenta gratuita en [Unsplash Developers](https://unsplash.com/developers)
2. Crea una nueva aplicación para obtener tu Access Key
3. Abre `app.js` y reemplaza `YOUR_UNSPLASH_ACCESS_KEY` con tu clave:
   ```javascript
   const UNSPLASH_ACCESS_KEY = 'tu_clave_aqui';
   ```
4. Abre `index.html` en tu navegador

## ✨ Características actuales (Fase 1)

- **Imágenes aleatorias**: Integración con Unsplash API (o imágenes de demostración)
- **Sistema de moods**: 8 estados emocionales para etiquetar cómo llegas al ejercicio
- **Área de escritura**: Minimalista, sin distracciones
- **Estadísticas en vivo**: Contador de palabras y caracteres
- **Archivo personal**: Todas tus entradas guardadas localmente con historial navegable
- **Vista completa**: Revisa entradas pasadas con imagen, texto, fecha y mood
- **Responsive**: Diseño adaptado para desktop y mobile
- **Almacenamiento local**: Todo se guarda en tu navegador (localStorage)

## 🎨 Principios de diseño

1. **Cero fricción**: El primer click después de abrir es para seleccionar tu mood y escribir
2. **Imagen siempre visible**: La imagen permanece en pantalla mientras escribes (split screen en desktop, sticky en mobile)
3. **Minimalismo real**: Pocas opciones visibles, herramientas avanzadas sin estorbar
4. **Privado por defecto**: Todo se guarda localmente, nada se comparte sin tu acción explícita

## 🛠️ Tecnologías

- HTML5, CSS3, JavaScript vanilla
- Unsplash API para imágenes
- LocalStorage para persistencia
- Sin dependencias externas

## 📱 Uso en mobile<!--  -->

La app está optimizada para mobile:
- Layout adaptativo con imagen en la parte superior
- Área de escritura con espacio suficiente para el teclado
- Interfaz táctil optimizada

## 🔮 Próximas fases

### Fase 2: El hábito
- Racha de días consecutivos
- Estadísticas avanzadas
- Sistema de retos
- PWA instalable
- Reconocimiento de voz

### Fase 3: Sistema completo
- Mapa de moods en el tiempo
- Diccionario integrado
- Exploración de imágenes con filtros
- Banco propio de imágenes

### Fase 4: Compartir
- Niveles de visibilidad
- Feed organizado por imagen
- Perfil básico
- Invitaciones

## 💾 Datos

Todas tus entradas se guardan en el localStorage de tu navegador. Esto significa:
- ✅ Privacidad total (nada sale de tu dispositivo)
- ✅ Sin necesidad de cuentas o servidores
- ⚠️ Los datos se borran si limpias el caché del navegador
- ⚠️ No se sincronizan entre dispositivos

Para exportar tus datos:
1. Abre la consola del navegador (F12)
2. Ejecuta: `localStorage.getItem('wallapic_entries')`
3. Copia el resultado y guárdalo en un archivo

## 🎯 Atajos de teclado

- `Ctrl/Cmd + S`: Guardar entrada
- `Esc`: Cerrar modales

## 📝 Notas de desarrollo

Esta es la **Fase 1** del proyecto WallaPic. Se enfoca en el núcleo de la experiencia: imagen + mood + escritura + archivo básico.

La arquitectura está diseñada para escalar hacia las fases siguientes sin reescritura completa. El código es vanilla JavaScript intencionalmente para facilitar la migración a React + Next.js en fases posteriores.

## 🤝 Créditos

- Imágenes cortesía de [Unsplash](https://unsplash.com) y sus fotógrafos
- Concepto y diseño: Plan de producto WallaPic

---

**WallaPic** - De un hábito personal de escritura a una WebApp propia
