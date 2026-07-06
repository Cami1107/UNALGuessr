import { describe, expect, it } from "vitest";
import { HashTable } from "./HashTable";

describe("HashTable", () => {
  it("set y get básicos", () => {
    const t = new HashTable<string, number>();
    t.set("a", 1);
    t.set("b", 2);
    expect(t.get("a")).toBe(1);
    expect(t.get("b")).toBe(2);
    expect(t.get("c")).toBeUndefined();
    expect(t.size).toBe(2);
  });

  it("set sobre llave existente actualiza sin crecer", () => {
    const t = new HashTable<string, number>();
    t.set("a", 1);
    t.set("a", 99);
    expect(t.get("a")).toBe(99);
    expect(t.size).toBe(1);
  });

  it("has y delete", () => {
    const t = new HashTable<string, string>();
    t.set("x", "y");
    expect(t.has("x")).toBe(true);
    expect(t.delete("x")).toBe(true);
    expect(t.has("x")).toBe(false);
    expect(t.get("x")).toBeUndefined();
    expect(t.delete("x")).toBe(false);
    expect(t.size).toBe(0);
  });

  it("sobrevive colisiones y rehash con muchas llaves", () => {
    const t = new HashTable<string, number>(2); // capacidad mínima para forzar colisiones
    for (let i = 0; i < 200; i++) t.set(`llave-${i}`, i);
    expect(t.size).toBe(200);
    expect(t.capacity).toBeGreaterThan(2); // hubo rehash
    for (let i = 0; i < 200; i++) expect(t.get(`llave-${i}`)).toBe(i);
  });

  it("delete funciona después del rehash", () => {
    const t = new HashTable<string, number>(2);
    for (let i = 0; i < 50; i++) t.set(`k${i}`, i);
    expect(t.delete("k25")).toBe(true);
    expect(t.get("k25")).toBeUndefined();
    expect(t.size).toBe(49);
  });

  it("es correcta incluso si TODAS las llaves colisionan (hasher constante)", () => {
    const t = new HashTable<string, number>(4, () => 7);
    for (let i = 0; i < 30; i++) t.set(`c${i}`, i);
    expect(t.size).toBe(30);
    for (let i = 0; i < 30; i++) expect(t.get(`c${i}`)).toBe(i);
    expect(t.delete("c15")).toBe(true);
    expect(t.size).toBe(29);
  });

  it("keys, values y entries devuelven todo el contenido", () => {
    const t = new HashTable<string, number>();
    t.set("uno", 1);
    t.set("dos", 2);
    t.set("tres", 3);
    expect([...t.keys()].sort()).toEqual(["dos", "tres", "uno"]);
    expect([...t.values()].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(t.entries().size).toBe(3);
  });

  it("acepta llaves numéricas", () => {
    const t = new HashTable<number, string>();
    t.set(42, "respuesta");
    t.set(7, "siete");
    expect(t.get(42)).toBe("respuesta");
    expect(t.get(7)).toBe("siete");
    expect(t.has(8)).toBe(false);
  });

  it("clear vacía la tabla", () => {
    const t = new HashTable<string, number>();
    t.set("a", 1);
    t.clear();
    expect(t.size).toBe(0);
    expect(t.get("a")).toBeUndefined();
    t.set("b", 2);
    expect(t.get("b")).toBe(2);
  });

  it("rechaza llaves no primitivas sin hasher propio", () => {
    const t = new HashTable<object, number>();
    expect(() => t.set({}, 1)).toThrow(TypeError);
  });

  it("capacidad inicial inválida lanza error", () => {
    expect(() => new HashTable(0)).toThrow(RangeError);
    expect(() => new HashTable(1.5)).toThrow(RangeError);
  });
});
