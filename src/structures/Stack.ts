import { LinkedList } from "./LinkedList";

/**
 * Pila LIFO (estructura LINEAL), construida SOBRE nuestra LinkedList.
 * push, pop y peek operan sobre la cabeza de la lista: todos O(1).
 *
 * Uso en el juego: historial de posiciones del pin en el minimapa,
 * para poder DESHACER la última colocación.
 */

export interface IStack<T> {
  readonly size: number;
  isEmpty(): boolean;
  push(value: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  clear(): void;
}

export class Stack<T> implements IStack<T> {
  private lista = new LinkedList<T>();

  get size(): number {
    return this.lista.size;
  }

  isEmpty(): boolean {
    return this.lista.isEmpty();
  }

  push(value: T): void {
    this.lista.addFirst(value);
  }

  pop(): T | undefined {
    return this.lista.removeFirst();
  }

  peek(): T | undefined {
    return this.lista.get(0);
  }

  clear(): void {
    this.lista.clear();
  }

  toString(): string {
    return this.lista.toString();
  }
}
