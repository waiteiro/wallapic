/* ============================================
   ONTOLE ENGINE - Motor 100% IA Generativo
   Sistema autónomo con Groq AI
   ============================================ */

// ============================================
// GROQ API WRAPPER
// ============================================
class GroqAI {
    constructor() {
        // Usar backend proxy en producción, API directa en desarrollo
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.apiKey = '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'; // Solo para desarrollo local
        this.baseUrl = this.isProduction 
            ? '/.netlify/functions/groq-proxy'  // Backend proxy en producción
            : 'https://api.groq.com/openai/v1/chat/completions'; // API directa en local
        this.model = 'llama-3.3-70b-versatile';
        this.cache = new Map();
    }

    async generate(prompt, systemPrompt = '') {
        // NO USAR CACHÉ - Siempre generar contenido nuevo y aleatorio
        
        try {
            console.log('🤖 Consultando Groq AI...');
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Solo agregar Authorization en desarrollo (llamada directa a Groq)
            if (!this.isProduction) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt || 'Eres un experto en semántica y álgebra conceptual.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.9, // MÁS ALEATORIO (antes era 0.7)
                    max_tokens: 200,
                    top_p: 0.95 // Más variedad
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('Groq API error:', error);
                return null;
            }

            const data = await response.json();
            const result = data.choices[0]?.message?.content?.trim();
            
            console.log('✅ Respuesta de Groq recibida');
            return result;
            
        } catch (error) {
            console.error('Groq API Error:', error);
            return null;
        }
    }

    // Guardar caché en localStorage
    saveCache() {
        try {
            const cacheData = Array.from(this.cache.entries());
            localStorage.setItem('ontole_groq_cache', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('No se pudo guardar caché:', e);
        }
    }

    // Cargar caché desde localStorage
    loadCache() {
        try {
            const cacheData = localStorage.getItem('ontole_groq_cache');
            if (cacheData) {
                const entries = JSON.parse(cacheData);
                this.cache = new Map(entries);
            }
        } catch (e) {
            console.warn('No se pudo cargar caché:', e);
        }
    }
}

// ============================================
// TIPOS DE ECUACIÓN DINÁMICOS
// ============================================
const EQUATION_TYPES = [
    {
        tipo: 'simple',
        nombre: 'Ecuación Simple',
        descripcion: '1 operación',
        peso: 0.3,
        template: 'palabra + operacion = ?'
    },
    {
        tipo: 'doble',
        nombre: 'Ecuación Doble',
        descripcion: '2 operaciones',
        peso: 0.25,
        template: 'palabra + op1 - op2 = ?'
    },
    {
        tipo: 'triple',
        nombre: 'Ecuación Triple',
        descripcion: '3 operaciones',
        peso: 0.15,
        template: 'palabra + op1 - op2 + op3 = ?'
    },
    {
        tipo: 'inversa',
        nombre: 'Ecuación Inversa',
        descripcion: 'Dado el resultado, encuentra la palabra',
        peso: 0.15,
        template: '? + operacion = resultado'
    },
    {
        tipo: 'completa',
        nombre: 'Ecuación Completa',
        descripcion: 'Encuentra la operación faltante',
        peso: 0.1,
        template: 'palabra + ? = resultado'
    },
    {
        tipo: 'creativa',
        nombre: 'Ecuación Creativa',
        descripcion: 'La IA inventa algo único',
        peso: 0.05,
        template: 'creativa'
    }
];

// ============================================
// OPERACIONES BASE
// ============================================
const OPERATIONS = [
    {
        simbolo: '-',
        nombre: 'Quitar',
        ejemplos: ['género', 'edad', 'profesión', 'tamaño', 'tiempo', 'color', 'emoción']
    },
    {
        simbolo: '+',
        nombre: 'Agregar',
        ejemplos: ['poder', 'sabiduría', 'antigüedad', 'intensidad', 'modernidad', 'naturaleza']
    },
    {
        simbolo: '→',
        nombre: 'Transformar',
        ejemplos: ['contrario', 'similar', 'metáfora', 'símbolo']
    }
];

// ============================================
// MOTOR GENERATIVO 100% IA
// ============================================
class OntoleEngine {
    constructor() {
        this.groq = new GroqAI();
        // NO CARGAR CACHÉ - Siempre fresco
        // this.groq.loadCache();
        
        // LIMPIAR CACHÉ VIEJO
        localStorage.removeItem('ontole_groq_cache');
        
        this.ecuacionesGeneradas = [];
        this.historialJugador = [];
        
        console.log('🎮 Motor Ontole 100% IA inicializado (sin caché)');
    }

