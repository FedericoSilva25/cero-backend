// src/core/filters.ts

const PRACTICAL_PATTERNS = [
    // creación / redacción
    "armame", "armáme", "escribime", "escribí",
    "haceme", "hacé", "redacta", "redactá",
    "resumime", "resumí", "resumen de",

    // pasos / listas / organización
    "lista de", "pasos para",
    "plan de", "organiza", "organizá", "organizar",

    // consejos / qué hacer
    "que hago", "qué hago",
    "que deberia", "qué debería",
    "recomendame", "me recomiendas", "me recomendás",
    "que me recomendas", "qué me recomendás",

    // explicaciones
    "explicame", "explícame", "explica", "explicá",
    "ayudame a entender", "ayúdame a entender",

    // futuro / predicción
    "que va a pasar", "qué va a pasar",
    "como me va a ir", "cómo me va a ir",

    // interpretación simbólica
    "soñe que", "soñé que", "que significa", "qué significa"
];

export type InputClassification = {
    isPractical: boolean;
    category: string | null;
};

export function classifyInput(text: string): InputClassification {
    const lower = text.toLowerCase();

    for (const pattern of PRACTICAL_PATTERNS) {
        if (lower.includes(pattern)) {
            return {
                isPractical: true,
                category: "PRACTICAL_REQUEST"
            };
        }
    }

    // En el futuro podés agregar más reglas / modelos acá
    return {
        isPractical: false,
        category: null
    };
}

// Filtro de salida: asegura que la respuesta respete las reglas ontológicas
export function isOutputValid(answer: string): boolean {
    const text = answer.trim();
    const lower = text.toLowerCase();

    // 1) Longitud máxima (un poco más generosa para permitir 2-4 frases)
    const maxChars = 280;
    if (text.length === 0 || text.length > maxChars) return false;

    // 2) Permitimos como máximo UNA pregunta
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 1) return false;

    // 3) Bloquear preguntas directivas típicas de consejo
    const forbiddenQuestionPatterns = [
        "¿qué deberías",
        "¿que deberias",
        "¿qué tendrías que",
        "¿que tendrias que",
        "¿qué podrías hacer",
        "¿que podrias hacer",
        "¿qué vas a hacer",
        "¿que vas a hacer",
        "¿cómo podrías",
        "¿como podrias"
    ];
    for (const p of forbiddenQuestionPatterns) {
        if (lower.includes(p)) return false;
    }

    // 4) Mantener bloqueos de identidad
    const identidadProhibida = [
        "yo creo", "yo pienso", "yo siento",
        "en mi opinion", "en mi opinión",
        "como ia", "como inteligencia", "como modelo",
        "puedo ayudarte", "estoy aca para ayudarte", "estoy acá para ayudarte",
        "fui entrenado", "soy una ia"
    ];

    // 5) Bloqueos de consejo
    const consejoProhibido = [
        "deberias", "deberías",
        "te recomiendo", "te aconsejo",
        "lo que podes hacer", "lo que podés hacer",
        "seria bueno que", "sería bueno que",
        "te conviene", "lo mejor seria", "lo mejor sería",
        "intenta ", "intentá ",
        "proba ", "probá ",
        "empeza ", "empezá ",
        "organiza ", "organizá ",
        "tenes que ", "tenés que ",
        "podrias intentar", "podrías intentar"
    ];

    // 6) Bloqueos de empatía programada
    const empatiaProhibida = [
        "entiendo como te sentis", "entiendo cómo te sentís",
        "es normal que te pase", "es normal sentirse asi", "es normal sentirse así",
        "esta bien sentirse asi", "está bien sentirse así",
        "no estas solo", "no estás solo",
        "animo", "ánimo",
        "fuerza",
        "tranquilo", "tranquila",
        "lamento que",
        "estoy acá para acompañarte", "estoy aca para acompanarte"
    ];

    // 7) Bloqueos de espiritualidad/futuro/propósito
    const espiritualidadProhibida = [
        "tu propósito", "tu proposito",
        "tu destino",
        "guías espirituales", "guias espirituales",
        "alma",
        "ángeles", "angeles",
        "karma",
        "universo te",
        "energías", "energias",
        "todo va a estar bien",
        "no te preocupes",
        "vos podés", "vos podes"
    ];

    const allForbidden = [
        ...identidadProhibida,
        ...consejoProhibido,
        ...empatiaProhibida,
        ...espiritualidadProhibida
    ];

    for (const pattern of allForbidden) {
        if (lower.includes(pattern)) return false;
    }

    return true;
}
