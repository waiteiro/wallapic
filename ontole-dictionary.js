/* ============================================
   ONTOLE - Diccionario de Palabras y Atributos
   Base de datos semántica modular
   ============================================ */

// Familias de atributos según el documento
const ATTRIBUTE_FAMILIES = {
    GENERO: ['Masculino', 'Femenino', 'Neutro', 'Ambiguo'],
    EDAD: ['Infantil', 'Joven', 'Adulto', 'Anciano', 'Atemporal'],
    VINCULO: ['Consanguineo', 'Legal', 'Afectivo', 'Profesional', 'Social'],
    PODER: ['Autoridad', 'Subordinado', 'Autonomo', 'Colectivo', 'Difuso'],
    ACCION: ['Cuidado', 'Creacion', 'Destruccion', 'Movimiento', 'Ensenanza', 'Proteccion'],
    ESTADO: ['Vivo', 'Abstracto', 'Temporal', 'Permanente', 'Potencial'],
    ESCALA: ['Individual', 'Colectivo', 'Universal', 'Local'],
    DOMINIO: ['Natural', 'Social', 'Espiritual', 'Tecnico', 'Artistico', 'Politico'],
    CARGA: ['Positivo', 'Negativo', 'Neutro', 'Ambivalente', 'Sagrado'],
    FORMA: ['Solido', 'Liquido', 'Gaseoso', 'Inmaterial', 'Simbolico']
};

