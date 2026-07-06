import { HashTable } from "./HashTable";
import { LinkedList } from "./LinkedList";
import { MinHeap } from "./MinHeap";

/**
 * GRAFO no dirigido y ponderado, implementado desde cero como lista de
 * adyacencia construida con nuestras propias estructuras:
 *
 *   HashTable<V, LinkedList<Arista<V>>>
 *   (vértice -> lista de aristas salientes)
 *
 * Incluye Dijkstra usando nuestro MinHeap como cola de prioridad
 * (con eliminación perezosa: un vértice puede entrar varias veces al
 * montículo; al extraerlo se ignora si ya fue finalizado).
 *
 * Uso en el juego: la red de senderos del campus — vértices = puntos
 * de los caminos, aristas = tramos caminables con su longitud en
 * metros. Dijkstra calcula la distancia CAMINANDO entre la adivinanza
 * y el lugar real.
 */

export interface Arista<V> {
  to: V;
  weight: number;
}

export interface RutaMasCorta<V> {
  distance: number;
  path: LinkedList<V>;
}

export interface IGraph<V> {
  readonly vertexCount: number;
  readonly edgeCount: number;
  addVertex(v: V): void;
  hasVertex(v: V): boolean;
  addEdge(a: V, b: V, weight: number): void;
  neighbors(v: V): LinkedList<Arista<V>>;
  vertices(): LinkedList<V>;
  dijkstra(from: V, to: V): RutaMasCorta<V> | null;
}

export class Graph<V extends string | number> implements IGraph<V> {
  private ady = new HashTable<V, LinkedList<Arista<V>>>();
  private numAristas = 0;

  get vertexCount(): number {
    return this.ady.size;
  }

  get edgeCount(): number {
    return this.numAristas;
  }

  addVertex(v: V): void {
    if (!this.ady.has(v)) this.ady.set(v, new LinkedList<Arista<V>>());
  }

  hasVertex(v: V): boolean {
    return this.ady.has(v);
  }

  /**
   * Agrega (o actualiza) la arista a<->b. Crea los vértices si no
   * existen. Los lazos (a === b) se ignoran: no aportan nada a una
   * red de caminos.
   */
  addEdge(a: V, b: V, weight: number): void {
    if (weight < 0) {
      throw new RangeError(`Peso negativo no permitido (Dijkstra lo requiere): ${weight}`);
    }
    if (a === b) return;
    this.addVertex(a);
    this.addVertex(b);
    const listaA = this.ady.get(a)!;
    const existente = listaA.find((e) => e.to === b);
    if (existente) {
      existente.weight = weight;
      this.ady.get(b)!.find((e) => e.to === a)!.weight = weight;
      return;
    }
    listaA.addLast({ to: b, weight });
    this.ady.get(b)!.addLast({ to: a, weight });
    this.numAristas++;
  }

  /** Aristas salientes de v (lista interna: no mutar desde afuera). */
  neighbors(v: V): LinkedList<Arista<V>> {
    return this.ady.get(v) ?? new LinkedList<Arista<V>>();
  }

  vertices(): LinkedList<V> {
    return this.ady.keys();
  }

  /**
   * Camino más corto de from a to. Devuelve null si alguno no existe
   * o si to es inalcanzable. path incluye ambos extremos, en orden.
   */
  dijkstra(from: V, to: V): RutaMasCorta<V> | null {
    if (!this.hasVertex(from) || !this.hasVertex(to)) return null;

    const dist = new HashTable<V, number>();
    const prev = new HashTable<V, V>();
    const finalizado = new HashTable<V, boolean>();
    const pendientes = new MinHeap<V>(); // nuestra cola de prioridad

    dist.set(from, 0);
    pendientes.insert(from, 0);

    while (!pendientes.isEmpty()) {
      const u = pendientes.extractMin()!;
      if (finalizado.has(u)) continue; // entrada perezosa obsoleta
      finalizado.set(u, true);
      if (u === to) break; // la distancia a `to` ya es definitiva

      const du = dist.get(u)!;
      for (const arista of this.neighbors(u)) {
        if (finalizado.has(arista.to)) continue;
        const nuevaDist = du + arista.weight;
        const distActual = dist.get(arista.to);
        if (distActual === undefined || nuevaDist < distActual) {
          dist.set(arista.to, nuevaDist);
          prev.set(arista.to, u);
          pendientes.insert(arista.to, nuevaDist);
        }
      }
    }

    const distancia = dist.get(to);
    if (distancia === undefined) return null; // inalcanzable

    // Reconstruir el camino caminando hacia atrás por `prev`
    const path = new LinkedList<V>();
    let actual: V | undefined = to;
    while (actual !== undefined && actual !== from) {
      path.addFirst(actual);
      actual = prev.get(actual);
    }
    path.addFirst(from);
    return { distance: distancia, path };
  }
}
