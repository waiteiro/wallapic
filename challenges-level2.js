// ============================================
// SISTEMA DE RETOS NIVEL 2 - FRASES Y ORACIONES
// Activo desde día 7 en adelante (sin límite superior)
// ============================================

// Banco de retos nivel 2: frases, oraciones compuestas, expresiones
const CHALLENGES_LEVEL_2 = [
    {
        id: 1,
        phrase: "luz del amanecer",
        difficulty: "easy",
        hint: "Describe un momento temprano del día",
        type: "noun_phrase"
    },
    {
        id: 2,
        phrase: "susurro del viento",
        difficulty: "easy",
        hint: "Sonido suave de la naturaleza",
        type: "noun_phrase"
    },
    {
        id: 3,
        phrase: "corazón inquieto",
        difficulty: "easy",
        hint: "Estado emocional agitado",
        type: "noun_adjective"
    },
    {
        id: 4,
        phrase: "camino sin retorno",
        difficulty: "medium",
        hint: "Decisión irreversible",
        type: "noun_phrase"
    },
    {
        id: 5,
        phrase: "tiempo que se escapa",
        difficulty: "medium",
        hint: "La fugacidad del presente",
        type: "sentence"
    },
    {
        id: 6,
        phrase: "silencio ensordecedor",
        difficulty: "medium",
        hint: "Paradoja del ruido ausente",
        type: "noun_adjective"
    },
    {
        id: 7,
        phrase: "memoria fragmentada",
        difficulty: "medium",
        hint: "Recuerdos incompletos",
        type: "noun_adjective"
    },
    {
        id: 8,
        phrase: "palabras que arden",
        difficulty: "medium",
        hint: "Expresión intensa",
        type: "sentence"
    },
    {
        id: 9,
        phrase: "sombra de una duda",
        difficulty: "medium",
        hint: "Incertidumbre persistente",
        type: "noun_phrase"
    },
    {
        id: 10,
        phrase: "mirada perdida",
        difficulty: "easy",
        hint: "Expresión distante",
        type: "noun_adjective"
    },
    {
        id: 11,
        phrase: "voz que tiembla",
        difficulty: "medium",
        hint: "Emoción en el habla",
        type: "sentence"
    },
    {
        id: 12,
        phrase: "tarde que no vuelve",
        difficulty: "medium",
        hint: "Nostalgia por el pasado",
        type: "sentence"
    },
    {
        id: 13,
        phrase: "ritmo del corazón",
        difficulty: "easy",
        hint: "Latido vital",
        type: "noun_phrase"
    },
    {
        id: 14,
        phrase: "horizonte lejano",
        difficulty: "easy",
        hint: "Meta distante",
        type: "noun_adjective"
    },
    {
        id: 15,
        phrase: "grito en el vacío",
        difficulty: "medium",
        hint: "Expresión sin respuesta",
        type: "noun_phrase"
    },
    {
        id: 16,
        phrase: "espejo roto",
        difficulty: "easy",
        hint: "Imagen fragmentada",
        type: "noun_adjective"
    },
    {
        id: 17,
        phrase: "lluvia persistente",
        difficulty: "easy",
        hint: "Clima constante",
        type: "noun_adjective"
    },
    {
        id: 18,
        phrase: "verdad escondida",
        difficulty: "medium",
        hint: "Secreto oculto",
        type: "noun_adjective"
    },
    {
        id: 19,
        phrase: "promesa olvidada",
        difficulty: "medium",
        hint: "Compromiso no cumplido",
        type: "noun_adjective"
    },
    {
        id: 20,
        phrase: "noche sin estrellas",
        difficulty: "medium",
        hint: "Oscuridad completa",
        type: "noun_phrase"
    },
    {
        id: 21,
        phrase: "manos que escriben",
        difficulty: "medium",
        hint: "Acto de creación",
        type: "sentence"
    },
    {
        id: 22,
        phrase: "ciudad dormida",
        difficulty: "easy",
        hint: "Calma urbana nocturna",
        type: "noun_adjective"
    },
    {
        id: 23,
        phrase: "sueño interrumpido",
        difficulty: "easy",
        hint: "Descanso incompleto",
        type: "noun_adjective"
    },
    {
        id: 24,
        phrase: "mundo paralelo",
        difficulty: "medium",
        hint: "Realidad alternativa",
        type: "noun_adjective"
    },
    {
        id: 25,
        phrase: "historia inacabada",
        difficulty: "medium",
        hint: "Narrativa sin final",
        type: "noun_adjective"
    },
    {
        id: 26,
        phrase: "fuego que consume",
        difficulty: "medium",
        hint: "Destrucción ardiente",
        type: "sentence"
    },
    {
        id: 27,
        phrase: "alma inquieta",
        difficulty: "easy",
        hint: "Espíritu agitado",
        type: "noun_adjective"
    },
    {
        id: 28,
        phrase: "destino incierto",
        difficulty: "medium",
        hint: "Futuro desconocido",
        type: "noun_adjective"
    },
    {
        id: 29,
        phrase: "laberinto sin salida",
        difficulty: "hard",
        hint: "Situación sin solución",
        type: "noun_phrase"
    },
    {
        id: 30,
        phrase: "río que fluye",
        difficulty: "easy",
        hint: "Corriente constante",
        type: "sentence"
    },
    {
        id: 31,
        phrase: "peso del silencio",
        difficulty: "medium",
        hint: "Presencia de lo no dicho",
        type: "noun_phrase"
    },
    {
        id: 32,
        phrase: "boca que calla",
        difficulty: "medium",
        hint: "Palabras retenidas",
        type: "sentence"
    },
    {
        id: 33,
        phrase: "piel que recuerda",
        difficulty: "medium",
        hint: "Memoria corporal",
        type: "sentence"
    },
    {
        id: 34,
        phrase: "puerta entreabierta",
        difficulty: "easy",
        hint: "Invitación ambigua",
        type: "noun_adjective"
    },
    {
        id: 35,
        phrase: "sombra que avanza",
        difficulty: "medium",
        hint: "Amenaza progresiva",
        type: "sentence"
    },
    {
        id: 36,
        phrase: "eco de una risa",
        difficulty: "medium",
        hint: "Alegría que persiste",
        type: "noun_phrase"
    },
    {
        id: 37,
        phrase: "mañana sin prisa",
        difficulty: "easy",
        hint: "Tiempo pausado",
        type: "noun_phrase"
    },
    {
        id: 38,
        phrase: "último suspiro",
        difficulty: "medium",
        hint: "Momento final",
        type: "noun_adjective"
    },
    {
        id: 39,
        phrase: "manos vacías",
        difficulty: "easy",
        hint: "Carencia física",
        type: "noun_adjective"
    },
    {
        id: 40,
        phrase: "verdad que duele",
        difficulty: "medium",
        hint: "Realidad incómoda",
        type: "sentence"
    },
    {
        id: 41,
        phrase: "calor de hogar",
        difficulty: "easy",
        hint: "Confort familiar",
        type: "noun_phrase"
    },
    {
        id: 42,
        phrase: "hielo en las venas",
        difficulty: "medium",
        hint: "Frialdad extrema",
        type: "noun_phrase"
    },
    {
        id: 43,
        phrase: "precio del olvido",
        difficulty: "medium",
        hint: "Costo de no recordar",
        type: "noun_phrase"
    },
    {
        id: 44,
        phrase: "sed que consume",
        difficulty: "medium",
        hint: "Deseo intenso",
        type: "sentence"
    },
    {
        id: 45,
        phrase: "brisa que acaricia",
        difficulty: "easy",
        hint: "Viento suave",
        type: "sentence"
    },
    {
        id: 46,
        phrase: "rostro en el espejo",
        difficulty: "medium",
        hint: "Confrontación con uno mismo",
        type: "noun_phrase"
    },
    {
        id: 47,
        phrase: "mar de dudas",
        difficulty: "medium",
        hint: "Incertidumbre abundante",
        type: "noun_phrase"
    },
    {
        id: 48,
        phrase: "luz que ciega",
        difficulty: "medium",
        hint: "Claridad excesiva",
        type: "sentence"
    },
    {
        id: 49,
        phrase: "camino de cenizas",
        difficulty: "hard",
        hint: "Recorrido de destrucción",
        type: "noun_phrase"
    },
    {
        id: 50,
        phrase: "precio de la libertad",
        difficulty: "hard",
        hint: "Costo de ser libre",
        type: "noun_phrase"
    },
    {
        id: 51,
        phrase: "salto al vacío",
        difficulty: "medium",
        hint: "Decisión audaz",
        type: "noun_phrase"
    },
    {
        id: 52,
        phrase: "fuego en los ojos",
        difficulty: "easy",
        hint: "Determinación visible",
        type: "noun_phrase"
    },
    {
        id: 53,
        phrase: "viento a favor",
        difficulty: "easy",
        hint: "Circunstancias favorables",
        type: "noun_phrase"
    },
    {
        id: 54,
        phrase: "cima de la montaña",
        difficulty: "easy",
        hint: "Logro alcanzado",
        type: "noun_phrase"
    },
    {
        id: 55,
        phrase: "alas que crecen",
        difficulty: "medium",
        hint: "Libertad que se desarrolla",
        type: "sentence"
    },
    {
        id: 56,
        phrase: "victoria inesperada",
        difficulty: "easy",
        hint: "Triunfo sorpresivo",
        type: "noun_adjective"
    },
    {
        id: 57,
        phrase: "mañana prometedor",
        difficulty: "easy",
        hint: "Futuro brillante",
        type: "noun_adjective"
    },
    {
        id: 58,
        phrase: "fuerza interior",
        difficulty: "easy",
        hint: "Poder personal",
        type: "noun_adjective"
    },
    {
        id: 59,
        phrase: "luz que guía",
        difficulty: "easy",
        hint: "Dirección clara",
        type: "sentence"
    },
    {
        id: 60,
        phrase: "impulso imparable",
        difficulty: "medium",
        hint: "Energía constante",
        type: "noun_adjective"
    },
    {
        id: 61,
        phrase: "horizonte abierto",
        difficulty: "easy",
        hint: "Posibilidades infinitas",
        type: "noun_adjective"
    },
    {
        id: 62,
        phrase: "grito de victoria",
        difficulty: "easy",
        hint: "Celebración sonora",
        type: "noun_phrase"
    },
    {
        id: 63,
        phrase: "amanecer radiante",
        difficulty: "easy",
        hint: "Inicio espléndido",
        type: "noun_adjective"
    },
    {
        id: 64,
        phrase: "paso firme",
        difficulty: "easy",
        hint: "Avance seguro",
        type: "noun_adjective"
    },
    {
        id: 65,
        phrase: "risa contagiosa",
        difficulty: "easy",
        hint: "Alegría que se comparte",
        type: "noun_adjective"
    },
    {
        id: 66,
        phrase: "energía desbordante",
        difficulty: "easy",
        hint: "Vitalidad excesiva",
        type: "noun_adjective"
    },
    {
        id: 67,
        phrase: "visión clara",
        difficulty: "easy",
        hint: "Propósito definido",
        type: "noun_adjective"
    },
    {
        id: 68,
        phrase: "poder de decisión",
        difficulty: "medium",
        hint: "Control sobre el destino",
        type: "noun_phrase"
    },
    {
        id: 69,
        phrase: "mundo por descubrir",
        difficulty: "medium",
        hint: "Aventuras pendientes",
        type: "sentence"
    },
    {
        id: 70,
        phrase: "chispa de esperanza",
        difficulty: "easy",
        hint: "Inicio de optimismo",
        type: "noun_phrase"
    },
    {
        id: 71,
        phrase: "sangre que hierve",
        difficulty: "medium",
        hint: "Pasión intensa",
        type: "sentence"
    },
    {
        id: 72,
        phrase: "corazón en alto",
        difficulty: "easy",
        hint: "Ánimo elevado",
        type: "noun_phrase"
    },
    {
        id: 73,
        phrase: "puño en alto",
        difficulty: "easy",
        hint: "Gesto de resistencia",
        type: "noun_phrase"
    },
    {
        id: 74,
        phrase: "camino de estrellas",
        difficulty: "medium",
        hint: "Ruta luminosa",
        type: "noun_phrase"
    },
    {
        id: 75,
        phrase: "brillo en la mirada",
        difficulty: "easy",
        hint: "Ilusión visible",
        type: "noun_phrase"
    },
    {
        id: 76,
        phrase: "puertas que se abren",
        difficulty: "medium",
        hint: "Oportunidades nuevas",
        type: "sentence"
    },
    {
        id: 77,
        phrase: "voces que celebran",
        difficulty: "easy",
        hint: "Alegría colectiva",
        type: "sentence"
    },
    {
        id: 78,
        phrase: "momento de gloria",
        difficulty: "easy",
        hint: "Instante triunfal",
        type: "noun_phrase"
    },
    {
        id: 79,
        phrase: "futuro brillante",
        difficulty: "easy",
        hint: "Porvenir luminoso",
        type: "noun_adjective"
    },
    {
        id: 80,
        phrase: "impulso vital",
        difficulty: "medium",
        hint: "Fuerza de vida",
        type: "noun_adjective"
    },
    {
        id: 81,
        phrase: "neón en la oscuridad",
        difficulty: "medium",
        hint: "Luz artificial urbana",
        type: "noun_phrase"
    },
    {
        id: 82,
        phrase: "código que late",
        difficulty: "medium",
        hint: "Programa vivo",
        type: "sentence"
    },
    {
        id: 83,
        phrase: "cables y sueños",
        difficulty: "easy",
        hint: "Tecnología y aspiración",
        type: "noun_phrase"
    },
    {
        id: 84,
        phrase: "ciudad que nunca duerme",
        difficulty: "medium",
        hint: "Metrópoli incesante",
        type: "sentence"
    },
    {
        id: 85,
        phrase: "pulso digital",
        difficulty: "easy",
        hint: "Ritmo tecnológico",
        type: "noun_adjective"
    },
    {
        id: 86,
        phrase: "lluvia de datos",
        difficulty: "medium",
        hint: "Información abundante",
        type: "noun_phrase"
    },
    {
        id: 87,
        phrase: "memoria sintética",
        difficulty: "medium",
        hint: "Recuerdo artificial",
        type: "noun_adjective"
    },
    {
        id: 88,
        phrase: "red infinita",
        difficulty: "easy",
        hint: "Conexión sin límites",
        type: "noun_adjective"
    },
    {
        id: 89,
        phrase: "sombras de cromo",
        difficulty: "hard",
        hint: "Oscuridad metálica",
        type: "noun_phrase"
    },
    {
        id: 90,
        phrase: "voz del sistema",
        difficulty: "medium",
        hint: "Comunicación automatizada",
        type: "noun_phrase"
    },
    {
        id: 91,
        phrase: "circuitos ardiendo",
        difficulty: "medium",
        hint: "Tecnología al límite",
        type: "sentence"
    },
    {
        id: 92,
        phrase: "terminal parpadeante",
        difficulty: "easy",
        hint: "Pantalla intermitente",
        type: "noun_adjective"
    },
    {
        id: 93,
        phrase: "hackear la realidad",
        difficulty: "hard",
        hint: "Romper las reglas",
        type: "sentence"
    },
    {
        id: 94,
        phrase: "ecos en el mainframe",
        difficulty: "hard",
        hint: "Rastros en el sistema",
        type: "noun_phrase"
    },
    {
        id: 95,
        phrase: "calle de pixeles",
        difficulty: "medium",
        hint: "Espacio digital urbano",
        type: "noun_phrase"
    },
    {
        id: 96,
        phrase: "conexión perdida",
        difficulty: "easy",
        hint: "Desconexión súbita",
        type: "noun_adjective"
    },
    {
        id: 97,
        phrase: "futuro de acero",
        difficulty: "medium",
        hint: "Porvenir tecnológico",
        type: "noun_phrase"
    },
    {
        id: 98,
        phrase: "almas en la red",
        difficulty: "hard",
        hint: "Conciencia digitalizada",
        type: "noun_phrase"
    },
    {
        id: 99,
        phrase: "despertar del androide",
        difficulty: "hard",
        hint: "Conciencia artificial",
        type: "noun_phrase"
    },
    {
        id: 100,
        phrase: "sinfonía binaria",
        difficulty: "hard",
        hint: "Música de código",
        type: "noun_adjective"
    },
    {
        id: 101,
        phrase: "ser o no ser",
        difficulty: "easy",
        hint: "Cuestión existencial",
        type: "sentence"
    },
    {
        id: 102,
        phrase: "pensar es existir",
        difficulty: "medium",
        hint: "Cogito cartesiano",
        type: "sentence"
    },
    {
        id: 103,
        phrase: "esencia y existencia",
        difficulty: "hard",
        hint: "Dualidad fundamental",
        type: "noun_phrase"
    },
    {
        id: 104,
        phrase: "velo de la ignorancia",
        difficulty: "hard",
        hint: "Ceguera del conocimiento",
        type: "noun_phrase"
    },
    {
        id: 105,
        phrase: "sentido de la vida",
        difficulty: "medium",
        hint: "Propósito existencial",
        type: "noun_phrase"
    },
    {
        id: 106,
        phrase: "realidad o ilusión",
        difficulty: "medium",
        hint: "Naturaleza de lo real",
        type: "noun_phrase"
    },
    {
        id: 107,
        phrase: "límites del lenguaje",
        difficulty: "hard",
        hint: "Fronteras del pensamiento",
        type: "noun_phrase"
    },
    {
        id: 108,
        phrase: "naturaleza del tiempo",
        difficulty: "hard",
        hint: "Esencia temporal",
        type: "noun_phrase"
    },
    {
        id: 109,
        phrase: "caverna de sombras",
        difficulty: "hard",
        hint: "Alegoría platónica",
        type: "noun_phrase"
    },
    {
        id: 110,
        phrase: "voluntad de poder",
        difficulty: "hard",
        hint: "Impulso nietzscheano",
        type: "noun_phrase"
    },
    {
        id: 111,
        phrase: "abismo que observa",
        difficulty: "hard",
        hint: "Mirada del vacío",
        type: "sentence"
    },
    {
        id: 112,
        phrase: "eterno retorno",
        difficulty: "medium",
        hint: "Ciclo infinito",
        type: "noun_adjective"
    },
    {
        id: 113,
        phrase: "ser en el mundo",
        difficulty: "hard",
        hint: "Existencia situada",
        type: "sentence"
    },
    {
        id: 114,
        phrase: "nada es absoluto",
        difficulty: "medium",
        hint: "Relatividad total",
        type: "sentence"
    },
    {
        id: 115,
        phrase: "verdad subjetiva",
        difficulty: "medium",
        hint: "Realidad personal",
        type: "noun_adjective"
    },
    {
        id: 116,
        phrase: "conciencia de sí",
        difficulty: "medium",
        hint: "Autoconocimiento",
        type: "noun_phrase"
    },
    {
        id: 117,
        phrase: "mundo de ideas",
        difficulty: "medium",
        hint: "Reino platónico",
        type: "noun_phrase"
    },
    {
        id: 118,
        phrase: "razón suficiente",
        difficulty: "hard",
        hint: "Causa necesaria",
        type: "noun_adjective"
    },
    {
        id: 119,
        phrase: "duda metódica",
        difficulty: "hard",
        hint: "Cuestionamiento sistemático",
        type: "noun_adjective"
    },
    {
        id: 120,
        phrase: "naturaleza humana",
        difficulty: "medium",
        hint: "Esencia del ser",
        type: "noun_adjective"
    },
    {
        id: 121,
        phrase: "elige tus batallas",
        difficulty: "easy",
        hint: "Prioriza esfuerzos",
        type: "sentence"
    },
    {
        id: 122,
        phrase: "confía en el proceso",
        difficulty: "easy",
        hint: "Ten paciencia",
        type: "sentence"
    },
    {
        id: 123,
        phrase: "construye puentes",
        difficulty: "easy",
        hint: "Crea conexiones",
        type: "sentence"
    },
    {
        id: 124,
        phrase: "escucha más habla menos",
        difficulty: "medium",
        hint: "Valor del silencio",
        type: "sentence"
    },
    {
        id: 125,
        phrase: "aprende de todo",
        difficulty: "easy",
        hint: "Mente abierta",
        type: "sentence"
    },
    {
        id: 126,
        phrase: "no temas fallar",
        difficulty: "easy",
        hint: "Acepta el error",
        type: "sentence"
    },
    {
        id: 127,
        phrase: "cultiva la paciencia",
        difficulty: "easy",
        hint: "Desarrolla calma",
        type: "sentence"
    },
    {
        id: 128,
        phrase: "honra tu palabra",
        difficulty: "easy",
        hint: "Sé íntegro",
        type: "sentence"
    },
    {
        id: 129,
        phrase: "suelta lo que pesa",
        difficulty: "medium",
        hint: "Libérate de cargas",
        type: "sentence"
    },
    {
        id: 130,
        phrase: "mira hacia adelante",
        difficulty: "easy",
        hint: "Enfócate en el futuro",
        type: "sentence"
    },
    {
        id: 131,
        phrase: "cuestiona todo",
        difficulty: "easy",
        hint: "Piensa críticamente",
        type: "sentence"
    },
    {
        id: 132,
        phrase: "comienza de nuevo",
        difficulty: "easy",
        hint: "Segunda oportunidad",
        type: "sentence"
    },
    {
        id: 133,
        phrase: "menos es más",
        difficulty: "easy",
        hint: "Simplicidad poderosa",
        type: "sentence"
    },
    {
        id: 134,
        phrase: "protege tu energía",
        difficulty: "medium",
        hint: "Cuida tu vitalidad",
        type: "sentence"
    },
    {
        id: 135,
        phrase: "toma acción hoy",
        difficulty: "easy",
        hint: "No pospongas",
        type: "sentence"
    },
    {
        id: 136,
        phrase: "sé tu prioridad",
        difficulty: "medium",
        hint: "Cuídate primero",
        type: "sentence"
    },
    {
        id: 137,
        phrase: "busca el equilibrio",
        difficulty: "easy",
        hint: "Encuentra balance",
        type: "sentence"
    },
    {
        id: 138,
        phrase: "acepta el cambio",
        difficulty: "easy",
        hint: "Fluye con lo nuevo",
        type: "sentence"
    },
    {
        id: 139,
        phrase: "respira profundo",
        difficulty: "easy",
        hint: "Calma instantánea",
        type: "sentence"
    },
    {
        id: 140,
        phrase: "crea tu camino",
        difficulty: "easy",
        hint: "Forja tu destino",
        type: "sentence"
    },
    {
        id: 141,
        phrase: "controla lo controlable",
        difficulty: "medium",
        hint: "Enfócate en tu poder",
        type: "sentence"
    },
    {
        id: 142,
        phrase: "obstáculo es camino",
        difficulty: "medium",
        hint: "Adversidad enseña",
        type: "sentence"
    },
    {
        id: 143,
        phrase: "mente como agua",
        difficulty: "medium",
        hint: "Flexibilidad mental",
        type: "noun_phrase"
    },
    {
        id: 144,
        phrase: "voluntad inquebrantable",
        difficulty: "medium",
        hint: "Determinación férrea",
        type: "noun_adjective"
    },
    {
        id: 145,
        phrase: "amor fati",
        difficulty: "hard",
        hint: "Ama tu destino",
        type: "noun_phrase"
    },
    {
        id: 146,
        phrase: "memento mori",
        difficulty: "medium",
        hint: "Recuerda que morirás",
        type: "noun_phrase"
    },
    {
        id: 147,
        phrase: "presente perpetuo",
        difficulty: "medium",
        hint: "Solo existe el ahora",
        type: "noun_adjective"
    },
    {
        id: 148,
        phrase: "virtud es suficiente",
        difficulty: "hard",
        hint: "La ética basta",
        type: "sentence"
    },
    {
        id: 149,
        phrase: "juicio suspendido",
        difficulty: "hard",
        hint: "No opinar precipitadamente",
        type: "noun_adjective"
    },
    {
        id: 150,
        phrase: "naturaleza como guía",
        difficulty: "medium",
        hint: "Sigue lo natural",
        type: "noun_phrase"
    },
    {
        id: 151,
        phrase: "calma en la tormenta",
        difficulty: "medium",
        hint: "Serenidad ante el caos",
        type: "noun_phrase"
    },
    {
        id: 152,
        phrase: "fortaleza interior",
        difficulty: "easy",
        hint: "Fuerza desde dentro",
        type: "noun_adjective"
    },
    {
        id: 153,
        phrase: "desapego consciente",
        difficulty: "hard",
        hint: "Liberación voluntaria",
        type: "noun_adjective"
    },
    {
        id: 154,
        phrase: "deber cumplido",
        difficulty: "easy",
        hint: "Responsabilidad asumida",
        type: "noun_adjective"
    },
    {
        id: 155,
        phrase: "ecuanimidad perfecta",
        difficulty: "hard",
        hint: "Balance emocional total",
        type: "noun_adjective"
    },
    {
        id: 156,
        phrase: "aceptación radical",
        difficulty: "medium",
        hint: "Recibir todo sin resistencia",
        type: "noun_adjective"
    },
    {
        id: 157,
        phrase: "acción correcta",
        difficulty: "easy",
        hint: "Hacer lo debido",
        type: "noun_adjective"
    },
    {
        id: 158,
        phrase: "temple de acero",
        difficulty: "medium",
        hint: "Carácter indestructible",
        type: "noun_phrase"
    },
    {
        id: 159,
        phrase: "vida según naturaleza",
        difficulty: "hard",
        hint: "Existencia armoniosa",
        type: "noun_phrase"
    },
    {
        id: 160,
        phrase: "dominio de sí",
        difficulty: "medium",
        hint: "Autocontrol absoluto",
        type: "noun_phrase"
    }
];

