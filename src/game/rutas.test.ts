import { describe, expect, it } from "vitest";
import { RedDeSenderos } from "./rutas";

// Red sintética: 4 nodos en línea sobre el ecuador de coordenadas,
// separados ~111 m por cada 0.001° de longitud (en lat 0).
//   n1(0,0) - n2(0,0.001) - n3(0,0.002) - n4(0,0.003)
function redDePrueba(): RedDeSenderos {
  const red = new RedDeSenderos();
  red.agregarNodo(1, { lat: 0, lng: 0 });
  red.agregarNodo(2, { lat: 0, lng: 0.001 });
  red.agregarNodo(3, { lat: 0, lng: 0.002 });
  red.agregarNodo(4, { lat: 0, lng: 0.003 });
  red.agregarTramo(1, 2);
  red.agregarTramo(2, 3);
  red.agregarTramo(3, 4);
  return red;
}

describe("RedDeSenderos", () => {
  it("cuenta nodos y tramos", () => {
    const red = redDePrueba();
    expect(red.numNodos).toBe(4);
    expect(red.numTramos).toBe(3);
  });

  it("agregarTramo exige nodos existentes", () => {
    const red = redDePrueba();
    expect(() => red.agregarTramo(1, 99)).toThrow();
  });

  it("encuentra el nodo más cercano", () => {
    const red = redDePrueba();
    expect(red.nodoMasCercano({ lat: 0.0001, lng: 0.00095 })).toBe(2);
    expect(red.nodoMasCercano({ lat: 0, lng: 0.005 })).toBe(4);
  });

  it("nodoMasCercano en red vacía devuelve null", () => {
    const red = new RedDeSenderos();
    expect(red.nodoMasCercano({ lat: 0, lng: 0 })).toBeNull();
  });

  it("calcula la ruta caminando de extremo a extremo", () => {
    const red = redDePrueba();
    // puntos pegados a n1 y n4: la ruta debe recorrer los 3 tramos (~333 m)
    const r = red.rutaCaminando({ lat: 0, lng: 0 }, { lat: 0, lng: 0.003 })!;
    expect(r).not.toBeNull();
    expect(r.distanciaM).toBeGreaterThan(320);
    expect(r.distanciaM).toBeLessThan(345);
    // camino = desde + 4 nodos + hasta
    expect(r.camino.size).toBe(6);
  });

  it("incluye los tramos de enganche en la distancia", () => {
    const red = redDePrueba();
    // punto a ~111 m al norte de n1: enganche + red + enganche
    const r = red.rutaCaminando({ lat: 0.001, lng: 0 }, { lat: 0, lng: 0.003 })!;
    expect(r.distanciaM).toBeGreaterThan(430); // ~111 + ~333
  });

  it("devuelve null si los nodos no se conectan", () => {
    const red = redDePrueba();
    red.agregarNodo(99, { lat: 1, lng: 1 }); // isla sin tramos
    const r = red.rutaCaminando({ lat: 0, lng: 0 }, { lat: 1, lng: 1 });
    expect(r).toBeNull();
  });
});
