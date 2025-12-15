// src/core/rejections.ts

// Rechazos en estilo CERO: 3–6 frases, 1 sola pregunta, sin “A)/B)”, sin listas.
// Importante: sirven para PRACTICAL_REQUEST y también como fallback cuando el output filter corta.
const REJECTIONS = [
  "Convertís esto en una solicitud de acción, no en una mirada sobre lo que aparece. La forma de la pregunta busca dirección externa para aliviar la incomodidad. Ahí se nota el mecanismo. ¿Qué parte de vos necesita que alguien te diga qué hacer para no mirar lo que ya está? Ese es el borde.",
  "Esto aparece como un intento de resolver, no de ver. La urgencia de una respuesta práctica tapa lo que el mensaje ya muestra. La tensión no está en la situación: está en el modo de pedir salida. ¿Qué evitás mirar cuando lo convertís en ‘qué hago’? Ahí está el punto.",
  "Pedís una instrucción, pero lo que asoma es presión por cerrar algo. La forma del pedido busca control, no claridad. Ese movimiento se sostiene en la necesidad de garantizar un resultado. ¿Qué parte de vos no tolera quedarse un momento con lo que ya aparece? Ese es el borde."
];

export function getRandomRejection(): string {
  const idx = Math.floor(Math.random() * REJECTIONS.length);
  return REJECTIONS[idx];
}