// Variable global para la frase del día
let dailyPhrase = null;

// Obtener reto diario nivel 2 (aleatorio diario, excluyendo usadas)
function getDailyPhraseChallenge() {
    // Si ya tenemos la frase del día en memoria, devolverla
    if (dailyPhrase) return dailyPhrase;
    
    const today = window.getLocalDateString();
    
    // Verificar si ya tenemos una frase guardada para hoy
    try {
        const stored = localStorage.getItem('wallapic_daily_phrase');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) {
                dailyPhrase = data.challenge;
                return dailyPhrase;
            }
        }
    } catch (error) {
        console.error('Error cargando frase del día:', error);
    }
    
    // Obtener frases no usadas
    const unusedPhrases = getUnusedPhrases();
    
    // Si no quedan frases disponibles, devolver null
    if (unusedPhrases.length === 0) {
        console.log('⚠️ No quedan frases disponibles');
        return null;
    }
    
    // Generar nueva frase aleatoria de las no usadas
    const randomIndex = Math.floor(Math.random() * unusedPhrases.length);
    dailyPhrase = unusedPhrases[randomIndex];
    
    // Guardar para mantener la misma frase todo el día
    try {
        localStorage.setItem('wallapic_daily_phrase', JSON.stringify({
            date: today,
            challenge: dailyPhrase
        }));
    } catch (error) {
        console.error('Error guardando frase del día:', error);
    }
    
    return dailyPhrase;
}

