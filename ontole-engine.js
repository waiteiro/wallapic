/* ============================================
   ONTOLE ENGINE - Motor Generativo Dinámico
   Sistema procedural de ecuaciones semánticas
   ============================================ */

// ============================================
// CONCEPTNET API WRAPPER
// ============================================
class ConceptNetAPI {
    constructor() {
        this.baseUrl = 'https://api.conceptnet.io';
        this.cache = new Map();
        this.idioma = 'es';
    }

    // Cachear requests para funcionar offline
    getCacheKey(endpoint, params) {
        return `${endpoint}_${JSON.stringify(params)}`;
    }

    async fetch(endpoint, params = {}) {
        const cacheKey = this.getCacheKey(endpoint, params);
        
        // Intentar obtener de caché
        if (this.cache.has(cacheKey)) {
            console.log('✅ Usando caché para:', endpoint);
            return this.cache.get(cacheKey);
        }

        try {
            const url = `${this.baseUrl}${endpoint}`;
            console.log('🌐 Consultando ConceptNet:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                console.error(`ConceptNet error: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const data = await response.json();
            
            // Guardar en caché
            this.cache.set(cacheKey, data);
            this.saveCache();
            
            console.log('✅ Respuesta de ConceptNet recibida');
            return data;
        } catch (error) {
            console.error('ConceptNet API Error:', error);
            return null;
        }
    }

    // Obtener relaciones de una palabra
    async getRelations(palabra, relationType = null) {
        try {
            const endpoint = `/query?node=/c/${this.idioma}/${palabra}${relationType ? `&rel=/r/${relationType}` : ''}`;
            const data = await this.fetch(endpoint);
            
            if (!data || !data.edges || !Array.isArray(data.edges)) return [];
            
            return data.edges
                .map(edge => {
                    if (!edge || !edge.rel) return null;
                    
                    const palabraExtraida = this.extractWord(edge.end?.label || edge.start?.label);
                    if (!palabraExtraida || palabraExtraida === palabra) return null;
                    
                    return {
                        palabra: palabraExtraida,
                        relacion: edge.rel.label || 'unknown',
                        peso: edge.weight || 1,
                        start: this.extractWord(edge.start?.label),
                        end: this.extractWord(edge.end?.label)
                    };
                })
                .filter(r => r !== null && r.palabra && r.palabra.length > 0);
        } catch (error) {
            console.error('Error obteniendo relaciones:', error);
            return [];
        }
    }

    // Calcular similitud semántica entre dos palabras
    async getSimilarity(palabra1, palabra2) {
        try {
            const endpoint = `/relatedness?node1=/c/${this.idioma}/${palabra1}&node2=/c/${this.idioma}/${palabra2}`;
            const data = await this.fetch(endpoint);
            return data?.value || 0;
        } catch (error) {
            console.error('Error calculando similitud:', error);
            return 0;
        }
    }

    // Buscar palabras relacionadas por tipo específico
    async getBusquedaRelacionada(palabra, relacionTipo) {
        const relaciones = await this.getRelations(palabra, relacionTipo);
        return relaciones.map(r => r.palabra);
    }

    // Obtener sinónimos
    async getSinonimos(palabra) {
        return await this.getBusquedaRelacionada(palabra, 'Synonym');
    }

    // Obtener antónimos
    async getAntonimos(palabra) {
        return await this.getBusquedaRelacionada(palabra, 'Antonym');
    }

    // Obtener palabras similares (SimilarTo, RelatedTo)
    async getPalabrasSimilares(palabra) {
        const similares = await this.getBusquedaRelacionada(palabra, 'SimilarTo');
        const relacionadas = await this.getBusquedaRelacionada(palabra, 'RelatedTo');
        return [...new Set([...similares, ...relacionadas])];
    }

    extractWord(label) {
        if (!label || typeof label !== 'string') return '';
        // Extraer palabra del label de ConceptNet
        // Formato típico: "/c/es/palabra" o simplemente "palabra"
        let palabra = label;
        
        // Si tiene formato de ConceptNet, extraer la última parte
        if (label.includes('/')) {
            const parts = label.split('/');
            palabra = parts[parts.length - 1];
        }
        
        // Limpiar y normalizar
        palabra = palabra.toLowerCase()
            .replace(/_/g, ' ')  // Reemplazar guiones bajos por espacios
            .replace(/[^a-záéíóúñü\s]/gi, '')  // Solo letras y espacios
            .trim();
        
        return palabra;
    }

    // Guardar caché en localStorage
    saveCache() {
        try {
            const cacheData = Array.from(this.cache.entries());
            localStorage.setItem('ontole_conceptnet_cache', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('No se pudo guardar caché:', e);
        }
    }

    // Cargar caché desde localStorage
    loadCache() {
        try {
            const cacheData = localStorage.getItem('ontole_conceptnet_cache');
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
// REGLAS DE GENERACIÓN POR NIVEL
// ============================================
const GENERATION_RULES = {
    nivel1: {
        operaciones: [
            { 
                tipo: 'antonym', 
                nombre: 'Cambio opuesto',
                descripcion: 'Cambiar al concepto opuesto',
                peso: 0.3,
                relacionConceptNet: 'Antonym'
            },
            { 
                tipo: 'remove_property', 
                nombre: 'Quitar propiedad',
                descripcion: 'Eliminar una característica específica',
                peso: 0.25,
                relacionConceptNet: 'HasProperty'
            },
            { 
                tipo: 'generalize', 
                nombre: 'Generalizar',
                descripcion: 'Ir a un concepto más amplio',
                peso: 0.2,
                relacionConceptNet: 'IsA'
            },
            { 
                tipo: 'specialize', 
                nombre: 'Especificar',
                descripcion: 'Ir a un concepto más específico',
                peso: 0.15,
                relacionConceptNet: 'HasA'
            },
            { 
                tipo: 'similar', 
                nombre: 'Transformar similar',
                descripcion: 'Cambiar a concepto relacionado',
                peso: 0.1,
                relacionConceptNet: 'RelatedTo'
            }
        ],
        palabrasSemilla: [
            // Familia
            'madre', 'padre', 'hijo', 'hija', 'hermano', 'hermana', 'abuelo', 'abuela',
            'tío', 'tía', 'primo', 'prima', 'esposo', 'esposa', 'nieto', 'nieta',
            
            // Profesiones
            'médico', 'doctor', 'maestro', 'profesor', 'ingeniero', 'abogado',
            'artista', 'músico', 'pintor', 'escritor', 'arquitecto', 'chef',
            'policía', 'bombero', 'enfermera', 'dentista',
            
            // Roles de poder
            'rey', 'reina', 'príncipe', 'princesa', 'presidente', 'alcalde',
            'juez', 'ministro', 'gobernador', 'líder', 'jefe',
            
            // Emociones básicas
            'amor', 'odio', 'alegría', 'tristeza', 'miedo', 'rabia',
            'paz', 'guerra', 'esperanza', 'desesperación',
            
            // Conceptos básicos
            'día', 'noche', 'luz', 'oscuridad', 'calor', 'frío',
            'grande', 'pequeño', 'alto', 'bajo', 'fuerte', 'débil',
            
            // Acciones básicas
            'caminar', 'correr', 'saltar', 'volar', 'nadar', 'subir', 'bajar',
            'hablar', 'escuchar', 'mirar', 'tocar', 'pensar', 'sentir'
        ],
        complejidadMaxima: 1  // Solo 1 operación
    },
    
    nivel2: {
        operaciones: [
            // Mismo que nivel 1 pero con más operaciones complejas
            { tipo: 'antonym', nombre: 'Cambio opuesto', peso: 0.25, relacionConceptNet: 'Antonym' },
            { tipo: 'remove_property', nombre: 'Quitar propiedad', peso: 0.2, relacionConceptNet: 'HasProperty' },
            { tipo: 'add_property', nombre: 'Agregar propiedad', peso: 0.15, relacionConceptNet: 'HasProperty' },
            { tipo: 'generalize', nombre: 'Generalizar', peso: 0.15, relacionConceptNet: 'IsA' },
            { tipo: 'combine', nombre: 'Combinar conceptos', peso: 0.15, relacionConceptNet: 'RelatedTo' },
            { tipo: 'metaphor', nombre: 'Metáfora', peso: 0.1, relacionConceptNet: 'SymbolOf' }
        ],
        complejidadMaxima: 2  // Hasta 2 operaciones encadenadas
    }
};

// ============================================
// MOTOR GENERATIVO DE ECUACIONES
// ============================================
class OntoleEngine {
    constructor() {
        this.conceptNet = new ConceptNetAPI();
        this.conceptNet.loadCache();
        this.ecuacionesGeneradas = [];
        this.historialJugador = [];
        this.usarDiccionarioManual = false; // Flag para saber si usar fallback
        
        console.log('🎮 Motor Ontole inicializado');
    }

    // Elegir operación basada en pesos
    elegirOperacionPonderada(nivel) {
        const reglas = GENERATION_RULES[`nivel${nivel}`];
        if (!reglas) {
            console.error(`❌ No hay reglas para nivel ${nivel}`);
            return null;
        }
        
        if (!reglas.operaciones || !Array.isArray(reglas.operaciones) || reglas.operaciones.length === 0) {
            console.error(`❌ No hay operaciones definidas para nivel ${nivel}`);
            return null;
        }
        
        const totalPeso = reglas.operaciones.reduce((sum, op) => sum + op.peso, 0);
        let random = Math.random() * totalPeso;
        
        for (const operacion of reglas.operaciones) {
            random -= operacion.peso;
            if (random <= 0) {
                console.log(`🎯 Operación seleccionada: ${operacion.tipo}`);
                return operacion;
            }
        }
        
        console.log(`🎯 Operación por defecto: ${reglas.operaciones[0].tipo}`);
        return reglas.operaciones[0];
    }

    // Elegir palabra semilla aleatoria
    elegirPalabraSemilla(nivel) {
        const reglas = GENERATION_RULES[`nivel${nivel}`];
        if (!reglas) {
            console.error(`❌ No hay reglas para nivel ${nivel}`);
            return null;
        }
        
        const palabras = reglas.palabrasSemilla;
        if (!palabras || !Array.isArray(palabras) || palabras.length === 0) {
            console.error(`❌ No hay palabras semilla para nivel ${nivel}`);
            return null;
        }
        
        const palabraSeleccionada = palabras[Math.floor(Math.random() * palabras.length)];
        console.log(`📝 Palabra seleccionada: ${palabraSeleccionada}`);
        return palabraSeleccionada;
    }

    // Generar ecuación completa
    async generarEcuacion(nivel = 1, intentos = 0) {
        // Evitar loop infinito
        if (intentos >= 5) {
            console.error('❌ No se pudo generar ecuación después de 5 intentos');
            // Fallback: usar diccionario manual si existe
            if (window.OntoleDictionary && typeof window.OntoleDictionary.getRandomEquation === 'function') {
                console.log('🔄 Usando diccionario manual como fallback');
                const ecuacionManual = window.OntoleDictionary.getRandomEquation(nivel);
                if (ecuacionManual) {
                    return this.convertirEcuacionManual(ecuacionManual);
                }
            }
            throw new Error('No se pudo generar ecuación después de 5 intentos');
        }
        
        const operacion = this.elegirOperacionPonderada(nivel);
        const palabraBase = this.elegirPalabraSemilla(nivel);
        
        // Validar que tengamos operación y palabra base
        if (!operacion || !palabraBase) {
            console.error('❌ Error: operación o palabraBase es null', { operacion, palabraBase });
            
            // Intentar con diccionario manual inmediatamente
            if (window.OntoleDictionary && typeof window.OntoleDictionary.getRandomEquation === 'function') {
                console.log('🔄 Usando diccionario manual');
                const ecuacionManual = window.OntoleDictionary.getRandomEquation(nivel);
                if (ecuacionManual) {
                    return this.convertirEcuacionManual(ecuacionManual);
                }
            }
            
            throw new Error('No se pudo generar ecuación: faltan datos básicos');
        }
        
        console.log(`🎲 Generando ecuación (intento ${intentos + 1}): ${palabraBase} con operación ${operacion.tipo}`);
        
        // Obtener palabra resultado según el tipo de operación
        let resultado = await this.calcularResultado(palabraBase, operacion);
        
        if (!resultado || !resultado.palabra) {
            console.warn('⚠️ No se pudo generar ecuación, reintentando...');
            return await this.generarEcuacion(nivel, intentos + 1); // Reintentar con contador
        }
        
        // Buscar alternativas (coherentes y poéticas)
        const alternativas = await this.buscarAlternativas(palabraBase, resultado.palabra, operacion);
        
        // Formatear la ecuación
        const ecuacionFormateada = {
            id: `${Date.now()}_${Math.random()}`,
            operacion: this.formatearOperacion(palabraBase, operacion),
            palabraBase,
            operacionTipo: operacion.tipo,
            nivel,
            respuestas: {
                exactas: [resultado.palabra, ...(resultado.sinonimos || [])].filter(Boolean),
                coherentes: (alternativas.coherentes || []).filter(Boolean),
                poeticas: (alternativas.poeticas || []).filter(Boolean)
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                relacionConceptNet: operacion.relacionConceptNet
            }
        };
        
        this.ecuacionesGeneradas.push(ecuacionFormateada);
        return ecuacionFormateada;
    }

    // Calcular resultado según tipo de operación
    async calcularResultado(palabraBase, operacion) {
        try {
            let palabraResultado = null;
            let sinonimos = [];
            
            switch (operacion.tipo) {
                case 'antonym':
                    const antonimos = await this.conceptNet.getAntonimos(palabraBase);
                    if (antonimos && antonimos.length > 0) {
                        palabraResultado = antonimos[0];
                        sinonimos = antonimos.slice(1, 4).filter(Boolean);
                    }
                    break;
                    
                case 'remove_property':
                case 'generalize':
                    // Buscar conceptos más generales (IsA)
                    const relaciones = await this.conceptNet.getRelations(palabraBase, 'IsA');
                    if (relaciones && relaciones.length > 0) {
                        palabraResultado = relaciones[0].palabra;
                        sinonimos = relaciones.slice(1, 4).map(r => r.palabra).filter(Boolean);
                    }
                    break;
                    
                case 'specialize':
                    // Buscar conceptos más específicos (HasA)
                    const especificos = await this.conceptNet.getRelations(palabraBase, 'HasA');
                    if (especificos && especificos.length > 0) {
                        palabraResultado = especificos[0].palabra;
                        sinonimos = especificos.slice(1, 4).map(r => r.palabra).filter(Boolean);
                    }
                    break;
                    
                case 'similar':
                    const similares = await this.conceptNet.getPalabrasSimilares(palabraBase);
                    if (similares && similares.length > 0) {
                        palabraResultado = similares[0];
                        sinonimos = similares.slice(1, 4).filter(Boolean);
                    }
                    break;
                    
                default:
                    // Fallback: buscar palabras relacionadas generales
                    const relacionadas = await this.conceptNet.getRelations(palabraBase);
                    if (relacionadas && relacionadas.length > 0) {
                        palabraResultado = relacionadas[0].palabra;
                        sinonimos = relacionadas.slice(1, 4).map(r => r.palabra).filter(Boolean);
                    }
            }
            
            // Si no encontró nada, retornar null
            if (!palabraResultado) {
                return null;
            }
            
            return {
                palabra: palabraResultado,
                sinonimos: sinonimos.filter(s => s && s !== palabraResultado)
            };
        } catch (error) {
            console.error('Error calculando resultado:', error);
            return null;
        }
    }

    // Buscar alternativas coherentes y poéticas
    async buscarAlternativas(palabraBase, palabraResultado, operacion) {
        try {
            const relacionadas = await this.conceptNet.getRelations(palabraBase);
            
            if (!relacionadas || relacionadas.length === 0) {
                return { coherentes: [], poeticas: [] };
            }
            
            // Filtrar por similitud con el resultado
            const alternativasConScore = await Promise.all(
                relacionadas.slice(0, 10).map(async (rel) => {
                    try {
                        const similitud = await this.conceptNet.getSimilarity(rel.palabra, palabraResultado);
                        return {
                            palabra: rel.palabra,
                            score: similitud || 0,
                            peso: rel.peso || 0
                        };
                    } catch (e) {
                        return {
                            palabra: rel.palabra,
                            score: 0,
                            peso: rel.peso || 0
                        };
                    }
                })
            );
            
            // Ordenar por score
            alternativasConScore.sort((a, b) => b.score - a.score);
            
            // Clasificar en coherentes (0.4-0.7) y poéticas (0.2-0.4)
            const coherentes = alternativasConScore
                .filter(a => a.score > 0.4 && a.score < 0.8)
                .slice(0, 3)
                .map(a => a.palabra)
                .filter(Boolean);
                
            const poeticas = alternativasConScore
                .filter(a => a.score > 0.2 && a.score <= 0.4)
                .slice(0, 3)
                .map(a => a.palabra)
                .filter(Boolean);
            
            return { 
                coherentes: coherentes.length > 0 ? coherentes : [], 
                poeticas: poeticas.length > 0 ? poeticas : [] 
            };
        } catch (error) {
            console.error('Error buscando alternativas:', error);
            return { coherentes: [], poeticas: [] };
        }
    }

    // Formatear operación para mostrar
    formatearOperacion(palabraBase, operacion) {
        const formatosPorTipo = {
            'antonym': `${palabraBase} - Opuesto`,
            'remove_property': `${palabraBase} - Específico`,
            'generalize': `${palabraBase} - Particular`,
            'specialize': `${palabraBase} + Específico`,
            'similar': `${palabraBase} → Similar`,
            'add_property': `${palabraBase} + Propiedad`,
            'combine': `${palabraBase} + Concepto`,
            'metaphor': `${palabraBase} ≈ Símbolo`
        };
        
        return formatosPorTipo[operacion.tipo] || `${palabraBase} (${operacion.nombre})`;
    }

    // Validar respuesta del usuario
    async validarRespuesta(ecuacion, respuestaUsuario) {
        try {
            const respuestaNormalizada = respuestaUsuario.toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            // Asegurar que las respuestas existan como arrays
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
                        explicacion: `¡Excelente! "${exacta}" es la respuesta más directa para esta ecuación.`,
                        palabraCorrecta: exacta
                    };
                }
            }
            
            // Verificar respuestas coherentes
            for (const coherente of coherentes) {
                if (!coherente) continue;
                const coherenteNormalizada = coherente.toLowerCase().trim()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                if (coherenteNormalizada === respuestaNormalizada) {
                    return {
                        correcto: true,
                        coherencia: 'coherente',
                        puntos: 2,
                        explicacion: `¡Muy bien! "${coherente}" es una respuesta válida y coherente.`,
                        palabraCorrecta: coherente
                    };
                }
            }
            
            // Verificar respuestas poéticas
            for (const poetica of poeticas) {
                if (!poetica) continue;
                const poeticaNormalizada = poetica.toLowerCase().trim()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                if (poeticaNormalizada === respuestaNormalizada) {
                    return {
                        correcto: true,
                        coherencia: 'poetica',
                        puntos: 1,
                        explicacion: `¡Interesante! "${poetica}" es una respuesta creativa y poética.`,
                        palabraCorrecta: poetica
                    };
                }
            }
            
            // Si no coincide exactamente, calcular similitud semántica
            if (exactas.length > 0 && exactas[0]) {
                try {
                    const similitudConExacta = await this.conceptNet.getSimilarity(
                        respuestaNormalizada,
                        exactas[0]
                    );
                    
                    if (similitudConExacta > 0.7) {
                        return {
                            correcto: true,
                            coherencia: 'coherente',
                            puntos: 2,
                            explicacion: `"${respuestaUsuario}" está muy relacionado con la respuesta esperada.`,
                            palabraCorrecta: respuestaUsuario
                        };
                    }
                    
                    if (similitudConExacta > 0.4) {
                        return {
                            correcto: true,
                            coherencia: 'poetica',
                            puntos: 1,
                            explicacion: `"${respuestaUsuario}" tiene cierta relación semántica. ¡Respuesta creativa!`,
                            palabraCorrecta: respuestaUsuario
                        };
                    }
                } catch (e) {
                    console.error('Error calculando similitud:', e);
                }
            }
            
            // No es correcta
            return {
                correcto: false,
                alternativas: [
                    ...exactas.slice(0, 2),
                    ...coherentes.slice(0, 2)
                ].filter(Boolean),
                mensaje: 'No encontramos una relación semántica clara. Intenta con estas alternativas:'
            };
        } catch (error) {
            console.error('Error validando respuesta:', error);
            return {
                correcto: false,
                mensaje: 'Error al validar la respuesta. Intenta de nuevo.',
                alternativas: []
            };
        }
    }

    // Obtener estadísticas
    getEstadisticas() {
        return {
            ecuacionesGeneradas: this.ecuacionesGeneradas.length,
            cacheSize: this.conceptNet.cache.size,
            historialJugador: this.historialJugador.length
        };
    }
    
    // Convertir ecuación del diccionario manual al formato del motor
    convertirEcuacionManual(ecuacionManual) {
        if (!ecuacionManual || !ecuacionManual.resultados) {
            return null;
        }
        
        const exactas = ecuacionManual.resultados
            .filter(r => r.coherencia === 'exacta')
            .map(r => r.palabra);
            
        const coherentes = ecuacionManual.resultados
            .filter(r => r.coherencia === 'coherente')
            .map(r => r.palabra);
            
        const poeticas = ecuacionManual.resultados
            .filter(r => r.coherencia === 'poetic' || r.coherencia === 'poetica')
            .map(r => r.palabra);
        
        return {
            id: `manual_${Date.now()}`,
            operacion: ecuacionManual.operacion,
            palabraBase: ecuacionManual.palabra || ecuacionManual.operacion.split(' ')[0],
            operacionTipo: 'manual',
            nivel: 1,
            respuestas: {
                exactas: exactas.length > 0 ? exactas : [ecuacionManual.resultados[0]?.palabra],
                coherentes: coherentes,
                poeticas: poeticas
            },
            metadata: {
                generadaEn: new Date().toISOString(),
                fuente: 'diccionario_manual'
            }
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.OntoleEngine = OntoleEngine;
    window.ConceptNetAPI = ConceptNetAPI;
    window.GENERATION_RULES = GENERATION_RULES;
}
