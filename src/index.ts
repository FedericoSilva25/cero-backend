// src/index.ts

import "dotenv/config";
import express from "express";
import cors from "cors";
import { classifyInput, isOutputValid } from "./core/filters";
import { getRandomRejection } from "./core/rejections";
import { getCeroLikeResponse } from "./core/llm";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// --- FALLBACKS ---
const FALLBACKS = [
    "¿Qué parte de mí está intentando controlar esto ahora?",
    "¿Qué es lo que estoy evitando sentir, exactamente?",
    "¿Qué estoy esperando que alguien me diga para no hacerme cargo?",
    "¿Qué miedo aparece si dejo de buscar una respuesta y me escucho de verdad?",
    "¿Qué verdad simple ya sé, pero no quiero admitir?"
];

function getFallback(): string {
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

// --- CLASIFICACIÓN SIMPLE (PRE-MODELO) ---
function classifyRequest(text: string): { rejected: boolean; category: "practico" | "escape" | "atajo" | null } {
    const lower = text.toLowerCase();

    // Consejos / Soluciones
    if (lower.match(/\b(qué hago|que hago|cómo hago|como hago|decime|solucioname|paso a paso|recomendame|dame tips)\b/)) {
        return { rejected: true, category: "practico" };
    }

    // Guía espiritual / Diagnóstico
    if (lower.match(/\b(saname|decime mi destino|diagnosticame|futuro|propósito|proposito)\b/)) {
        return { rejected: true, category: "escape" };
    }

    return { rejected: false, category: null };
}

app.post("/reflect", async (req, res) => {
    const start = Date.now();
    try {
        const text = (req.body?.text || "").toString().trim();
        if (!text) {
            return res.status(400).json({ error: "No text provided" });
        }

        // 1. Clasificación Previa
        const { rejected, category } = classifyRequest(text);

        let reply = "";
        let mode: "model" | "fallback" = "model";

        try {
            // Timeout de 15s para el modelo
            const modelPromise = (async () => {
                let rawAnswer = "";
                let ok = false;

                // Contexto interno si fue clasificado como práctico/escape
                const internalContext = rejected
                    ? `Nota interna: El usuario está pidiendo ${category} (solución/guía). NO respondas la pregunta. Reflejá el mecanismo de búsqueda de respuesta externa.`
                    : "";

                const modelInput = internalContext ? `${internalContext}\n\n${text}` : text;

                for (let attempt = 1; attempt <= 3; attempt++) {
                    rawAnswer = await getCeroLikeResponse(modelInput);
                    // Pasamos 'text' para validación de similitud
                    if (isOutputValid(rawAnswer, text)) {
                        ok = true;
                        break;
                    }
                }
                return ok ? rawAnswer : null;
            })();

            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 15000)
            );

            const result = await Promise.race([modelPromise, timeoutPromise]);

            if (result) {
                reply = result;
            } else {
                throw new Error("Model failed validation");
            }

        } catch (err) {
            console.error("Model error/timeout:", err);
            reply = getFallback();
            mode = "fallback";
        }

        // 2. Validación Dura Final
        reply = reply.trim();
        if (reply.length < 8 || reply === "—" || /^[\W_]+$/.test(reply)) {
            reply = getFallback();
            mode = "fallback";
        }

        const latencyMs = Date.now() - start;
        console.log(`[Request] Mode: ${mode}, Latency: ${latencyMs}ms, Rejected: ${rejected}`);

        return res.json({
            reply,
            rejected,
            category,
            meta: { mode, latencyMs }
        });

    } catch (error) {
        console.error("Critical error:", error);
        return res.status(500).json({
            reply: getFallback(),
            error: "Internal Server Error"
        });
    }
});

app.listen(PORT, () => {
    console.log(`CERO backend listening on port ${PORT}`);
});
