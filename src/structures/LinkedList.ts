/**
 * Lista enlazada simple (estructura LINEAL), implementada desde cero.
 *
 * No usa Array, Map ni Set: solo nodos encadenados por referencias.
 * Mantiene punteros a cabeza y cola para que addFirst, addLast y
 * removeFirst sean O(1). removeLast es O(n) porque en una lista simple
 * hay que recorrer hasta el penúltimo nodo.
 */

export interface IList<T> extends Iterable<T> {
  readonly size: number;
  isEmpty(): boolean;
  addFirst(value: T): void;
  addLast(value: T): void;
  insertAt(index: number, value: T): void;
  removeFirst(): T | undefined;
  removeLast(): T | undefined;
  removeAt(index: number): T;
  /** Elimina el primer elemento que cumpla el predicado. */
  removeWhere(pred: (value: T) => boolean): boolean;
  get(index: number): T | undefined;
  /** Devuelve el primer elemento que cumpla el predicado. */
  find(pred: (value: T) => boolean): T | undefined;
  indexOf(value: T): number;
  contains(value: T): boolean;
  clear(): void;
}

class Node<T> {
  constructor(
    public value: T,
    public next: Node<T> | null = null
  ) {}
}

export class LinkedList<T> implements IList<T> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;
  private length = 0;

  get size(): number {
    return this.length;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  addFirst(value: T): void {
    const node = new Node(value, this.head);
    this.head = node;
    if (!this.tail) this.tail = node;
    this.length++;
  }

  addLast(value: T): void {
    const node = new Node(value);
    if (this.tail) {
      this.tail.next = node;
      this.tail = node;
    } else {
      this.head = this.tail = node;
    }
    this.length++;
  }

  insertAt(index: number, value: T): void {
    if (index < 0 || index > this.length) {
      throw new RangeError(`Índice fuera de rango: ${index} (tamaño ${this.length})`);
    }
    if (index === 0) return this.addFirst(value);
    if (index === this.length) return this.addLast(value);
    const prev = this.nodeAt(index - 1)!;
    prev.next = new Node(value, prev.next);
    this.length++;
  }

  removeFirst(): T | undefined {
    if (!this.head) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.length--;
    return value;
  }

  removeLast(): T | undefined {
    if (!this.head) return undefined;
    if (this.head === this.tail) return this.removeFirst();
    let cur = this.head;
    while (cur.next !== this.tail) cur = cur.next!;
    const value = this.tail!.value;
    cur.next = null;
    this.tail = cur;
    this.length--;
    return value;
  }

  removeAt(index: number): T {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Índice fuera de rango: ${index} (tamaño ${this.length})`);
    }
    if (index === 0) return this.removeFirst()!;
    const prev = this.nodeAt(index - 1)!;
    const target = prev.next!;
    prev.next = target.next;
    if (target === this.tail) this.tail = prev;
    this.length--;
    return target.value;
  }

  removeWhere(pred: (value: T) => boolean): boolean {
    let prev: Node<T> | null = null;
    let cur = this.head;
    while (cur) {
      if (pred(cur.value)) {
        if (prev) prev.next = cur.next;
        else this.head = cur.next;
        if (cur === this.tail) this.tail = prev;
        this.length--;
        return true;
      }
      prev = cur;
      cur = cur.next;
    }
    return false;
  }

  get(index: number): T | undefined {
    return this.nodeAt(index)?.value;
  }

  find(pred: (value: T) => boolean): T | undefined {
    let cur = this.head;
    while (cur) {
      if (pred(cur.value)) return cur.value;
      cur = cur.next;
    }
    return undefined;
  }

  indexOf(value: T): number {
    let cur = this.head;
    let i = 0;
    while (cur) {
      if (cur.value === value) return i;
      cur = cur.next;
      i++;
    }
    return -1;
  }

  contains(value: T): boolean {
    return this.indexOf(value) !== -1;
  }

  clear(): void {
    this.head = this.tail = null;
    this.length = 0;
  }

  /** Iterador escrito a mano (sin generadores) para for..of. */
  [Symbol.iterator](): Iterator<T> {
    let cur = this.head;
    return {
      next: (): IteratorResult<T> => {
        if (!cur) return { done: true, value: undefined as unknown as T };
        const value = cur.value;
        cur = cur.next;
        return { done: false, value };
      },
    };
  }

  toString(): string {
    let s = "";
    for (const v of this) s += (s ? " -> " : "") + String(v);
    return `[${s}]`;
  }

  private nodeAt(index: number): Node<T> | null {
    if (index < 0 || index >= this.length) return null;
    let cur = this.head;
    for (let i = 0; i < index; i++) cur = cur!.next;
    return cur;
  }
}