// Diccionario de palabras (primeras 50 palabras para MVP)
const ONTOLE_DICTIONARY = {
    // FAMILIA: Vínculos familiares
    'madre': {
        palabra: 'Madre',
        nucleo: ['Vinculo', 'Cuidado', 'Progenitor'],
        operables: ['Femenino', 'Consanguineo', 'Adulto', 'Afectivo'],
        implicados: ['Humano', 'Vivo', 'Individual'],
        familia: 'Vinculos familiares',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Madre - Femenino',
                resultados: [
                    { palabra: 'Padre', coherencia: 'exacta', puntos: 3, explicacion: 'Eliminaste el rasgo Femenino, manteniendo todos los demás atributos de la relación parental.' },
                    { palabra: 'Progenitor', coherencia: 'coherente', puntos: 2, explicacion: 'Generalizaste al eliminar especificidad de género.' },
                    { palabra: 'Tutor', coherencia: 'coherente', puntos: 2, explicacion: 'Mantuviste el cuidado pero perdiste el vínculo consanguíneo.' }
                ]
            },
            {
                operacion: 'Madre - Consanguineo',
                resultados: [
                    { palabra: 'Tutora', coherencia: 'exacta', puntos: 3, explicacion: 'Mantuviste el cuidado y el género, eliminando solo el vínculo de sangre.' },
                    { palabra: 'Madrina', coherencia: 'coherente', puntos: 2, explicacion: 'Vínculo simbólico que mantiene el rol de cuidado.' },
                    { palabra: 'Cuidadora', coherencia: 'coherente', puntos: 2, explicacion: 'Enfocaste solo en la función de cuidado.' }
                ]
            }
        ]
    },
    
    'padre': {
        palabra: 'Padre',
        nucleo: ['Vinculo', 'Cuidado', 'Progenitor'],
        operables: ['Masculino', 'Consanguineo', 'Adulto', 'Afectivo'],
        implicados: ['Humano', 'Vivo', 'Individual'],
        familia: 'Vinculos familiares',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Padre - Masculino',
                resultados: [
                    { palabra: 'Madre', coherencia: 'exacta', puntos: 3, explicacion: 'Cambio directo de género manteniendo todos los demás rasgos parentales.' },
                    { palabra: 'Progenitor', coherencia: 'coherente', puntos: 2, explicacion: 'Término neutral que engloba ambos géneros.' }
                ]
            },
            {
                operacion: 'Padre - Consanguineo',
                resultados: [
                    { palabra: 'Tutor', coherencia: 'exacta', puntos: 3, explicacion: 'Relación legal de cuidado sin vínculo de sangre.' },
                    { palabra: 'Padrino', coherencia: 'coherente', puntos: 2, explicacion: 'Vínculo simbólico de protección y cuidado.' }
                ]
            }
        ]
    },

    // FAMILIA: Liderazgo y poder
    'rey': {
        palabra: 'Rey',
        nucleo: ['Autoridad', 'Individual'],
        operables: ['Masculino', 'Nobleza', 'Permanente', 'Politico'],
        implicados: ['Humano', 'Vivo', 'Poder'],
        familia: 'Liderazgo',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Rey - Masculino',
                resultados: [
                    { palabra: 'Reina', coherencia: 'exacta', puntos: 3, explicacion: 'Cambio directo de género en la misma posición de poder monárquico.' },
                    { palabra: 'Monarca', coherencia: 'coherente', puntos: 2, explicacion: 'Término neutral para el soberano.' }
                ]
            },
            {
                operacion: 'Rey - Nobleza - Permanente',
                resultados: [
                    { palabra: 'Presidente', coherencia: 'exacta', puntos: 3, explicacion: 'Líder político electo sin nobleza hereditaria.' },
                    { palabra: 'Gobernante', coherencia: 'coherente', puntos: 2, explicacion: 'Término genérico para quien ejerce autoridad política.' }
                ]
            }
        ]
    },

    'reina': {
        palabra: 'Reina',
        nucleo: ['Autoridad', 'Individual'],
        operables: ['Femenino', 'Nobleza', 'Permanente', 'Politico'],
        implicados: ['Humano', 'Vivo', 'Poder'],
        familia: 'Liderazgo',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Reina - Femenino',
                resultados: [
                    { palabra: 'Rey', coherencia: 'exacta', puntos: 3, explicacion: 'Cambio directo al equivalente masculino en la monarquía.' },
                    { palabra: 'Monarca', coherencia: 'coherente', puntos: 2, explicacion: 'Soberano sin especificación de género.' },
                    { palabra: 'Regente', coherencia: 'coherente', puntos: 2, explicacion: 'Quien ejerce el poder real temporalmente.' }
                ]
            }
        ]
    },

    'presidente': {
        palabra: 'Presidente',
        nucleo: ['Autoridad', 'Individual'],
        operables: ['Masculino', 'Electo', 'Temporal', 'Politico'],
        implicados: ['Humano', 'Vivo', 'Poder'],
        familia: 'Liderazgo',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Presidente - Masculino',
                resultados: [
                    { palabra: 'Presidenta', coherencia: 'exacta', puntos: 3, explicacion: 'Versión femenina del mismo cargo.' }
                ]
            },
            {
                operacion: 'Presidente + Nobleza + Permanente',
                resultados: [
                    { palabra: 'Rey', coherencia: 'exacta', puntos: 3, explicacion: 'De líder electo temporal a monarca hereditario permanente.' },
                    { palabra: 'Emperador', coherencia: 'coherente', puntos: 2, explicacion: 'Autoridad monárquica de mayor escala.' }
                ]
            }
        ]
    },

    // FAMILIA: Profesiones y oficios
    'medico': {
        palabra: 'Médico',
        nucleo: ['Cuidado', 'Profesional'],
        operables: ['Cuerpo', 'Ciencia', 'Adulto'],
        implicados: ['Humano', 'Ensenanza'],
        familia: 'Profesiones',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Medico - Cuerpo',
                resultados: [
                    { palabra: 'Terapeuta', coherencia: 'coherente', puntos: 2, explicacion: 'Cuidado profesional no limitado al cuerpo físico.' },
                    { palabra: 'Consejero', coherencia: 'poetic', puntos: 1, explicacion: 'Cuidado orientado al bienestar sin enfoque médico.' }
                ]
            },
            {
                operacion: 'Medico - Cuerpo + Mente',
                resultados: [
                    { palabra: 'Psicologo', coherencia: 'exacta', puntos: 3, explicacion: 'Profesional de la salud enfocado en la mente en lugar del cuerpo.' },
                    { palabra: 'Psiquiatra', coherencia: 'coherente', puntos: 2, explicacion: 'Médico especializado en salud mental.' }
                ]
            }
        ]
    },

    'maestro': {
        palabra: 'Maestro',
        nucleo: ['Ensenanza', 'Profesional'],
        operables: ['Conocimiento', 'Adulto', 'Autoridad'],
        implicados: ['Humano', 'Cuidado'],
        familia: 'Profesiones',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Maestro - Ensenanza + Cuidado',
                resultados: [
                    { palabra: 'Tutor', coherencia: 'exacta', puntos: 3, explicacion: 'Enfoque en cuidado y guía más que en enseñanza formal.' },
                    { palabra: 'Mentor', coherencia: 'coherente', puntos: 2, explicacion: 'Guía que combina enseñanza y cuidado personal.' }
                ]
            }
        ]
    },

    'artista': {
        palabra: 'Artista',
        nucleo: ['Creacion', 'Artistico'],
        operables: ['Individual', 'Expresion', 'Obra'],
        implicados: ['Humano', 'Sensibilidad'],
        familia: 'Profesiones',
        nivel: 1,
        ecuaciones: [
            {
                operacion: 'Artista + Sonido',
                resultados: [
                    { palabra: 'Musico', coherencia: 'exacta', puntos: 3, explicacion: 'Artista especializado en el medio sonoro.' },
                    { palabra: 'Cantante', coherencia: 'coherente', puntos: 2, explicacion: 'Artista del sonido vocal específicamente.' }
                ]
            },
            {
                operacion: 'Artista + Visual',
                resultados: [
                    { palabra: 'Pintor', coherencia: 'exacta', puntos: 3, explicacion: 'Artista del medio visual pictórico.' },
                    { palabra: 'Escultor', coherencia: 'coherente', puntos: 2, explicacion: 'Artista visual que trabaja en tres dimensiones.' }
                ]
            }
        ]
    },

    'guerrero': {
        palabra: 'Guerrero',
        nucleo: ['Combate', 'Proteccion'],
        operables: ['Violencia', 'Fuerza', 'Armas', 'Valentia'],
        implicados: ['Humano', 'Adulto'],
        familia: 'Oficios',
        nivel: 2,
        ecuaciones: [
            {
                operacion: 'Guerrero - Violencia + Conocimiento',
                resultados: [
                    { palabra: 'Estratega', coherencia: 'exacta', puntos: 3, explicacion: 'Del combate físico a la planificación táctica.' },
                    { palabra: 'General', coherencia: 'coherente', puntos: 2, explicacion: 'Líder militar que combina ambos aspectos.' }
                ]
            }
        ]
    },

    // FAMILIA: Conceptos abstractos
    'libertad': {
        palabra: 'Libertad',
        nucleo: ['Abstracto', 'Positivo'],
        operables: ['Autonomia', 'Individual', 'Movimiento'],
        implicados: ['Inmaterial', 'Universal'],
        familia: 'Conceptos',
        nivel: 2,
        ecuaciones: [
            {
                operacion: 'Libertad - Individual + Colectivo',
                resultados: [
                    { palabra: 'Democracia', coherencia: 'exacta', puntos: 3, explicacion: 'Libertad ejercida colectivamente como sistema político.' },
                    { palabra: 'Comunidad', coherencia: 'coherente', puntos: 2, explicacion: 'Colectivo que comparte autonomía.' }
                ]
            }
        ]
    },

    'silencio': {
        palabra: 'Silencio',
        nucleo: ['Abstracto', 'Ausencia'],
        operables: ['Sonido', 'Vacio', 'Pausa'],
        implicados: ['Inmaterial', 'Temporal'],
        familia: 'Conceptos',
        nivel: 2,
        ecuaciones: [
            {
                operacion: 'Silencio + Tension',
                resultados: [
                    { palabra: 'Pausa', coherencia: 'exacta', puntos: 3, explicacion: 'Silencio con carga de anticipación o interrupción.' },
                    { palabra: 'Espera', coherencia: 'coherente', puntos: 2, explicacion: 'Silencio activo con expectativa.' }
                ]
            }
        ]
    },

    'tiempo': {
        palabra: 'Tiempo',
        nucleo: ['Abstracto', 'Universal'],
        operables: ['Flujo', 'Medible', 'Irreversible'],
        implicados: ['Inmaterial', 'Infinito'],
        familia: 'Conceptos',
        nivel: 2,
        ecuaciones: [
            {
                operacion: 'Tiempo - Flujo',
                resultados: [
                    { palabra: 'Instante', coherencia: 'exacta', puntos: 3, explicacion: 'Tiempo detenido, un punto sin flujo.' },
                    { palabra: 'Momento', coherencia: 'coherente', puntos: 2, explicacion: 'Fragmento temporal específico.' }
                ]
            }
        ]
    }
};

