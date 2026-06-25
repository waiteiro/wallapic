# ONTOLÉ - Sistema de Álgebra Semántica

## 📋 Descripción

Ontolé es un juego cognitivo basado en álgebra semántica: la aplicación de operaciones matemáticas (suma y resta) sobre los **atributos conceptuales** de las palabras, no sobre sus formas léxicas.

**Ejemplo:**
```
Madre - Femenino = Padre
Rey - Nobleza - Permanente + Electo = Presidente
```

## 🎯 Concepto

En Ontolé, cada palabra es un **conjunto de atributos semánticos**. Al realizar operaciones matemáticas sobre estos atributos, emergen nuevos conceptos. No hay respuestas únicas ni correctas en sentido absoluto, sino **tres niveles de coherencia semántica**:

- 🎯 **Exacta (3 pts)**: La respuesta más obvia y prototípica
- ✅ **Coherente (2 pts)**: Válida pero no tan prototípica
- ✨ **Poética (1 pt)**: Inesperada pero defendible, activa pensamiento analógico

## 📁 Archivos Modulares

El sistema está completamente desacoplado del resto de WallaPic:

### 1. `ontole.css`
Estilos completamente independientes con:
- Variables CSS propias (`--ontole-*`)
- Sin colisiones con estilos de WallaPic
- Temas claro/oscuro integrados
- Animaciones y transiciones específicas

### 2. `ontole-dictionary.js`
Base de datos semántica con:
- **Familias de Atributos**: GENERO, EDAD, VINCULO, PODER, ACCION, ESTADO, ESCALA, DOMINIO, CARGA, FORMA
- **Diccionario de Palabras**: 50+ palabras iniciales con sus atributos
- **Ecuaciones predefinidas**: Operaciones con resultados evaluados
- Funciones de validación y búsqueda

### 3. `ontole.js`
Lógica del juego con:
- Sistema de niveles y puntuación
- 3 modos de juego: Ecuación, Libre, Ayuda
- Persistencia en localStorage
- Animaciones de logros y feedback
- Gestión de estado independiente

## 🎮 Modos de Juego

### Modo Ecuación (MVP)
El jugador resuelve ecuaciones semánticas:
```
Médico - Cuerpo + Mente = ?
Respuesta: Psicólogo
```

### Modo Libre
Exploración sin límites. El jugador construye cadenas de transformaciones semánticas:
```
Silencio → Silencio + Tensión = Pausa → Pausa - Temporal = Umbral
```

### Modo Ayuda
Tutorial interactivo que explica:
- Qué es Ontolé
- Niveles de coherencia
- Niveles de jugador
- Ejemplos de ecuaciones

## 📊 Sistema de Progresión

| Nivel | Nombre | Puntos |
|-------|--------|--------|
| 1 | Aprendiz | 0-150 |
| 2 | Explorador | 151-400 |
| 3 | Intérprete | 401-900 |
| 4 | Semántico | 901-1800 |
| 5 | Filósofo | 1801-3500 |
| 6 | Ontologista | 3501-6000 |
| 7 | Arquitecto | 6001+ |

## 🔧 Integración con WallaPic

### Botón en Sidebar
Se agregó un botón en el panel lateral derecho:
```html
<button class="sidebar-btn" id="ontoleBtn" data-tooltip="Ontolé">
    <svg>...</svg> <!-- Icono de capas -->
</button>
```

### Event Listener en app.js
```javascript
const ontoleBtn = document.getElementById('ontoleBtn');
if (ontoleBtn) {
    ontoleBtn.addEventListener('click', () => {
        if (typeof window.ontoleInstance !== 'undefined') {
            window.ontoleInstance.open();
        }
    });
}
```

### Carga de Scripts
```html
<!-- En index.html, antes de app.js -->
<script src="ontole-dictionary.js"></script>
<script src="ontole.js"></script>
```

## 🎨 Diseño Modular

**Ventajas:**
- ✅ **Cero dependencias** de WallaPic
- ✅ **Estilos encapsulados** con prefijo `ontole-`
- ✅ **Estado independiente** en localStorage (`ontole_player_data`)
- ✅ **Fácil de remover**: eliminar 3 archivos y 10 líneas de código
- ✅ **Escalable**: agregar nuevas palabras y modos sin afectar WallaPic

## 📝 Agregar Nuevas Palabras

```javascript
// En ontole-dictionary.js
'palabra': {
    palabra: 'Palabra',
    nucleo: ['Atributo1', 'Atributo2'], // No operables
    operables: ['Atributo3', 'Atributo4'], // Sumables/restables
    implicados: ['Atributo5'], // Inferidos pero no explícitos
    familia: 'Familia',
    nivel: 1, // Nivel de dificultad
    ecuaciones: [
        {
            operacion: 'Palabra - Atributo3',
            resultados: [
                { 
                    palabra: 'Resultado', 
                    coherencia: 'exacta', 
                    puntos: 3, 
                    explicacion: '...' 
                }
            ]
        }
    ]
}
```

## 🚀 Próximas Fases

### Fase 2: Expansión
- [ ] Diccionario de 200 palabras
- [ ] Cadenas de 3 pasos
- [ ] Modo Colectivo semanal

### Fase 3: Social e IA
- [ ] Modo Duelo en círculos
- [ ] Validación de respuestas por IA
- [ ] Propuesta comunitaria de palabras

## 📚 Fundamentación Teórica

Basado en:
- **Semántica de rasgos** (Katz & Fodor, 1963)
- **Teoría de prototipos** (Rosch, 1973)
- **Álgebra de conjuntos** aplicada al significado
- **Ontologías formales** (OWL, WordNet)

## 💡 Autor

Diseñado según el documento "Ontole — Algebra Semantica como Sistema de Juego" del Proyecto Trasluz.

---

**Nota**: Este es un sistema completamente modular e independiente. Todos los archivos tienen el prefijo `ontole-` o `ontole.` para facilitar su identificación y mantenimiento.