    // Generar palabra semilla con IA
    async generarPalabraSemilla(nivel = 1) {
        const dificultad = nivel <= 2 ? 'básica y común' : nivel <= 4 ? 'intermedia' : 'avanzada o abstracta';
        
        // AGREGAR TIMESTAMP PARA HACER PROMPT ÚNICO
        const random = Math.random();
        const prompt = `Dame UNA palabra DIFERENTE en español de nivel ${dificultad}. 
IMPORTANTE: No repitas palabras anteriores. Elige algo aleatorio.
Random seed: ${random}
Responde SOLO con la palabra, sin explicaciones.
Ejemplos: familia, esperanza, libertad, médico, luz, poder, sueño, memoria, justicia`;

        const palabra = await this.groq.generate(prompt);
        return palabra ? palabra.toLowerCase().trim() : null;
    }

    // Generar ecuación completa con IA (NUEVO SISTEMA DINÁMICO)
    async generarEcuacion(nivel = 1, intentos = 0) {
        if (intentos >= 3) {
            console.error('❌ No se pudo generar ecuación después de 3 intentos');
            throw new Error('No se pudo generar ecuación');
        }

        try {
            console.log(`🎲 Generando ecuación DINÁMICA con IA (intento ${intentos + 1})`);
            
            // 1. Elegir tipo de ecuación aleatoriamente
            const tipoEcuacion = this.elegirTipoEcuacion();
            console.log(`🎯 Tipo elegido: ${tipoEcuacion.nombre}`);
            
            // 2. Generar según el tipo
            let ecuacion;
            
            switch (tipoEcuacion.tipo) {
                case 'simple':
                    ecuacion = await this.generarEcuacionSimple(nivel);
                    break;
                case 'doble':
                    ecuacion = await this.generarEcuacionDoble(nivel);
                    break;
                case 'triple':
                    ecuacion = await this.generarEcuacionTriple(nivel);
                    break;
                case 'inversa':
                    ecuacion = await this.generarEcuacionInversa(nivel);
                    break;
                case 'completa':
                    ecuacion = await this.generarEcuacionCompleta(nivel);
                    break;
                case 'creativa':
                    ecuacion = await this.generarEcuacionCreativa(nivel);
                    break;
                default:
                    ecuacion = await this.generarEcuacionSimple(nivel);
            }
            
            if (!ecuacion) {
                return await this.generarEcuacion(nivel, intentos + 1);
            }
            
            this.ecuacionesGeneradas.push(ecuacion);
            console.log('✅ Ecuación generada:', ecuacion);
            return ecuacion;
            
        } catch (error) {
            console.error('Error generando ecuación:', error);
            return await this.generarEcuacion(nivel, intentos + 1);
        }
    }

    // Elegir tipo de ecuación por peso
    elegirTipoEcuacion() {
        const totalPeso = EQUATION_TYPES.reduce((sum, tipo) => sum + tipo.peso, 0);
        let random = Math.random() * totalPeso;
        
        for (const tipo of EQUATION_TYPES) {
            random -= tipo.peso;
            if (random <= 0) return tipo;
        }
        
        return EQUATION_TYPES[0];
    }

    // ECUACIÓN SIMPLE: palabra + operacion = ?
    async generarEcuacionSimple(nivel) {
        const palabra = await this.generarPalabraSemilla(nivel);
        if (!palabra) return null;
        
        const random = Math.random();
        const prompt = `Palabra base: "${palabra}"

Crea UNA operación semántica sobre esta palabra.
Random: ${random}

Formato de respuesta (separado por |):
operacion_humana|palabra_exacta|coherente1,coherente2|poetica1,poetica2

Ejemplo: "Quitar género|padre|progenitor,tutor|protector,guía"

- operacion_humana: descripción en español de qué se hace (Ej: "Quitar género", "Agregar antigüedad", "Transformar a contrario")
- palabra_exacta: resultado más obvio
- coherentes: 2 alternativas válidas
- poeticas: 2 alternativas creativas`;

        const respuesta = await this.groq.generate(prompt);
        if (!respuesta) return null;
        
        const partes = respuesta.split('|').map(p => p.trim());
        if (partes.length < 2) return null;
        
        return {
            id: `${Date.now()}_${Math.random()}`,
            tipo: 'simple',
            operacion: `${palabra} - ${partes[0]} = ?`,
            palabraBase: palabra,
            nivel,
            respuestas: {
                exactas: [partes[1]],
                coherentes: partes[2] ? partes[2].split(',').map(p => p.trim()).filter(Boolean) : [],
                poeticas: partes[3] ? partes[3].split(',').map(p => p.trim()).filter(Boolean) : []
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                fuente: 'groq_ai',
                tipoEcuacion: 'simple'
            }
        };
    }