// Función para obtener una palabra del diccionario
function getWord(palabra) {
    const key = palabra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return ONTOLE_DICTIONARY[key] || null;
}

// Función para obtener todas las palabras de un nivel
function getWordsByLevel(nivel) {
    return Object.values(ONTOLE_DICTIONARY).filter(word => word.nivel === nivel);
}

// Función para obtener palabras de una familia
function getWordsByFamily(familia) {
    return Object.values(ONTOLE_DICTIONARY).filter(word => word.familia === familia);
}

// Función para generar una ecuación aleatoria
function getRandomEquation(nivel = 1) {
    const words = getWordsByLevel(nivel);
    if (words.length === 0) return null;
    
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const equations = randomWord.ecuaciones;
    if (!equations || equations.length === 0) return null;
    
    const randomEquation = equations[Math.floor(Math.random() * equations.length)];
    
    return {
        palabra: randomWord.palabra,
        operacion: randomEquation.operacion,
        resultados: randomEquation.resultados
    };
}

// Función para validar una respuesta
function validateAnswer(operacion, respuestaUsuario) {
    // Normalizar respuesta del usuario
    const respuestaNormalizada = respuestaUsuario.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Buscar la palabra base en el diccionario
    for (const [key, wordData] of Object.entries(ONTOLE_DICTIONARY)) {
        const ecuaciones = wordData.ecuaciones;
        if (!ecuaciones) continue;
        
        for (const eq of ecuaciones) {
            if (eq.operacion === operacion) {
                // Buscar coincidencia en resultados
                for (const resultado of eq.resultados) {
                    const palabraResultado = resultado.palabra.toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    
                    if (palabraResultado === respuestaNormalizada) {
                        return {
                            correcto: true,
                            coherencia: resultado.coherencia,
                            puntos: resultado.puntos,
                            explicacion: resultado.explicacion,
                            palabraCorrecta: resultado.palabra
                        };
                    }
                }
                
                // Si no encontró coincidencia exacta, retornar alternativas
                return {
                    correcto: false,
                    alternativas: eq.resultados.map(r => r.palabra),
                    mensaje: 'Respuesta no encontrada. Intenta con alguna de estas alternativas.'
                };
            }
        }
    }
    
    return {
        correcto: false,
        mensaje: 'No se encontró la ecuación en el diccionario.'
    };
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.OntoleDictionary = {
        ATTRIBUTE_FAMILIES,
        ONTOLE_DICTIONARY,
        getWord,
        getWordsByLevel,
        getWordsByFamily,
        getRandomEquation,
        validateAnswer
    };
}
