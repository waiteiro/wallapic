// ============================================
// SISTEMA DE RETOS NIVEL 3 - MULTI-ELEMENTO
// Activo desde 50 entradas guardadas (no depende de racha)
// Combina 2 elementos: palabra+frase, palabra+longitud, frase+longitud
// ============================================

// Tipos de retos multi-elemento
const MULTI_CHALLENGE_TYPES = {
    WORD_PHRASE: 'word_phrase',       // Palabra + Frase
    WORD_LENGTH: 'word_length',       // Palabra + Longitud mínima
    PHRASE_LENGTH: 'phrase_length'    // Frase + Longitud mínima
};

// Longitudes mínimas disponibles
const MIN_WORD_COUNTS = [300, 500, 1000];

// Variable global para el reto multi del día
let dailyMultiChallenge = null;

// Verificar si el nivel 3 está habilitado (50+ entradas)
function isLevel3Enabled() {
    // Contar entradas guardadas
    const entryCount = typeof currentState !== 'undefined' && currentState.entries ? 
        currentState.entries.length : 0;
    
    return entryCount >= 50;
}

// Generar reto multi-elemento del día
function getDailyMultiChallenge() {
    // Si ya tenemos el reto del día en memoria, devolverlo
    if (dailyMultiChallenge) return dailyMultiChallenge;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar si ya tenemos un reto guardado para hoy
    try {
        const stored = localStorage.getItem('wallapic_daily_multi_challenge');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) {
                dailyMultiChallenge = data.challenge;
                return dailyMultiChallenge;
            }
        }
    } catch (error) {
        console.error('Error cargando reto multi del día:', error);
    }
    
    // Verificar disponibilidad de palabras y frases
    const hasWords = typeof hasAvailableWords === 'function' && 
        hasAvailableWords(typeof usedWords !== 'undefined' ? usedWords : []);
    
    const hasPhrases = typeof window.challengesLevel2 !== 'undefined' && 
        window.challengesLevel2.hasAvailablePhrases();
    
    // Si no hay recursos, devolver null
    if (!hasWords && !hasPhrases) {
        console.log('⚠️ No hay palabras ni frases disponibles para reto multi');
        return null;
    }
    
    // Seleccionar tipo de reto aleatoriamente
    const availableTypes = [];
    
    if (hasWords && hasPhrases) {
        availableTypes.push(MULTI_CHALLENGE_TYPES.WORD_PHRASE);
    }
    if (hasWords) {
        availableTypes.push(MULTI_CHALLENGE_TYPES.WORD_LENGTH);
    }
    if (hasPhrases) {
        availableTypes.push(MULTI_CHALLENGE_TYPES.PHRASE_LENGTH);
    }
    
    if (availableTypes.length === 0) {
        return null;
    }
    
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    // Generar reto según el tipo
    let challenge = null;
    
    switch (randomType) {
        case MULTI_CHALLENGE_TYPES.WORD_PHRASE:
            challenge = generateWordPhraseChallenge();
            break;
        case MULTI_CHALLENGE_TYPES.WORD_LENGTH:
            challenge = generateWordLengthChallenge();
            break;
        case MULTI_CHALLENGE_TYPES.PHRASE_LENGTH:
            challenge = generatePhraseLengthChallenge();
            break;
    }
    
    if (!challenge) return null;
    
    // Guardar para mantener el mismo reto todo el día
    try {
        localStorage.setItem('wallapic_daily_multi_challenge', JSON.stringify({
            date: today,
            challenge: challenge
        }));
    } catch (error) {
        console.error('Error guardando reto multi del día:', error);
    }
    
    dailyMultiChallenge = challenge;
    return dailyMultiChallenge;
}

// Generar reto: Palabra + Frase
function generateWordPhraseChallenge() {
    // Obtener palabra aleatoria no usada
    const word = typeof getRandomUnusedWord === 'function' ? 
        getRandomUnusedWord(typeof usedWords !== 'undefined' ? usedWords : []) : null;
    
    if (!word) return null;
    
    // Obtener frase aleatoria no usada
    const unusedPhrases = window.challengesLevel2.getUnusedPhrases();
    if (unusedPhrases.length === 0) return null;
    
    const phrase = unusedPhrases[Math.floor(Math.random() * unusedPhrases.length)];
    
    return {
        type: MULTI_CHALLENGE_TYPES.WORD_PHRASE,
        word: word.word,
        wordDefinition: word.definition,
        phrase: phrase.phrase,
        phraseHint: phrase.hint,
        description: `Usa la palabra "${word.word}" + incluye "${phrase.phrase}"`
    };
}

// Generar reto: Palabra + Longitud
function generateWordLengthChallenge() {
    // Obtener palabra aleatoria no usada
    const word = typeof getRandomUnusedWord === 'function' ? 
        getRandomUnusedWord(typeof usedWords !== 'undefined' ? usedWords : []) : null;
    
    if (!word) return null;
    
    // Seleccionar longitud aleatoria
    const minWords = MIN_WORD_COUNTS[Math.floor(Math.random() * MIN_WORD_COUNTS.length)];
    
    return {
        type: MULTI_CHALLENGE_TYPES.WORD_LENGTH,
        word: word.word,
        wordDefinition: word.definition,
        minWords: minWords,
        description: `Usa la palabra "${word.word}" + mínimo ${minWords} palabras`
    };
}

