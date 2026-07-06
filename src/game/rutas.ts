import { Graph } from "../structures/Graph";
import { HashTable } from "../structures/HashTable";
import { LinkedList } from "../structures/LinkedList";
import { haversine, type Coordenada } from "./geo";
import senderosJson from "../data/senderos.json";

/**
 * Red de senderos del campus: un GRAFO (nuestro, con Dijkstra + MinHeap)
 * cuyos vértices son puntos de los caminos de OpenStreetMap y cuyas
 * aristas son tramos caminables ponderados por su longitud en metros
 * (calculada con nuestra Haversine al cargar).
 *
 * Con esto el juego puntúa por la distancia CAMINANDO entre la
 * adivinanza y el lugar real, no en línea recta.
 */

export interface RutaCaminando {
  distanciaM: number;
  camino: LinkedList<Coordenada>; // adivinanza -> nodos del sendero -> lugar real
}

export class RedDeSenderos {
  readonly grafo = new Graph<number>();
  private readonly coords = new HashTable<number, Coordenada>(2048);

  get numNodos(): number {
    return this.coords.size;
  }

  get numTramos(): number {
    return this.grafo.edgeCount;
  }

  agregarNodo(id: number, c: Coordenada): void {
    this.coords.set(id, c);
    this.grafo.addVertex(id);
  }

  /** El peso del tramo es la distancia real en metros entre sus nodos. */
  agregarTramo(a: number, b: number): void {
    const ca = this.coords.get(a);
    const cb = this.coords.get(b);
    if (!ca || !cb) throw new Error(`Tramo con nodo desconocido: ${a}-${b}`);
    this.grafo.addEdge(a, b, haversine(ca, cb));
  }

  coordenadaDe(id: number): Coordenada | undefined {
    return this.coords.get(id);
  }

  /** Nodo de la red más cercano al punto (búsqueda lineal, ~1300 nodos). */
  nodoMasCercano(p: Coordenada): number | null {
    let mejor: number | null = null;
    let mejorDist = Infinity;
    for (const e of this.coords.entries()) {
      const d = haversine(p, e.value);
      if (d < mejorDist) {
        mejorDist = d;
        mejor = e.key;
      }
    }
    return mejor;
  }

  /**
   * Ruta caminando entre dos puntos arbitrarios: cada punto se "engancha"
   * a su nodo más cercano y Dijkstra hace el resto. La distancia total
   * incluye los dos tramos de enganche. Devuelve null si la red está
   * vacía o los nodos no se conectan (el juego cae a línea recta).
   */
  rutaCaminando(desde: Coordenada, hasta: Coordenada): RutaCaminando | null {
    const na = this.nodoMasCercano(desde);
    const nb = this.nodoMasCercano(hasta);
    if (na === null || nb === null) return null;

    const r = this.grafo.dijkstra(na, nb);
    if (!r) return null;

    const camino = new LinkedList<Coordenada>();
    camino.addLast(desde);
    for (const id of r.path) camino.addLast(this.coords.get(id)!);
    camino.addLast(hasta);

    const distanciaM =
      haversine(desde, this.coords.get(na)!) +
      r.distance +
      haversine(this.coords.get(nb)!, hasta);
    return { distanciaM, camino };
  }
}

/**
 * Frontera de datos: senderos.json (generado desde OSM, ya filtrado al
 * perímetro y a la componente conexa mayor) llega como arrays del
 * parser; aquí se vuelca de inmediato a nuestras estructuras.
 */
export function cargarRedDeSenderos(): RedDeSenderos {
  const red = new RedDeSenderos();
  for (const [id, lat, lng] of senderosJson.nodes as [number, number, number][]) {
    red.agregarNodo(id, { lat, lng });
  }
  for (const [a, b] of senderosJson.edges as [number, number][]) {
    red.agregarTramo(a, b);
  }
  return red;
}
