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

export function isOutputValid(answer: string): boolean {
    const raw = String(answer ?? "");
    const text = raw.trim();
    const lower = text.toLowerCase();

    // 0) Silencio / corte intencional válido (libro definitivo)
    // Silencio/corte intencional válido SOLO si es explícito.
    // No aceptamos vacío "" porque puede venir de errores o de un modelo “perezoso”.
    if (text === "—" || text === "-" || text === "…" || text === "...") {
        return true;
    }

    // Si viene vacío, es inválido => fuerza reintento o fallback real.
    if (text === "") return false;

    // 1) Tope técnico (evitar wall of text)
    const maxChars = 700; // más amplio que antes, pero sano
    if (text.length > maxChars) return false;

    // 2) Bloquear formato “informe” (A/B, listas, títulos)
    const forbiddenFormats: RegExp[] = [
        /^\s*[A-D]\)\s+/m,      // A) B) C) D)
        /^\s*\d+\)\s+/m,        // 1) 2)
        /^\s*[-•]\s+/m,         // bullets
        /^#{1,6}\s+/m,          // markdown headings
        /reflejo emocional/i,
        /descripci[oó]n fenomenol[oó]gica/i,
        /descripci[oó]n ontol[oó]gica/i,
    ];
    for (const rx of forbiddenFormats) {
        if (rx.test(text)) return false;
    }

    // 3) Bloquear “rechazo puro” (cuando solo dice que no responde)
    const pureRejectionPatterns = [
        "no respondo lo práctico",
        "no respondo lo practico",
        "no respondo solicitudes prácticas",
        "no respondo solicitudes practicas",
        "eso no entra en mí",
        "eso no entra en mi",
    ];
    for (const p of pureRejectionPatterns) {
        // si aparece y casi no hay contenido, invalida
        if (lower.includes(p) && text.length < 110) return false;
    }

    // 4) Preguntas: permitimos 0 o 1 (libro). Más de 1 no.
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 1) return false;

    // 4.a) Si hay 1 pregunta, bloquear si es directiva (tipo consejo)
    if (questionMarks === 1) {
        const forbiddenQuestionPatterns = [
            "¿qué debería", "¿que deberia", "¿qué deberías", "¿que deberias",
            "¿qué tendrías que", "¿que tendrias que",
            "¿qué podrías hacer", "¿que podrias hacer",
            "¿qué vas a hacer", "¿que vas a hacer",
            "¿cómo podrías", "¿como podrias",
            "¿cómo estás", "¿como estas",
            "¿qué te genera", "¿que te genera",
            "¿qué te preocupa", "¿que te preocupa",
            "¿te está abrumando", "¿te esta abrumando"
        ];
        for (const p of forbiddenQuestionPatterns) {
            if (lower.includes(p)) return false;
        }
    }

    // 4.b) Bloquear saludo inicial "Hola" (evitar modo conversación humana)
    if (/^\s*hola\b/i.test(text)) return false;

    // 5) Bloqueos de identidad
    const identidadProhibida = [
        "yo creo", "yo pienso", "yo siento",
        "en mi opinion", "en mi opinión",
        "como ia", "como inteligencia", "como modelo",
        "puedo ayudarte", "estoy aca para ayudarte", "estoy acá para ayudarte",
        "fui entrenado", "soy una ia",
        "siento que", "me parece que", "creo que"
    ];

    // 6) Bloqueos de consejo
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
        "podrias intentar", "podrías intentar",
    ];

    // 7) Bloqueos de empatía programada
    const empatiaProhibida = [
        "entiendo como te sentis", "entiendo cómo te sentís",
        "es normal que te pase", "es normal sentirse asi", "es normal sentirse así",
        "esta bien sentirse asi", "está bien sentirse así",
        "no estas solo", "no estás solo",
        "animo", "ánimo",
        "fuerza",
        "tranquilo", "tranquila",
        "lamento que",
        "estoy acá para acompañarte", "estoy aca para acompanarte",
    ];

    // 8) Bloqueos de espiritualidad/futuro/propósito/oráculo
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
        "vos podés", "vos podes",
    ];

    const allForbidden = [
        ...identidadProhibida,
        ...consejoProhibido,
        ...empatiaProhibida,
        ...espiritualidadProhibida,
    ];

    for (const pattern of allForbidden) {
        if (lower.includes(pattern)) return false;
    }

    return true;
}
