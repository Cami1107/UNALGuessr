import { describe, expect, it } from "vitest";
import { MinHeap } from "./MinHeap";

describe("MinHeap", () => {
  it("empieza vacío", () => {
    const h = new MinHeap<string>();
    expect(h.size).toBe(0);
    expect(h.isEmpty()).toBe(true);
    expect(h.extractMin()).toBeUndefined();
    expect(h.peekMin()).toBeUndefined();
  });

  it("extrae siempre el de menor prioridad", () => {
    const h = new MinHeap<string>();
    h.insert("c", 30);
    h.insert("a", 10);
    h.insert("d", 40);
    h.insert("b", 20);
    expect(h.extractMin()).toBe("a");
    expect(h.extractMin()).toBe("b");
    expect(h.extractMin()).toBe("c");
    expect(h.extractMin()).toBe("d");
    expect(h.isEmpty()).toBe(true);
  });

  it("peekMin muestra sin extraer", () => {
    const h = new MinHeap<number>();
    h.insert(7, 7);
    h.insert(3, 3);
    expect(h.peekMin()).toBe(3);
    expect(h.size).toBe(2);
  });

  it("soporta prioridades duplicadas", () => {
    const h = new MinHeap<string>();
    h.insert("x", 5);
    h.insert("y", 5);
    h.insert("z", 1);
    expect(h.extractMin()).toBe("z");
    const dos = [h.extractMin(), h.extractMin()];
    expect(dos.sort()).toEqual(["x", "y"]);
  });

  it("crece más allá de la capacidad inicial y ordena correctamente", () => {
    const h = new MinHeap<number>(2);
    const n = 200;
    // inserción en orden pseudoaleatorio determinista
    for (let i = 0; i < n; i++) h.insert((i * 37) % n, (i * 37) % n);
    expect(h.size).toBe(n);
    for (let esperado = 0; esperado < n; esperado++) {
      expect(h.extractMin()).toBe(esperado);
    }
  });

  it("operaciones intercaladas mantienen el invariante", () => {
    const h = new MinHeap<number>();
    h.insert(5, 5);
    h.insert(1, 1);
    expect(h.extractMin()).toBe(1);
    h.insert(3, 3);
    h.insert(0, 0);
    expect(h.extractMin()).toBe(0);
    expect(h.extractMin()).toBe(3);
    expect(h.extractMin()).toBe(5);
  });

  it("clear lo vacía y puede reutilizarse", () => {
    const h = new MinHeap<number>();
    h.insert(1, 1);
    h.clear();
    expect(h.isEmpty()).toBe(true);
    h.insert(9, 9);
    expect(h.peekMin()).toBe(9);
  });

  it("capacidad inicial inválida lanza error", () => {
    expect(() => new MinHeap(0)).toThrow(RangeError);
    expect(() => new MinHeap(2.5)).toThrow(RangeError);
  });
});
