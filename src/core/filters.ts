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
    const lower = answer.toLowerCase();

    const identidadProhibida = [
        "yo creo", "yo pienso", "yo siento",
        "en mi opinion", "en mi opinión",
        "como ia", "como inteligencia", "como modelo",
        "puedo ayudarte", "estoy aca para ayudarte", "estoy acá para ayudarte"
    ];

    const consejoProhibido = [
        "deberias", "deberías",
        "te recomiendo", "te aconsejo",
        "lo que podes hacer", "lo que podés hacer",
        "seria bueno que", "sería bueno que",
        "te conviene", "lo mejor seria", "lo mejor sería",
        "intenta ", "intentá ",
        "proba ", "probá ",
        "empeza ", "empezá ",
        "organiza ", "organizá "
    ];

    const empatiaProhibida = [
        "entiendo como te sentis", "entiendo cómo te sentís",
        "es normal que te pase", "es normal sentirse asi", "es normal sentirse así",
        "esta bien sentirse asi", "está bien sentirse así",
        "no estas solo", "no estás solo",
        "animo", "ánimo",
        "fuerza",
        "tranquilo", "tranquila"
    ];

    const lists = [identidadProhibida, consejoProhibido, empatiaProhibida];

    for (const list of lists) {
        if (list.some(f => lower.includes(f))) {
            return false;
        }
    }

    // Frases prohibidas extra (alineadas al Manual)
    const frasesProhibidas = [
        "no te preocupes",
        "es normal que pase eso",
        "todo va a estar bien",
        "tu propósito es",
        "no es tan grave",
        "a veces la vida"
    ];

    for (const f of frasesProhibidas) {
        if (lower.includes(f)) return false;
    }

    // Longitud máxima
    const maxChars = 180;
    if (answer.length > maxChars) return false;

    // Opcional: evitar preguntas tipo coaching
    if (answer.includes("?")) return false;

    return true;
}
