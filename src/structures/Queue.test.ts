import { describe, expect, it } from "vitest";
import { Queue } from "./Queue";

describe("Queue", () => {
  it("empieza vacía", () => {
    const q = new Queue<number>();
    expect(q.size).toBe(0);
    expect(q.isEmpty()).toBe(true);
    expect(q.dequeue()).toBeUndefined();
    expect(q.peek()).toBeUndefined();
  });

  it("respeta el orden FIFO", () => {
    const q = new Queue<string>();
    q.enqueue("a");
    q.enqueue("b");
    q.enqueue("c");
    expect(q.dequeue()).toBe("a");
    expect(q.dequeue()).toBe("b");
    expect(q.dequeue()).toBe("c");
    expect(q.isEmpty()).toBe(true);
  });

  it("peek muestra el frente sin sacarlo", () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    expect(q.peek()).toBe(1);
    expect(q.size).toBe(2);
  });

  it("soporta operaciones intercaladas", () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    expect(q.dequeue()).toBe(1);
    q.enqueue(3);
    expect(q.dequeue()).toBe(2);
    expect(q.dequeue()).toBe(3);
    q.enqueue(4);
    expect(q.peek()).toBe(4);
    expect(q.size).toBe(1);
  });

  it("clear la vacía y puede reutilizarse", () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.clear();
    expect(q.isEmpty()).toBe(true);
    q.enqueue(9);
    expect(q.dequeue()).toBe(9);
  });
});
