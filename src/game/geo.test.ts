import { describe, expect, it } from "vitest";
import { LinkedList } from "../structures/LinkedList";
import { dentroDePoligono, haversine, type Coordenada } from "./geo";

function poligonoDe(puntos: Coordenada[]): LinkedList<Coordenada> {
  const l = new LinkedList<Coordenada>();
  for (const p of puntos) l.addLast(p);
  return l;
}

describe("dentroDePoligono", () => {
  const cuadrado = poligonoDe([
    { lat: 0, lng: 0 },
    { lat: 0, lng: 10 },
    { lat: 10, lng: 10 },
    { lat: 10, lng: 0 },
  ]);

  it("detecta puntos adentro", () => {
    expect(dentroDePoligono({ lat: 5, lng: 5 }, cuadrado)).toBe(true);
    expect(dentroDePoligono({ lat: 1, lng: 9 }, cuadrado)).toBe(true);
  });

  it("detecta puntos afuera", () => {
    expect(dentroDePoligono({ lat: 15, lng: 5 }, cuadrado)).toBe(false);
    expect(dentroDePoligono({ lat: -1, lng: -1 }, cuadrado)).toBe(false);
    expect(dentroDePoligono({ lat: 5, lng: 11 }, cuadrado)).toBe(false);
  });

  it("acepta anillos cerrados (último = primero)", () => {
    const cerrado = poligonoDe([
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 10, lng: 10 },
      { lat: 10, lng: 0 },
      { lat: 0, lng: 0 },
    ]);
    expect(dentroDePoligono({ lat: 5, lng: 5 }, cerrado)).toBe(true);
    expect(dentroDePoligono({ lat: 15, lng: 5 }, cerrado)).toBe(false);
  });

  it("funciona con polígonos no convexos (forma de L)", () => {
    const ele = poligonoDe([
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 5, lng: 10 },
      { lat: 5, lng: 5 },
      { lat: 10, lng: 5 },
      { lat: 10, lng: 0 },
    ]);
    expect(dentroDePoligono({ lat: 2, lng: 8 }, ele)).toBe(true); // brazo horizontal
    expect(dentroDePoligono({ lat: 8, lng: 2 }, ele)).toBe(true); // brazo vertical
    expect(dentroDePoligono({ lat: 8, lng: 8 }, ele)).toBe(false); // esquina vacía de la L
  });
});

describe("haversine", () => {
  it("distancia cero entre el mismo punto", () => {
    const p = { lat: 4.6357, lng: -74.0828 };
    expect(haversine(p, p)).toBe(0);
  });

  it("0.001° de latitud son ~111 metros", () => {
    const a = { lat: 4.6357, lng: -74.0828 };
    const b = { lat: 4.6367, lng: -74.0828 };
    const d = haversine(a, b);
    expect(d).toBeGreaterThan(105);
    expect(d).toBeLessThan(118);
  });
});