// Obtener frases que aún no han sido usadas
function getUnusedPhrases() {
    const usedPhrases = loadUsedPhrases();
    const usedPhrasesList = usedPhrases.map(p => p.phrase.toLowerCase());
    
    return CHALLENGES_LEVEL_2.filter(phrase => 
        !usedPhrasesList.includes(phrase.phrase.toLowerCase())
    );
}

// Verificar si quedan frases disponibles
function hasAvailablePhrases() {
    return getUnusedPhrases().length > 0;
}

// Verificar si la frase fue usada en el texto
function checkForPhrase(text, phrase) {
    if (!text || !phrase) return false;
    
    const normalizedText = text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remover acentos
    
    const normalizedPhrase = phrase.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return normalizedText.includes(normalizedPhrase);
}

// Guardar frase completada (preparado para Supabase)
async function markPhraseAsUsed(phrase, date) {
    // TODO: Integrar con storage-manager cuando se active
    // Por ahora guardamos en localStorage
    
    try {
        const stored = localStorage.getItem('wallapic_used_phrases');
        const usedPhrases = stored ? JSON.parse(stored) : [];
        
        if (!usedPhrases.find(p => p.phrase === phrase)) {
            usedPhrases.push({
                phrase: phrase,
                date: date,
                timestamp: Date.now()
            });
            
            localStorage.setItem('wallapic_used_phrases', JSON.stringify(usedPhrases));
        }
        
        return true;
    } catch (error) {
        console.error('Error guardando frase:', error);
        return false;
    }
}

