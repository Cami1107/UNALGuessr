import { LinkedList } from "./LinkedList";

/**
 * Tabla HASH con encadenamiento (separate chaining), implementada desde cero.
 *
 * - Cada bucket es una LinkedList propia (src/structures/LinkedList.ts).
 * - El respaldo es un array de tamaño fijo usado ÚNICAMENTE como memoria
 *   cruda con acceso por índice — el equivalente a `new Object[n]` en Java.
 *   Nunca se invocan sus métodos (push, map, etc.). Excepción documentada
 *   en src/structures/README.md.
 * - Función hash por defecto: FNV-1a de 32 bits sobre la representación
 *   en texto de la llave (llaves primitivas). Para llaves complejas se
 *   puede inyectar un hasher propio por el constructor.
 * - Rehash automático: al superar el factor de carga 0.75 se duplica la
 *   capacidad y se reinsertan todas las entradas.
 */

export interface Entry<K, V> {
  readonly key: K;
  value: V;
}

export type Hasher<K> = (key: K) => number;

export interface IHashTable<K, V> {
  readonly size: number;
  readonly capacity: number;
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  keys(): LinkedList<K>;
  values(): LinkedList<V>;
  entries(): LinkedList<Entry<K, V>>;
}

/** FNV-1a de 32 bits: rápido y con buena dispersión para texto. */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function defaultHasher(key: unknown): number {
  const t = typeof key;
  if (t === "string") return hashString(key as string);
  if (t === "number" || t === "boolean" || t === "bigint") return hashString(String(key));
  throw new TypeError(
    "HashTable: para llaves no primitivas debes proveer un hasher en el constructor"
  );
}

export class HashTable<K, V> implements IHashTable<K, V> {
  private static readonly LOAD_FACTOR = 0.75;

  // Memoria cruda: solo acceso por índice, jamás métodos de Array.
  private buckets: (LinkedList<Entry<K, V>> | undefined)[];
  private cap: number;
  private count = 0;
  private readonly hasher: Hasher<K>;

  constructor(initialCapacity = 16, hasher: Hasher<K> = defaultHasher as Hasher<K>) {
    if (initialCapacity < 1 || !Number.isInteger(initialCapacity)) {
      throw new RangeError(`Capacidad inicial inválida: ${initialCapacity}`);
    }
    this.cap = initialCapacity;
    this.buckets = new Array(this.cap);
    this.hasher = hasher;
  }

  get size(): number {
    return this.count;
  }

  get capacity(): number {
    return this.cap;
  }

  set(key: K, value: V): void {
    const i = this.indexFor(key);
    let bucket = this.buckets[i];
    if (!bucket) {
      bucket = new LinkedList<Entry<K, V>>();
      this.buckets[i] = bucket;
    }
    const existente = bucket.find((e) => e.key === key);
    if (existente) {
      existente.value = value;
      return;
    }
    bucket.addLast({ key, value });
    this.count++;
    if (this.count / this.cap > HashTable.LOAD_FACTOR) {
      this.rehash(this.cap * 2);
    }
  }

  get(key: K): V | undefined {
    return this.buckets[this.indexFor(key)]?.find((e) => e.key === key)?.value;
  }

  has(key: K): boolean {
    return this.buckets[this.indexFor(key)]?.find((e) => e.key === key) !== undefined;
  }

  delete(key: K): boolean {
    const bucket = this.buckets[this.indexFor(key)];
    if (bucket?.removeWhere((e) => e.key === key)) {
      this.count--;
      return true;
    }
    return false;
  }

  clear(): void {
    this.buckets = new Array(this.cap);
    this.count = 0;
  }

  entries(): LinkedList<Entry<K, V>> {
    const out = new LinkedList<Entry<K, V>>();
    for (let i = 0; i < this.cap; i++) {
      const bucket = this.buckets[i];
      if (bucket) for (const e of bucket) out.addLast(e);
    }
    return out;
  }

  keys(): LinkedList<K> {
    const out = new LinkedList<K>();
    for (const e of this.entries()) out.addLast(e.key);
    return out;
  }

  values(): LinkedList<V> {
    const out = new LinkedList<V>();
    for (const e of this.entries()) out.addLast(e.value);
    return out;
  }

  private indexFor(key: K): number {
    return (this.hasher(key) >>> 0) % this.cap;
  }

  private rehash(nuevaCapacidad: number): void {
    const viejas = this.entries();
    this.cap = nuevaCapacidad;
    this.buckets = new Array(this.cap);
    this.count = 0;
    for (const e of viejas) this.set(e.key, e.value);
  }
}
