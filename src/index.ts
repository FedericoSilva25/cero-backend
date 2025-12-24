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

app.post("/reflect", async (req, res) => {
    try {
        const text = (req.body?.text || "").toString().trim();

        if (!text) {
            return res.json({
                reply: "No hay nada dicho todavía: aparece vacío en la forma. La ausencia de contenido también es un movimiento. La pregunta es qué intentás evitar diciendo nada. ¿Qué aparece si escribís la frase tal como aparece en vos, sin corregir? Ese es el borde.",
                rejected: true,
                category: "EMPTY"
            });
        }

        // 1) Filtro de entrada: clasificamos pero NO cortamos
        const { isPractical } = classifyInput(text);

        // Contexto interno para el modelo (invisible al usuario)
        const internalContext = isPractical
            ? "Nota interna: el usuario está pidiendo utilidad/acción. No resolver. Reflejar el impulso de delegar dirección."
            : "";

        const modelInput = internalContext
            ? `${internalContext}\n\nTexto del usuario:\n${text}`
            : text;

        // 2) Llamada al modelo real de CERO (OpenAI) con reintentos
        let rawAnswer = "";
        let ok = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            rawAnswer = await getCeroLikeResponse(modelInput);

            if (isOutputValid(rawAnswer)) {
                ok = true;
                break;
            }
        }

        // 3) Si el modelo no logró pasar el filtro, devolvemos fallback CERO válido
        if (!ok) {
            return res.json({
                reply: getRandomRejection(),
                rejected: true,
                category: "OUTPUT_FILTER"
            });
        }

        // 4) Respuesta válida
        return res.json({
            reply: rawAnswer,
            rejected: false,
            category: null
        });
    } catch (e) {
        console.error("[CERO] Error en /reflect:", e);
        return res.json({
            reply: "No hubo devolución.",
            rejected: true,
            category: "ERROR"
        });
    }
});

app.listen(PORT, () => {
    console.log(`CERO backend listening on port ${PORT}`);
});
