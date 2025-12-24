// src/core/rejections.ts

// Rechazos en estilo CERO: 3–6 frases, 1 sola pregunta, sin “A)/B)”, sin listas.
// Importante: sirven para PRACTICAL_REQUEST y también como fallback cuando el output filter corta.
const REJECTIONS = [
  "El pedido de dirección es el mecanismo.",
  "Buscás afuera para no mirar el borde.",
  "No hay respuesta práctica.",
  "La urgencia por resolver tapa lo que aparece.",
  "Ahí está el intento de control.",
  "No resuelvo.",
  "El movimiento es hacia afuera. El borde es hacia adentro.",
  "Pedís instrucciones para no sentir la duda.",
  "—",
  "Silencio."
];

export function getRandomRejection(): string {
  const idx = Math.floor(Math.random() * REJECTIONS.length);
  return REJECTIONS[idx];
}