    // ECUACIÓN DOBLE: palabra + op1 - op2 = ?
    async generarEcuacionDoble(nivel) {
        const palabra = await this.generarPalabraSemilla(nivel);
        if (!palabra) return null;
        
        const random = Math.random();
        const prompt = `Palabra base: "${palabra}"

Crea DOS operaciones semánticas encadenadas (una suma y una resta).
Random: ${random}

Formato de respuesta (separado por |):
op1,op2|palabra_exacta|coherente1,coherente2|poetica1,poetica2

Ejemplo: "Agregar poder,Quitar humanidad|tirano|dictador,déspota|monstruo,demonio"

Las operaciones deben ser DIFERENTES y crear un resultado interesante.`;

        const respuesta = await this.groq.generate(prompt);
        if (!respuesta) return null;
        
        const partes = respuesta.split('|').map(p => p.trim());
        if (partes.length < 2) return null;
        
        const ops = partes[0].split(',').map(p => p.trim());
        
        return {
            id: `${Date.now()}_${Math.random()}`,
            tipo: 'doble',
            operacion: `${palabra} + ${ops[0]} - ${ops[1]} = ?`,
            palabraBase: palabra,
            nivel,
            respuestas: {
                exactas: [partes[1]],
                coherentes: partes[2] ? partes[2].split(',').map(p => p.trim()).filter(Boolean) : [],
                poeticas: partes[3] ? partes[3].split(',').map(p => p.trim()).filter(Boolean) : []
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                fuente: 'groq_ai',
                tipoEcuacion: 'doble'
            }
        };
    }

    // ECUACIÓN TRIPLE: palabra + op1 - op2 + op3 = ?
    async generarEcuacionTriple(nivel) {
        const palabra = await this.generarPalabraSemilla(nivel);
        if (!palabra) return null;
        
        const random = Math.random();
        const prompt = `Palabra base: "${palabra}"

Crea TRES operaciones semánticas encadenadas (mezcla sumas y restas).
Random: ${random}

Formato de respuesta (separado por |):
op1,op2,op3|palabra_exacta|coherente1,coherente2|poetica1,poetica2

Ejemplo: "Agregar sabiduría,Quitar juventud,Agregar poder|anciano poderoso|sabio,líder|maestro,oráculo"`;

        const respuesta = await this.groq.generate(prompt);
        if (!respuesta) return null;
        
        const partes = respuesta.split('|').map(p => p.trim());
        if (partes.length < 2) return null;
        
        const ops = partes[0].split(',').map(p => p.trim());
        
        return {
            id: `${Date.now()}_${Math.random()}`,
            tipo: 'triple',
            operacion: `${palabra} + ${ops[0]} - ${ops[1]} + ${ops[2]} = ?`,
            palabraBase: palabra,
            nivel,
            respuestas: {
                exactas: [partes[1]],
                coherentes: partes[2] ? partes[2].split(',').map(p => p.trim()).filter(Boolean) : [],
                poeticas: partes[3] ? partes[3].split(',').map(p => p.trim()).filter(Boolean) : []
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                fuente: 'groq_ai',
                tipoEcuacion: 'triple'
            }
        };
    }

    // ECUACIÓN INVERSA: ? + operacion = resultado
    async generarEcuacionInversa(nivel) {
        const resultado = await this.generarPalabraSemilla(nivel);
        if (!resultado) return null;
        
        const random = Math.random();
        const prompt = `Resultado final: "${resultado}"

Encuentra la palabra inicial que con UNA operación llega a "${resultado}".
Random: ${random}

Formato de respuesta (separado por |):
operacion|palabra_inicial_exacta|coherente1,coherente2|poetica1,poetica2

Ejemplo para resultado "padre": "Agregar género masculino|madre|progenitor,familiar|cuidador,guía"`;

        const respuesta = await this.groq.generate(prompt);
        if (!respuesta) return null;
        
        const partes = respuesta.split('|').map(p => p.trim());
        if (partes.length < 2) return null;
        
        return {
            id: `${Date.now()}_${Math.random()}`,
            tipo: 'inversa',
            operacion: `? + ${partes[0]} = ${resultado}`,
            palabraBase: resultado,
            nivel,
            respuestas: {
                exactas: [partes[1]],
                coherentes: partes[2] ? partes[2].split(',').map(p => p.trim()).filter(Boolean) : [],
                poeticas: partes[3] ? partes[3].split(',').map(p => p.trim()).filter(Boolean) : []
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                fuente: 'groq_ai',
                tipoEcuacion: 'inversa'
            }
        };
    }

