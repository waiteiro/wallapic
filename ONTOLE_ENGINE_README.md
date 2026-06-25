# 🚀 ONTOLE ENGINE - Sistema Generativo Dinámico

## 📋 Descripción

Sistema completamente dinámico que genera ecuaciones semánticas usando **ConceptNet** como base de conocimiento. Ya no necesitas programar ecuaciones manualmente: el motor las crea proceduralmente usando relaciones semánticas reales.

---

## 🎯 Arquitectura del Sistema

### 1. **ConceptNet API Wrapper** (`ConceptNetAPI`)
Cliente para la API de ConceptNet que:
- Obtiene relaciones semánticas (sinónimos, antónimos, etc.)
- Calcula similitud entre palabras (0 a 1)
- Cachea todo en localStorage para funcionar offline
- Soporta múltiples tipos de relaciones

**Relaciones soportadas:**
- `Synonym`: Sinónimos (médico → doctor)
- `Antonym`: Antónimos (día → noche)
- `IsA`: Generalización (perro → mamífero)
- `HasA`: Especificación (casa → habitación)
- `RelatedTo`: Relacionados (lluvia → paraguas)
- `HasProperty`: Propiedades (fuego → caliente)
- `SimilarTo`: Similares (gato → felino)

---

### 2. **Motor Generativo** (`OntoleEngine`)

#### **Proceso de Generación:**

```
1. Elegir palabra semilla aleatoria
   └─> Lista de 80+ palabras básicas (familia, profesiones, conceptos)

2. Elegir tipo de operación según pesos
   └─> Antónimo (30%), Quitar propiedad (25%), etc.

3. Consultar ConceptNet para calcular resultado
   └─> Usar la relación adecuada según la operación

4. Buscar alternativas coherentes y poéticas
   └─> Calcular similitud semántica con otras palabras

5. Retornar ecuación formateada
   └─> Con respuestas exactas, coherentes y poéticas
```

#### **Tipos de Operaciones (Nivel 1):**

| Operación | Peso | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `antonym` | 30% | Cambio al opuesto | Rey - Opuesto = Súbdito |
| `remove_property` | 25% | Quitar característica | Médico - Específico = Sanador |
| `generalize` | 20% | Concepto más amplio | Perro - Particular = Animal |
| `specialize` | 15% | Concepto más específico | Animal + Específico = Perro |
| `similar` | 10% | Transformar a similar | Gato → Felino |

---

### 3. **Validación Dinámica de Respuestas**

El sistema valida respuestas en **3 niveles**:

#### **Nivel 1: Coincidencia Exacta**
```javascript
// Compara con respuestas exactas y sinónimos
"padre" === "padre" ✓ (3 puntos)
"papa" === "padre" ✓ (3 puntos - sinónimo)
```

#### **Nivel 2: Similitud Semántica Alta (ConceptNet)**
```javascript
// Calcula similitud > 0.7
similitud("progenitor", "padre") = 0.85 ✓ (2 puntos)
```

#### **Nivel 3: Similitud Semántica Media (ConceptNet)**
```javascript
// Calcula similitud > 0.4
similitud("tutor", "padre") = 0.52 ✓ (1 punto - poético)
```

#### **No válido:**
```javascript
// Similitud < 0.4
similitud("mesa", "padre") = 0.12 ✗ (0 puntos)
```

---

## 🎲 Palabras Semilla (Nivel 1)

El motor tiene **80+ palabras semilla** organizadas por categorías:

### **Familia (16 palabras)**
madre, padre, hijo, hija, hermano, hermana, abuelo, abuela, tío, tía, primo, prima, esposo, esposa, nieto, nieta

### **Profesiones (16 palabras)**
médico, doctor, maestro, profesor, ingeniero, abogado, artista, músico, pintor, escritor, arquitecto, chef, policía, bombero, enfermera, dentista

### **Roles de Poder (11 palabras)**
rey, reina, príncipe, princesa, presidente, alcalde, juez, ministro, gobernador, líder, jefe

### **Emociones (10 palabras)**
amor, odio, alegría, tristeza, miedo, rabia, paz, guerra, esperanza, desesperación

### **Conceptos Básicos (12 palabras)**
día, noche, luz, oscuridad, calor, frío, grande, pequeño, alto, bajo, fuerte, débil

### **Acciones (13 palabras)**
caminar, correr, saltar, volar, nadar, subir, bajar, hablar, escuchar, mirar, tocar, pensar, sentir

---

## 🔄 Flujo de Juego

```
Usuario abre ONTOLÉ
    ↓
Motor genera ecuación dinámica
    ↓
"Madre - Opuesto = ?"
    ↓
ConceptNet consulta antónimos de "madre"
    ↓
Resultado: ["padre", "papá"]
Coherentes: ["progenitor", "tutor"]
Poéticos: ["guardián", "cuidador"]
    ↓
Usuario escribe "padre"
    ↓
Motor valida con ConceptNet
    ↓
¡Exacta! +3 puntos
```

---

## 💾 Sistema de Caché