// Verificar si la frase ya fue usada hoy
function isPhraseUsedToday(phrase) {
    try {
        const today = window.getLocalDateString();
        const stored = localStorage.getItem('wallapic_used_phrases');
        const usedPhrases = stored ? JSON.parse(stored) : [];
        
        return usedPhrases.some(p => 
            p.phrase === phrase && 
            p.date.split('T')[0] === today
        );
    } catch (error) {
        return false;
    }
}

// Cargar frases completadas
function loadUsedPhrases() {
    try {
        const stored = localStorage.getItem('wallapic_used_phrases');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
}

// Renderizar reto nivel 2 (preparado, se activará con streak >= 7)
function renderPhraseChallengeUI() {
    const streak = calculateStreak();
    const isEnabled = window.streakSystem.areChallengesLevel2Enabled(streak);
    
    if (!isEnabled) {
        // No mostrar si no está habilitado
        return;
    }
    
    const challenge = getDailyPhraseChallenge();
    const isUsed = isPhraseUsedToday(challenge.phrase);
    
    // TODO: Agregar UI para mostrar el reto de frase
    // Similaral reto de palabra pero con diseño diferente
    // Se activará cuando el sistema esté listo
    
    console.log('🎯 Reto Nivel 2 disponible:', challenge.phrase);
}

// Exportar funciones globales
window.challengesLevel2 = {
    challenges: CHALLENGES_LEVEL_2,
    getDailyPhraseChallenge,
    checkForPhrase,
    markPhraseAsUsed,
    isPhraseUsedToday,
    loadUsedPhrases,
    renderPhraseChallengeUI,
    getUnusedPhrases,
    hasAvailablePhrases
};

console.log('✅ Sistema de retos nivel 2 preparado (se activa con racha >= 7)');
