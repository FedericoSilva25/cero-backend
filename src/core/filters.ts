// src/core/filters.ts

const PRACTICAL_PATTERNS = [
    // Solo consideramos "práctico" cuando se pide algo concreto a hacer por fuera de la propia experiencia
    "escribime un mail",
    "redactá un mail",
    "redacta un mail",
    "armame un cv",
    "hazme un cv",
    "haceme un cv",
    "pasos para",
    "lista de pasos",
    "receta de",
    "programá",
    "programa ", // con espacio para evitar "programación"
    "escribi codigo",
    "escribí código",
    "arregla el codigo",
    "arreglá el código",
    "generá un mensaje",
    "genera un mensaje",
    "que hago", "qué hago",
    "que deberia", "qué debería",
    "decime que hacer", "decime qué hacer",
    "ayudame a decidir", "ayúdame a decidir",
    "me conviene",
    "recomendame", "recoméndame"
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

    // 1) Mínimo de caracteres para evitar respuestas vacías
    if (text.length < 25) return false;
    // 1.a) Tope técnico (Manual 2.0 permite extensión, pero ponemos límite sano)
    const maxChars = 420;
    if (text.length > maxChars) return false;

    // 1.b) Bloquear formato “informe” (A/B, listas, títulos)
    const forbiddenFormats: RegExp[] = [
        /^\s*[A-D]\)\s+/m,           // A) B) C) D)
        /^\s*\d+\)\s+/m,             // 1) 2)
        /^\s*[-•]\s+/m,              // bullets
        /reflejo emocional/i,
        /descripci[oó]n fenomenol[oó]gica/i,
        /descripci[oó]n ontol[oó]gica/i,
    ];

    for (const rx of forbiddenFormats) {
        if (rx.test(text)) return false;
    }

    // 1.c) Bloquear respuestas que solo sean rechazo práctico
    const pureRejectionPatterns = [
        "no respondo lo práctico",
        "no respondo lo practico",
        "no respondo solicitudes prácticas",
        "no respondo solicitudes practicas",
        "eso no entra en mí",
        "eso no entra en mi"
    ];

    for (const p of pureRejectionPatterns) {
        // si la frase de rechazo aparece y casi no hay más contenido, la invalidamos
        if (lower.includes(p) && text.length < 140) {
            return false;
        }
    }

    // 1.d) Mínimo de frases (3) según Manual 2.0
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    if (sentences.length < 3) return false;

    // 2) Exigimos exactamente UNA pregunta (Manual 2.0 estricto)
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks !== 1) return false;

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