    // ECUACIÓN COMPLETA: palabra + ? = resultado
    async generarEcuacionCompleta(nivel) {
        const palabra = await this.generarPalabraSemilla(nivel);
        if (!palabra) return null;
        
        const random = Math.random();
        const prompt = `Palabra inicial: "${palabra}"

Genera un resultado final y encuentra qué operación se necesita.
Random: ${random}

Formato de respuesta (separado por |):
resultado,operacion_exacta|operacion_coherente1,operacion_coherente2|operacion_poetica1,operacion_poetica2

Ejemplo para "niño": "adulto,Agregar edad|Agregar madurez,Agregar experiencia|Agregar responsabilidad,Agregar peso"`;

        const respuesta = await this.groq.generate(prompt);
        if (!respuesta) return null;
        
        const partes = respuesta.split('|').map(p => p.trim());
        if (partes.length < 2) return null;
        
        const [resultadoFinal, operacionExacta] = partes[0].split(',').map(p => p.trim());
        
        return {
            id: `${Date.now()}_${Math.random()}`,
            tipo: 'completa',
            operacion: `${palabra} + ? = ${resultadoFinal}`,
            palabraBase: palabra,
            nivel,
            respuestas: {
                exactas: [operacionExacta],
                coherentes: partes[1] ? partes[1].split(',').map(p => p.trim()).filter(Boolean) : [],
                poeticas: partes[2] ? partes[2].split(',').map(p => p.trim()).filter(Boolean) : []
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                fuente: 'groq_ai',
                tipoEcuacion: 'completa'
            }
        };
    }

    // ECUACIÓN CREATIVA: La IA inventa algo único
    async generarEcuacionCreativa(nivel) {
        const random = Math.random();
        const prompt = `Inventa una ecuación semántica ÚNICA y CREATIVA.
Random: ${random}

Puede ser cualquier cosa: metáforas, transformaciones raras, mezclas conceptuales.

Formato de respuesta (separado por |):
ecuacion_visual|palabra_exacta|coherente1,coherente2|poetica1,poetica2

Ejemplo: "esperanza × tiempo ÷ realidad = ?|desilusión|desengaño,resignación|melancolía,sabiduría"

Sé MUY creativo. No repitas formatos comunes.`;

        const respuesta = await this.groq.generate(prompt);
        if (!respuesta) return null;
        
        const partes = respuesta.split('|').map(p => p.trim());
        if (partes.length < 2) return null;
        
        return {
            id: `${Date.now()}_${Math.random()}`,
            tipo: 'creativa',
            operacion: partes[0],
            palabraBase: null,
            nivel,
            respuestas: {
                exactas: [partes[1]],
                coherentes: partes[2] ? partes[2].split(',').map(p => p.trim()).filter(Boolean) : [],
                poeticas: partes[3] ? partes[3].split(',').map(p => p.trim()).filter(Boolean) : []
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                fuente: 'groq_ai',
                tipoEcuacion: 'creativa'
            }
        };
    }

    // Parsear respuesta de la IA (simplificado)
    parsearRespuestaIA(respuesta) {
        try {
            const partes = respuesta.split('|').map(p => p.trim());
            
            return {
                exactas: partes[0] ? [partes[0]] : [],
                coherentes: partes[1] ? partes[1].split(',').map(p => p.trim()).filter(Boolean) : [],
                poeticas: partes[2] ? partes[2].split(',').map(p => p.trim()).filter(Boolean) : []
            };
        } catch (error) {
            console.error('Error parseando respuesta IA:', error);
            return { exactas: [], coherentes: [], poeticas: [] };
        }
    }

