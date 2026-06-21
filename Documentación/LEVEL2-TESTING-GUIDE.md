# Guía de Testing - Retos Nivel 2
## Sistema de Frases y Oraciones

---

## ✅ Configuración Actual (TESTING MODE)

### **Probabilidades Forzadas:**
```javascript
WORD: 0%      ← Palabra normal desactivada
PHRASE: 100%  ← FRASE NIVEL 2 (activo)
FREE: 0%      ← Escritura libre desactivada
TIMED: 0%     ← Temporizador desactivado
```

### **Verificación de Racha:**
```javascript
hasLevel2 = true  // FORZADO para testing
```
- Ignora la racha actual
- Siempre permite frases nivel 2
- No depende de días consecutivos

---

## 🎯 Cómo Funciona el Nivel 2

### **Concepto:**
En lugar de una palabra simple, el usuario debe incorporar una **frase completa o expresión** en su escritura.

### **Tipos de Frases:**
1. **Noun Phrase** (Frase sustantiva)
   - Ejemplo: "luz del amanecer"
   - Ejemplo: "susurro del viento"

2. **Noun + Adjective** (Sustantivo + Adjetivo)
   - Ejemplo: "corazón inquieto"
   - Ejemplo: "silencio ensordecedor"

3. **Sentence** (Oración completa)
   - Ejemplo: "palabras que arden"
   - Ejemplo: "tiempo que se escapa"

### **Dificultad:**
- **Easy**: Frases simples y comunes
- **Medium**: Expresiones más complejas o poéticas
- **Hard**: Metáforas y conceptos abstractos

---

## 📊 Banco de Frases

Total: **30 frases** disponibles

### Ejemplos:
1. luz del amanecer
2. susurro del viento
3. corazón inquieto
4. camino sin retorno
5. tiempo que se escapa
6. silencio ensordecedor
7. memoria fragmentada
8. palabras que arden
9. sombra de una duda
10. mirada perdida
... (20 más)

---

## 🎮 Cómo Probar

### **Opción 1: App Principal**
1. Abre `index.html`
2. Al cargar verás: `📖 Reto nivel 2: [frase del día]`
3. Escribe incorporando esa frase
4. El sistema detecta si la usaste
5. Se marca como completado

### **Opción 2: Archivo de Testing**
1. Abre `test-variations.html`
2. Haz clic en **"📖 Probar Frase Nivel 2"**
3. Verás una frase aleatoria del banco
4. Prueba escribir con esa frase

### **Opción 3: Consola del Navegador**
```javascript
// Forzar frase nivel 2
window.challengeVariations.forcePhrase()

// Ver variación del día (debería ser frase)
window.challengeVariations.renderDailyVariation()
```

---

## 👁️ Vista Visual

### **Modo Frase Nivel 2:**
```
┌──────────────────────────────────────┐
│ 🔷 Reto nivel 2: luz del amanecer   │
└──────────────────────────────────────┘
   (Clickeable para ver hint)
```

### **Al hacer click:**
```
Toast: "Frase del día: 'luz del amanecer' - Describe un momento temprano del día"
```

### **Cuando se usa:**
```
┌──────────────────────────────────────┐
│ ✓ Reto nivel 2: luz del amanecer    │
└──────────────────────────────────────┘
   (Verde, completado)
```

---

## 🔍 Detección de Uso

### **Sistema:**
- Lee el texto completo (título + cuerpo)
- Busca la frase exacta (ignora mayúsculas/acentos)
- Puede estar en cualquier parte del texto
- No importa el orden de las palabras si es sentence

### **Ejemplos válidos:**
```
Frase: "luz del amanecer"

✅ "La luz del amanecer me despertó"
✅ "Escribo con la luz del amanecer entrando"
✅ "Hoy vi la LUZ DEL AMANECER" (mayúsculas ok)
✅ "luz del amanecer en mi ventana" (sin acentos ok)

❌ "luz amanecer" (falta "del")
❌ "amanecer con luz" (orden incorrecto si es frase fija)
```

---

## 📝 Archivo `challenges-level2.js`

### **Estructura:**
```javascript
{
    id: 1,
    phrase: "luz del amanecer",      // Frase a usar
    difficulty: "easy",              // Dificultad
    hint: "Describe un momento...",  // Pista al usuario
    type: "noun_phrase"              // Tipo gramatical
}
```

### **Función Principal:**
```javascript
window.challengesLevel2.getDailyPhraseChallenge()
// Devuelve la frase del día basada en fecha
```

### **Verificación:**
```javascript
window.challengesLevel2.isPhraseUsedToday("luz del amanecer")
// Verifica si ya fue usada hoy
```

---

## 🧪 Testing Checklist

### **Probar:**
- [ ] La frase se muestra correctamente
- [ ] Click abre hint en toast
- [ ] Escribir con la frase marca como completado
- [ ] Se guarda en localStorage/Supabase
- [ ] Al día siguiente cambia la frase
- [ ] Color verde cuando completado
- [ ] Icono de layers (📖) se muestra
- [ ] No se puede clickear después de completado

### **Casos Edge:**
- [ ] Frase con mayúsculas
- [ ] Frase con acentos diferentes
- [ ] Frase en el título (no solo cuerpo)
- [ ] Múltiples espacios entre palabras
- [ ] Frase al inicio/final del texto

---

## 🎨 Estilo Visual

### **Normal:**
```css
background: rgba(74, 158, 255, 0.08)
border: rgba(74, 158, 255, 0.2)
color: rgba(255, 255, 255, 0.9)
cursor: pointer
```

### **Completado:**
```css
background: rgba(6, 255, 165, 0.08)
border: rgba(6, 255, 165, 0.2)
color: #06ffa5
```

---

## 🔄 Restaurar Modo Normal

Cuando termines de probar, restaura las probabilidades:

```javascript
const VARIATION_PROBABILITIES = {
    [VARIATION_TYPES.WORD]: 50,    // 50% palabra
    [VARIATION_TYPES.PHRASE]: 25,  // 25% frase
    [VARIATION_TYPES.FREE]: 15,    // 15% libre
    [VARIATION_TYPES.TIMED]: 10    // 10% timer
};

// Y descomentar verificación de racha:
const streak = typeof calculateStreak === 'function' ? calculateStreak() : 0;
const hasLevel2 = typeof window.streakSystem !== 'undefined' ? 
    window.streakSystem.areChallengesLevel2Enabled(streak) : false;
```

---

## 📊 Integración con Racha (Cuando se active)

- **Días 0-6**: No disponible
- **Días 7-74**: Activo (25% probabilidad)
- **Días 75+**: Desactivado (retos completados)

---

## 🚀 Próximas Mejoras

- [ ] Agregar más frases (ampliar banco)
- [ ] Categorías de frases (amor, naturaleza, filosofía)
- [ ] Dificultad ajustable según racha
- [ ] Estadísticas de frases más usadas
- [ ] Sugerencias de frases personalizadas

---

**Configurado para Testing**: 20 de junio, 2026  
**Estado**: ✅ Listo para probar Nivel 2