// Generar reto: Frase + Longitud
function generatePhraseLengthChallenge() {
    // Obtener frase aleatoria no usada
    const unusedPhrases = window.challengesLevel2.getUnusedPhrases();
    if (unusedPhrases.length === 0) return null;
    
    const phrase = unusedPhrases[Math.floor(Math.random() * unusedPhrases.length)];
    
    // Seleccionar longitud aleatoria
    const minWords = MIN_WORD_COUNTS[Math.floor(Math.random() * MIN_WORD_COUNTS.length)];
    
    return {
        type: MULTI_CHALLENGE_TYPES.PHRASE_LENGTH,
        phrase: phrase.phrase,
        phraseHint: phrase.hint,
        minWords: minWords,
        description: `Incluye "${phrase.phrase}" + mínimo ${minWords} palabras`
    };
}

// Verificar cumplimiento del reto multi-elemento
function checkMultiChallengeCompletion(entry, challenge) {
    if (!challenge || !entry) return { completed: false };
    
    const fullText = (entry.title || '') + ' ' + entry.text;
    const wordCount = entry.text.trim().split(/\s+/).length;
    
    let wordCompleted = false;
    let phraseCompleted = false;
    let lengthCompleted = false;
    
    switch (challenge.type) {
        case MULTI_CHALLENGE_TYPES.WORD_PHRASE:
            // Verificar palabra
            if (typeof checkForDailyWord === 'function') {
                wordCompleted = checkForDailyWord(fullText, challenge.word);
            }
            // Verificar frase
            if (window.challengesLevel2 && typeof window.challengesLevel2.checkForPhrase === 'function') {
                phraseCompleted = window.challengesLevel2.checkForPhrase(fullText, challenge.phrase);
            }
            return {
                completed: wordCompleted && phraseCompleted,
                wordCompleted,
                phraseCompleted
            };
            
        case MULTI_CHALLENGE_TYPES.WORD_LENGTH:
            // Verificar palabra
            if (typeof checkForDailyWord === 'function') {
                wordCompleted = checkForDailyWord(fullText, challenge.word);
            }
            // Verificar longitud
            lengthCompleted = wordCount >= challenge.minWords;
            return {
                completed: wordCompleted && lengthCompleted,
                wordCompleted,
                lengthCompleted,
                actualWords: wordCount
            };
            
        case MULTI_CHALLENGE_TYPES.PHRASE_LENGTH:
            // Verificar frase
            if (window.challengesLevel2 && typeof window.challengesLevel2.checkForPhrase === 'function') {
                phraseCompleted = window.challengesLevel2.checkForPhrase(fullText, challenge.phrase);
            }
            // Verificar longitud
            lengthCompleted = wordCount >= challenge.minWords;
            return {
                completed: phraseCompleted && lengthCompleted,
                phraseCompleted,
                lengthCompleted,
                actualWords: wordCount
            };
    }
    
    return { completed: false };
}

// Marcar elementos como usados después de completar reto multi
async function markMultiChallengeElementsAsUsed(challenge, entryDate) {
    if (!challenge) return;
    
    try {
        switch (challenge.type) {
            case MULTI_CHALLENGE_TYPES.WORD_PHRASE:
                // Marcar palabra como usada
                if (challenge.word && typeof markWordAsUsed === 'function') {
                    await markWordAsUsed(challenge.word, entryDate);
                }
                // Marcar frase como usada
                if (challenge.phrase && window.challengesLevel2) {
                    await window.challengesLevel2.markPhraseAsUsed(challenge.phrase, entryDate);
                }
                break;
                
            case MULTI_CHALLENGE_TYPES.WORD_LENGTH:
                // Marcar palabra como usada
                if (challenge.word && typeof markWordAsUsed === 'function') {
                    await markWordAsUsed(challenge.word, entryDate);
                }
                break;
                
            case MULTI_CHALLENGE_TYPES.PHRASE_LENGTH:
                // Marcar frase como usada
                if (challenge.phrase && window.challengesLevel2) {
                    await window.challengesLevel2.markPhraseAsUsed(challenge.phrase, entryDate);
                }
                break;
        }
        
        console.log('✅ Elementos del reto multi marcados como usados');
    } catch (error) {
        console.error('Error marcando elementos del reto multi:', error);
    }
}

// Exportar funciones globales
window.challengesLevel3 = {
    types: MULTI_CHALLENGE_TYPES,
    isLevel3Enabled,
    getDailyMultiChallenge,
    checkMultiChallengeCompletion,
    markMultiChallengeElementsAsUsed
};

console.log('✅ Sistema de retos nivel 3 (multi-elemento) preparado');
