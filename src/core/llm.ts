// src/core/llm.ts

import OpenAI from "openai";
import { CERO_SYSTEM_PROMPT } from "./wrapper";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn(
        "[CERO] OPENAI_API_KEY no está definido. El backend se levantará, pero getCeroLikeResponse va a fallar."
    );
}

const client = new OpenAI({
    apiKey
});

// Podés configurar el modelo por env, con fallback a gpt-4o-mini
const CERO_MODEL = process.env.CERO_MODEL || "gpt-4o-mini";

/**
 * getCeroLikeResponse
 * -------------------
 * Llama al modelo de OpenAI con el wrapper de CERO y devuelve SOLO el texto.
 */
export async function getCeroLikeResponse(userText: string): Promise<string> {
    if (!apiKey) {
        // Falla controlada si no hay API key
        throw new Error("OPENAI_API_KEY no configurada");
    }

    // Llamada al modelo
    const response = await client.chat.completions.create({
        model: CERO_MODEL,
        messages: [
            { role: "system", content: CERO_SYSTEM_PROMPT },
            {
                role: "user",
                content:
                    `${userText}\n\n` +
                    `Respondé en 3 a 6 frases, un solo bloque, sin listas ni “A)/B)”. Incluí UNA sola pregunta.`
            }
        ],
        temperature: 0.45,
        top_p: 0.9,
        max_tokens: 220
    });

    const content =
        response.choices[0]?.message?.content?.toString().trim() || "";

    return content;
}