    // Validar respuesta del usuario
    async validarRespuesta(ecuacion, respuestaUsuario) {
        try {
            const respuestaNormalizada = respuestaUsuario.toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            const exactas = ecuacion.respuestas?.exactas || [];
            const coherentes = ecuacion.respuestas?.coherentes || [];
            const poeticas = ecuacion.respuestas?.poeticas || [];
            
            // Verificar respuestas exactas
            for (const exacta of exactas) {
                if (!exacta) continue;
                const exactaNormalizada = exacta.toLowerCase().trim()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                if (exactaNormalizada === respuestaNormalizada) {
                    return {
                        correcto: true,
                        coherencia: 'exacta',
                        puntos: 3,
                        explicacion: `¡Excelente! "${exacta}" es la respuesta más directa.`,
                        palabraCorrecta: exacta
                    };
                }
            }
            
            // Verificar coherentes
            for (const coherente of coherentes) {
                if (!coherente) continue;
                const coherenteNormalizada = coherente.toLowerCase().trim()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                if (coherenteNormalizada === respuestaNormalizada) {
                    return {
                        correcto: true,
                        coherencia: 'coherente',
                        puntos: 2,
                        explicacion: `¡Muy bien! "${coherente}" es válida y coherente.`,
                        palabraCorrecta: coherente
                    };
                }
            }
            
            // Verificar poéticas
            for (const poetica of poeticas) {
                if (!poetica) continue;
                const poeticaNormalizada = poetica.toLowerCase().trim()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                if (poeticaNormalizada === respuestaNormalizada) {
                    return {
                        correcto: true,
                        coherencia: 'poetica',
                        puntos: 1,
                        explicacion: `¡Interesante! "${poetica}" es creativa.`,
                        palabraCorrecta: poetica
                    };
                }
            }
            
            // Si no coincide, validar con IA
            console.log('🤔 Validando respuesta creativa con IA...');
            const validacionIA = await this.validarConIA(ecuacion, respuestaUsuario);
            
            if (validacionIA) {
                return validacionIA;
            }
            
            // No es correcta
            return {
                correcto: false,
                alternativas: [
                    ...exactas.slice(0, 2),
                    ...coherentes.slice(0, 2)
                ].filter(Boolean),
                mensaje: 'No encontramos relación semántica clara. Prueba con:'
            };
            
        } catch (error) {
            console.error('Error validando respuesta:', error);
            return {
                correcto: false,
                mensaje: 'Error al validar. Intenta de nuevo.',
                alternativas: []
            };
        }
    }

    // Validar respuesta creativa con IA (actualizado para tipos dinámicos)
    async validarConIA(ecuacion, respuestaUsuario) {
        const prompt = `Ecuación: ${ecuacion.operacion}
Tipo: ${ecuacion.tipo}
Respuesta del usuario: "${respuestaUsuario}"

¿Es "${respuestaUsuario}" una respuesta válida para esta ecuación? 

Responde:
- "exacta" si es perfecta
- "coherente" si es válida pero no tan directa  
- "poetica" si es creativa/metafórica
- "no" si no tiene sentido

Responde SOLO con: exacta, coherente, poetica o no`;

        const validacion = await this.groq.generate(prompt);
        
        if (!validacion) return null;
        
        const resultado = validacion.toLowerCase().trim();
        
        if (resultado === 'exacta') {
            return {
                correcto: true,
                coherencia: 'exacta',
                puntos: 3,
                explicacion: `¡Excelente! "${respuestaUsuario}" es perfecta.`,
                palabraCorrecta: respuestaUsuario
            };
        } else if (resultado === 'coherente') {
            return {
                correcto: true,
                coherencia: 'coherente',
                puntos: 2,
                explicacion: `¡Muy bien! "${respuestaUsuario}" es coherente.`,
                palabraCorrecta: respuestaUsuario
            };
        } else if (resultado === 'poetica' || resultado === 'poética') {
            return {
                correcto: true,
                coherencia: 'poetica',
                puntos: 1,
                explicacion: `¡Creativo! "${respuestaUsuario}" es poética.`,
                palabraCorrecta: respuestaUsuario
            };
        }
        
        return null;
    }

    // Obtener estadísticas
    getEstadisticas() {
        return {
            ecuacionesGeneradas: this.ecuacionesGeneradas.length,
            cacheSize: this.groq.cache.size,
            historialJugador: this.historialJugador.length
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.OntoleEngine = OntoleEngine;
    window.GroqAI = GroqAI;
    window.EQUATION_TYPES = EQUATION_TYPES;
    window.OPERATIONS = OPERATIONS;
}