El motor cachea **todas las consultas** a ConceptNet en `localStorage`:

```javascript
Clave: 'ontole_conceptnet_cache'
Estructura: Map<string, APIResponse>
```

**Ventajas:**
- ✅ Funciona offline después de la primera carga
- ✅ Respuestas instantáneas para ecuaciones ya consultadas
- ✅ Reduce llamadas a la API
- ✅ Persistencia entre sesiones

---

## 📊 Escalabilidad

### **Ecuaciones Posibles (Nivel 1):**

```
80 palabras semilla
× 5 operaciones
× ~5 resultados promedio por operación
= ~2,000 ecuaciones únicas posibles
```

Cada ecuación tiene:
- 1-3 respuestas exactas
- 2-4 respuestas coherentes
- 2-4 respuestas poéticas
- **Total: ~5-11 respuestas válidas por ecuación**

### **Con ConceptNet:**
- **Prácticamente infinito**: puede aceptar cualquier palabra semánticamente relacionada
- **Se adapta al jugador**: aprende nuevas respuestas válidas
- **Expansible**: agregar palabras semilla multiplica las posibilidades

---

## 🔧 Configuración

### **Ajustar Pesos de Operaciones:**

```javascript
// En GENERATION_RULES.nivel1.operaciones
{ tipo: 'antonym', peso: 0.3 }  // 30% de probabilidad
{ tipo: 'similar', peso: 0.1 }   // 10% de probabilidad
```

### **Agregar Nuevas Palabras Semilla:**

```javascript
// En GENERATION_RULES.nivel1.palabrasSemilla
palabrasSemilla: [
    // ... palabras existentes
    'nueva_palabra', 'otra_palabra'
]
```

### **Ajustar Umbrales de Similitud:**

```javascript
// En OntoleEngine.validarRespuesta()
if (similitud > 0.7) return { coherencia: 'exacta' };     // Más estricto: 0.8
if (similitud > 0.4) return { coherencia: 'coherente' };  // Más estricto: 0.5
```

---

## 🎯 Ventajas del Sistema Generativo

### **vs. Sistema Manual (Anterior):**

| Característica | Manual | Generativo |
|----------------|--------|------------|
| Ecuaciones | 14 fijas | ~2,000+ dinámicas |
| Mantenimiento | Alto (codificar c/u) | Bajo (solo reglas) |
| Repetitividad | Alta (se repiten) | Baja (siempre diferente) |
| Escalabilidad | Lineal | Exponencial |
| Sinónimos | Manual (codificar) | Automático (ConceptNet) |
| Validación | Exacta solamente | Exacta + Semántica |
| Offline | ✓ | ✓ (con caché) |

---

## 🚀 Próximos Pasos

### **Fase 1: Optimización (Completado)**
- [x] Motor generativo con ConceptNet
- [x] Validación semántica dinámica
- [x] Sistema de caché offline
- [x] 80+ palabras semilla

### **Fase 2: Mejoras (Próximamente)**
- [ ] Agregar más tipos de operaciones (metáfora, metonimia)
- [ ] Sistema de aprendizaje (guardar respuestas válidas de usuarios)
- [ ] Nivel 2 con operaciones compuestas (2 pasos)
- [ ] Expandir a 200+ palabras semilla

### **Fase 3: IA Híbrida (Futuro)**
- [ ] Fallback a LLM local (Ollama) si ConceptNet no tiene respuesta
- [ ] Generación de explicaciones personalizadas
- [ ] Sugerencias contextuales

---

## 📝 Uso

```javascript
// Crear instancia del motor
const engine = new OntoleEngine();

// Generar ecuación
const ecuacion = await engine.generarEcuacion(nivel);
console.log(ecuacion.operacion); // "Madre - Opuesto"
console.log(ecuacion.respuestas.exactas); // ["padre", "papá"]

// Validar respuesta
const resultado = await engine.validarRespuesta(ecuacion, "padre");
console.log(resultado.correcto); // true
console.log(resultado.puntos); // 3
console.log(resultado.coherencia); // "exacta"
```

---

## 🐛 Troubleshooting

### **"No se pudo generar ecuación"**
- ConceptNet puede no tener relaciones para algunas palabras
- El sistema reintenta automáticamente con otra palabra

### **"Validación lenta"**
- Primera vez consulta la API (lento)
- Después usa caché (instantáneo)

### **"Respuesta válida pero no aceptada"**
- Ajusta los umbrales de similitud en `validarRespuesta()`
- ConceptNet español tiene menos cobertura que inglés

---

## 💡 Notas Técnicas

- **API Rate Limit**: ConceptNet permite ~100 req/min (suficiente para uso normal)
- **Caché**: Crece con el uso, puede ocupar varios MB en localStorage
- **Fallback**: Si ConceptNet falla, usa el diccionario manual legacy
- **Idioma**: Configurado para español (`/c/es/palabra`)

---

**Autor**: Sistema diseñado para WallaPic/Ontolé
**Versión**: 2.0 (Sistema Generativo)
**Fecha**: 2026
