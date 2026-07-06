import { HashTable } from "./structures/HashTable";
import { LinkedList } from "./structures/LinkedList";
import { dentroDePoligono, type Coordenada } from "./game/geo";
import lugaresJson from "./data/lugares.json";
import perimetroJson from "./data/perimetro.json";

export interface CampusLocation {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
}

/*
 * Frontera de datos: los JSON (generados desde OpenStreetMap) llegan como
 * arrays nativos del parser. Aquí se convierten DE INMEDIATO a nuestras
 * estructuras propias y el resto del código solo trabaja con ellas.
 */

/** Perímetro del campus (Ciudad Universitaria) como lista enlazada de vértices. */
export function cargarPerimetro(): LinkedList<Coordenada> {
  const perimetro = new LinkedList<Coordenada>();
  for (const p of perimetroJson) perimetro.addLast({ lat: p.lat, lng: p.lng });
  return perimetro;
}

/**
 * Banco de lugares en nuestra tabla hash: id -> lugar, búsqueda O(1).
 * Solo se admiten lugares estrictamente dentro del perímetro.
 */
export function cargarLugares(
  perimetro: LinkedList<Coordenada>
): HashTable<string, CampusLocation> {
  const lugares = new HashTable<string, CampusLocation>(128);
  for (const l of lugaresJson) {
    if (!dentroDePoligono({ lat: l.lat, lng: l.lng }, perimetro)) continue;
    lugares.set(l.id, { id: l.id, nombre: l.nombre, lat: l.lat, lng: l.lng });
  }
  return lugares;
}
