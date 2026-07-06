import { LinkedList } from "./LinkedList";

/**
 * Cola FIFO (estructura LINEAL), construida SOBRE nuestra LinkedList.
 * Encolar al final y desencolar al frente son O(1) gracias a los
 * punteros de cabeza y cola de la lista.
 *
 * Uso en el juego: la secuencia de rondas de una partida — se encolan
 * al crearla y se consumen una a una en orden.
 */

export interface IQueue<T> {
  readonly size: number;
  isEmpty(): boolean;
  enqueue(value: T): void;
  dequeue(): T | undefined;
  peek(): T | undefined;
  clear(): void;
}

export class Queue<T> implements IQueue<T> {
  private lista = new LinkedList<T>();

  get size(): number {
    return this.lista.size;
  }

  isEmpty(): boolean {
    return this.lista.isEmpty();
  }

  enqueue(value: T): void {
    this.lista.addLast(value);
  }

  dequeue(): T | undefined {
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
