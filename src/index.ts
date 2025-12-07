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
                reply: "Eso no entra en mí.",
                rejected: true,
                category: "EMPTY"
            });
        }

        // 1) Filtro de entrada: corta lo práctico
        const { isPractical, category } = classifyInput(text);
        if (isPractical) {
            return res.json({
                reply: getRandomRejection(),
                rejected: true,
                category
            });
        }

        // 2) Llamada al modelo real de CERO (OpenAI)
        const rawAnswer = await getCeroLikeResponse(text);

        // 3) Filtro de salida: corta si el modelo se "porta mal"
        if (!isOutputValid(rawAnswer)) {
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
            reply: "Error de conexión.",
            rejected: true,
            category: "ERROR"
        });
    }
});

app.listen(PORT, () => {
    console.log(`CERO backend listening on port ${PORT}`);
});
