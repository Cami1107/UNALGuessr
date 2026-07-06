/**
 * Montículo binario mínimo (MinHeap) — cola de prioridad, implementada
 * desde cero. Estructura NO LINEAL: árbol binario completo representado
 * sobre memoria contigua (hijo izquierdo en 2i+1, derecho en 2i+2,
 * padre en (i-1)/2).
 *
 * El respaldo es un array de tamaño fijo usado ÚNICAMENTE como memoria
 * cruda con acceso por índice (misma excepción documentada que la
 * HashTable; ver src/structures/README.md). Cuando se llena, se
 * reasigna al doble copiando índice por índice.
 *
 * Uso en el juego: es la cola de prioridad que Dijkstra (Graph.ts)
 * necesita para expandir siempre el nodo más cercano pendiente.
 */

export interface IPriorityQueue<T> {
  readonly size: number;
  isEmpty(): boolean;
  insert(value: T, priority: number): void;
  extractMin(): T | undefined;
  peekMin(): T | undefined;
  clear(): void;
}

interface NodoHeap<T> {
  valor: T;
  prioridad: number;
}

export class MinHeap<T> implements IPriorityQueue<T> {
  // Memoria cruda: solo acceso por índice, jamás métodos de Array.
  private heap: (NodoHeap<T> | undefined)[];
  private cap: number;
  private count = 0;

  constructor(initialCapacity = 16) {
    if (initialCapacity < 1 || !Number.isInteger(initialCapacity)) {
      throw new RangeError(`Capacidad inicial inválida: ${initialCapacity}`);
    }
    this.cap = initialCapacity;
    this.heap = new Array(this.cap);
  }

  get size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  insert(value: T, priority: number): void {
    if (this.count === this.cap) this.crecer();
    this.heap[this.count] = { valor: value, prioridad: priority };
    this.flotar(this.count);
    this.count++;
  }

  peekMin(): T | undefined {
    return this.heap[0]?.valor;
  }

  extractMin(): T | undefined {
    if (this.count === 0) return undefined;
    const min = this.heap[0]!.valor;
    this.count--;
    this.heap[0] = this.heap[this.count]; // el último sube a la raíz…
    this.heap[this.count] = undefined;
    if (this.count > 0) this.hundir(0); // …y se hunde a su posición
    return min;
  }

  clear(): void {
    this.heap = new Array(this.cap);
    this.count = 0;
  }

  /** Sube el nodo i mientras sea menor que su padre. */
  private flotar(i: number): void {
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (this.heap[padre]!.prioridad <= this.heap[i]!.prioridad) break;
      this.intercambiar(i, padre);
      i = padre;
    }
  }

  /** Baja el nodo i mientras sea mayor que alguno de sus hijos. */
  private hundir(i: number): void {
    for (;;) {
      const izq = 2 * i + 1;
      const der = 2 * i + 2;
      let menor = i;
      if (izq < this.count && this.heap[izq]!.prioridad < this.heap[menor]!.prioridad) {
        menor = izq;
      }
      if (der < this.count && this.heap[der]!.prioridad < this.heap[menor]!.prioridad) {
        menor = der;
      }
      if (menor === i) break;
      this.intercambiar(i, menor);
      i = menor;
    }
  }

  private intercambiar(i: number, j: number): void {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
  }

  private crecer(): void {
    const nuevaCap = this.cap * 2;
    const nuevo: (NodoHeap<T> | undefined)[] = new Array(nuevaCap);
    for (let i = 0; i < this.count; i++) nuevo[i] = this.heap[i];
    this.heap = nuevo;
    this.cap = nuevaCap;
  }
}
