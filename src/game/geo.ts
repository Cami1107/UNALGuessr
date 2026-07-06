import type { LinkedList } from "../structures/LinkedList";

export interface Coordenada {
  lat: number;
  lng: number;
}

/** Distancia en metros sobre la esfera terrestre (fórmula de Haversine). */
export function haversine(a: Coordenada, b: Coordenada): number {
  const R = 6371000; // radio de la Tierra en metros
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Ray casting: lanza un rayo horizontal desde el punto y cuenta cuántos
 * lados del polígono cruza; un número impar significa que está adentro.
 * El polígono son los vértices del perímetro guardados en nuestra
 * LinkedList (se acepta anillo abierto o cerrado).
 */
export function dentroDePoligono(p: Coordenada, poligono: LinkedList<Coordenada>): boolean {
  let dentro = false;
  let primero: Coordenada | null = null;
  let prev: Coordenada | null = null;

  for (const v of poligono) {
    if (prev) {
      if (cruzaLado(p, prev, v)) dentro = !dentro;
    } else {
      primero = v;
    }
    prev = v;
  }
  // Cerrar el anillo (último -> primero) si el dato no venía cerrado
  if (prev && primero && (prev.lat !== primero.lat || prev.lng !== primero.lng)) {
    if (cruzaLado(p, prev, primero)) dentro = !dentro;
  }
  return dentro;
}

function cruzaLado(p: Coordenada, a: Coordenada, b: Coordenada): boolean {
  return (
    (a.lat > p.lat) !== (b.lat > p.lat) &&
    p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng
  );
}
