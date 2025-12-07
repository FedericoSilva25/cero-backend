// src/core/rejections.ts

const REJECTIONS = [
  "No respondo lo práctico. ¿Qué aparece cuando buscás resolver desde acá?",
  "Solo reflejo lo que aparece.",
  "Eso no entra en mí."
];

export function getRandomRejection(): string {
  const idx = Math.floor(Math.random() * REJECTIONS.length);
  return REJECTIONS[idx];
}
