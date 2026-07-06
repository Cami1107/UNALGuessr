import { describe, expect, it } from "vitest";
import { Graph } from "./Graph";

function grafoDeEjemplo(): Graph<string> {
  //     1       2
  //  a --- b --- c
  //  |           |
  //  +---- 10 ---+      c --- d (1)
  const g = new Graph<string>();
  g.addEdge("a", "b", 1);
  g.addEdge("b", "c", 2);
  g.addEdge("a", "c", 10);
  g.addEdge("c", "d", 1);
  return g;
}

describe("Graph", () => {
  it("cuenta vértices y aristas (no dirigido)", () => {
    const g = grafoDeEjemplo();
    expect(g.vertexCount).toBe(4);
    expect(g.edgeCount).toBe(4);
    expect(g.hasVertex("a")).toBe(true);
    expect(g.hasVertex("z")).toBe(false);
  });

  it("addEdge crea vértices automáticamente y es simétrica", () => {
    const g = new Graph<string>();
    g.addEdge("x", "y", 3);
    expect(g.hasVertex("x")).toBe(true);
    expect(g.hasVertex("y")).toBe(true);
    expect(g.neighbors("x").find((e) => e.to === "y")?.weight).toBe(3);
    expect(g.neighbors("y").find((e) => e.to === "x")?.weight).toBe(3);
  });

  it("addEdge sobre una arista existente actualiza el peso sin duplicar", () => {
    const g = new Graph<string>();
    g.addEdge("x", "y", 3);
    g.addEdge("x", "y", 7);
    expect(g.edgeCount).toBe(1);
    expect(g.neighbors("x").size).toBe(1);
    expect(g.neighbors("y").find((e) => e.to === "x")?.weight).toBe(7);
  });

  it("rechaza pesos negativos e ignora lazos", () => {
    const g = new Graph<string>();
    expect(() => g.addEdge("a", "b", -1)).toThrow(RangeError);
    g.addEdge("a", "a", 5);
    expect(g.edgeCount).toBe(0);
  });

  it("dijkstra encuentra el camino más corto (no el de menos saltos)", () => {
    const g = grafoDeEjemplo();
    const r = g.dijkstra("a", "c")!;
    expect(r.distance).toBe(3); // a-b-c (1+2), no a-c directo (10)
    expect([...r.path]).toEqual(["a", "b", "c"]);
  });

  it("dijkstra encadena varios tramos", () => {
    const g = grafoDeEjemplo();
    const r = g.dijkstra("a", "d")!;
    expect(r.distance).toBe(4);
    expect([...r.path]).toEqual(["a", "b", "c", "d"]);
  });

  it("dijkstra funciona en ambos sentidos (grafo no dirigido)", () => {
    const g = grafoDeEjemplo();
    const r = g.dijkstra("d", "a")!;
    expect(r.distance).toBe(4);
    expect([...r.path]).toEqual(["d", "c", "b", "a"]);
  });

  it("dijkstra de un vértice a sí mismo es 0", () => {
    const g = grafoDeEjemplo();
    const r = g.dijkstra("a", "a")!;
    expect(r.distance).toBe(0);
    expect([...r.path]).toEqual(["a"]);
  });

  it("dijkstra devuelve null para vértices inalcanzables o inexistentes", () => {
    const g = grafoDeEjemplo();
    g.addVertex("isla");
    expect(g.dijkstra("a", "isla")).toBeNull();
    expect(g.dijkstra("a", "no-existe")).toBeNull();
    expect(g.dijkstra("no-existe", "a")).toBeNull();
  });

  it("dijkstra en un grafo grande en malla no se degrada", () => {
    // malla 20x20: el camino más corto de (0,0) a (19,19) son 38 pasos
    const g = new Graph<string>();
    const id = (f: number, c: number) => `${f},${c}`;
    for (let f = 0; f < 20; f++) {
      for (let c = 0; c < 20; c++) {
        if (f < 19) g.addEdge(id(f, c), id(f + 1, c), 1);
        if (c < 19) g.addEdge(id(f, c), id(f, c + 1), 1);
      }
    }
    const r = g.dijkstra(id(0, 0), id(19, 19))!;
    expect(r.distance).toBe(38);
    expect(r.path.size).toBe(39);
  });
});
