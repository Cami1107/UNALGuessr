import { describe, expect, it } from "vitest";
import { LinkedList } from "./LinkedList";

describe("LinkedList", () => {
  it("empieza vacía", () => {
    const l = new LinkedList<number>();
    expect(l.size).toBe(0);
    expect(l.isEmpty()).toBe(true);
    expect(l.removeFirst()).toBeUndefined();
    expect(l.removeLast()).toBeUndefined();
    expect(l.get(0)).toBeUndefined();
  });

  it("addFirst y addLast mantienen el orden", () => {
    const l = new LinkedList<number>();
    l.addLast(2);
    l.addLast(3);
    l.addFirst(1);
    expect([...l]).toEqual([1, 2, 3]);
    expect(l.size).toBe(3);
    expect(l.get(0)).toBe(1);
    expect(l.get(2)).toBe(3);
  });

  it("insertAt inserta en extremos y en medio", () => {
    const l = new LinkedList<string>();
    l.insertAt(0, "b");
    l.insertAt(0, "a");
    l.insertAt(2, "d");
    l.insertAt(2, "c");
    expect([...l]).toEqual(["a", "b", "c", "d"]);
  });

  it("insertAt y removeAt rechazan índices inválidos", () => {
    const l = new LinkedList<number>();
    l.addLast(1);
    expect(() => l.insertAt(-1, 0)).toThrow(RangeError);
    expect(() => l.insertAt(3, 0)).toThrow(RangeError);
    expect(() => l.removeAt(1)).toThrow(RangeError);
    expect(() => l.removeAt(-1)).toThrow(RangeError);
  });

  it("removeFirst y removeLast actualizan cabeza y cola", () => {
    const l = new LinkedList<number>();
    l.addLast(1);
    l.addLast(2);
    l.addLast(3);
    expect(l.removeFirst()).toBe(1);
    expect(l.removeLast()).toBe(3);
    expect([...l]).toEqual([2]);
    expect(l.removeLast()).toBe(2);
    expect(l.isEmpty()).toBe(true);
    // tras vaciarse debe poder volver a crecer (tail quedó bien)
    l.addLast(9);
    expect([...l]).toEqual([9]);
  });

  it("removeAt elimina en cualquier posición", () => {
    const l = new LinkedList<number>();
    for (const n of [10, 20, 30, 40]) l.addLast(n);
    expect(l.removeAt(1)).toBe(20);
    expect(l.removeAt(0)).toBe(10);
    expect(l.removeAt(1)).toBe(40); // era el último: tail debe retroceder
    l.addLast(50);
    expect([...l]).toEqual([30, 50]);
  });

  it("find, removeWhere, indexOf y contains", () => {
    const l = new LinkedList<number>();
    for (const n of [5, 6, 7, 8]) l.addLast(n);
    expect(l.find((v) => v > 6)).toBe(7);
    expect(l.find((v) => v > 100)).toBeUndefined();
    expect(l.indexOf(7)).toBe(2);
    expect(l.indexOf(99)).toBe(-1);
    expect(l.contains(8)).toBe(true);
    expect(l.removeWhere((v) => v % 2 === 0)).toBe(true); // elimina el 6
    expect([...l]).toEqual([5, 7, 8]);
    expect(l.removeWhere((v) => v === 999)).toBe(false);
  });

  it("clear vacía la lista", () => {
    const l = new LinkedList<number>();
    l.addLast(1);
    l.addLast(2);
    l.clear();
    expect(l.size).toBe(0);
    expect([...l]).toEqual([]);
    l.addLast(3);
    expect([...l]).toEqual([3]);
  });

  it("es iterable con for..of", () => {
    const l = new LinkedList<number>();
    for (const n of [1, 2, 3]) l.addLast(n);
    let suma = 0;
    for (const v of l) suma += v;
    expect(suma).toBe(6);
  });

  it("toString muestra los elementos encadenados", () => {
    const l = new LinkedList<number>();
    l.addLast(1);
    l.addLast(2);
    expect(l.toString()).toBe("[1 -> 2]");
  });
});
