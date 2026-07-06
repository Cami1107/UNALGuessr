import { describe, expect, it } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("empieza vacía", () => {
    const s = new Stack<number>();
    expect(s.size).toBe(0);
    expect(s.isEmpty()).toBe(true);
    expect(s.pop()).toBeUndefined();
    expect(s.peek()).toBeUndefined();
  });

  it("respeta el orden LIFO", () => {
    const s = new Stack<string>();
    s.push("a");
    s.push("b");
    s.push("c");
    expect(s.pop()).toBe("c");
    expect(s.pop()).toBe("b");
    expect(s.pop()).toBe("a");
    expect(s.isEmpty()).toBe(true);
  });

  it("peek muestra el tope sin sacarlo", () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    expect(s.peek()).toBe(2);
    expect(s.size).toBe(2);
  });

  it("modela el historial de deshacer del pin", () => {
    const s = new Stack<{ lat: number; lng: number }>();
    s.push({ lat: 1, lng: 1 }); // primer pin
    s.push({ lat: 2, lng: 2 }); // lo movió
    s.push({ lat: 3, lng: 3 }); // lo volvió a mover
    s.pop(); // deshacer: descarta la posición actual
    expect(s.peek()).toEqual({ lat: 2, lng: 2 }); // vuelve a la anterior
    s.pop();
    s.pop();
    expect(s.isEmpty()).toBe(true); // sin posiciones: el pin desaparece
  });

  it("clear la vacía y puede reutilizarse", () => {
    const s = new Stack<number>();
    s.push(1);
    s.clear();
    expect(s.isEmpty()).toBe(true);
    s.push(9);
    expect(s.peek()).toBe(9);
  });
});
