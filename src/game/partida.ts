import { HashTable } from "../structures/HashTable";
import { LinkedList } from "../structures/LinkedList";
import { Queue } from "../structures/Queue";
import { dentroDePoligono, type Coordenada } from "./geo";
import type { CampusLocation } from "../campus";

export interface Ronda {
  lugar: CampusLocation;
  panoId: string;
  posicionReal: Coordenada;
}

export interface ResultadoRonda {
  lugar: CampusLocation;
  adivinanza: Coordenada;
  posicionReal: Coordenada;
  distanciaM: number; // línea recta (Haversine)
  distanciaCaminandoM: number | null; // por los senderos (Dijkstra); null si no hubo ruta
  puntos: number;
}

export const RONDAS_POR_PARTIDA = 5;

/**
 * 5000 puntos con decaimiento exponencial. La distancia caminando
 * siempre es mayor que la línea recta, así que su curva es más
 * indulgente (gracia de 20 m y decae a ~0 hacia 1.5 km) para que
 * ambas formas de puntuar se sientan equivalentes.
 */
export function puntaje(distanciaM: number, caminando = false): number {
  const gracia = caminando ? 20 : 15;
  const decaimiento = caminando ? 220 : 150;
  return Math.round(5000 * Math.exp(-Math.max(0, distanciaM - gracia) / decaimiento));
}

/** ¿El rechazo de getPanorama significa "no hay panorama cerca"? */
function esSinCobertura(e: unknown): boolean {
  return String((e as { code?: unknown })?.code ?? e).includes("ZERO_RESULTS");
}

function errorDeServicio(e: unknown): Error {
  return new Error(
    `Street View no respondió (${String((e as { code?: unknown })?.code ?? e)})`
  );
}

/**
 * Busca el panorama más cercano al lugar (primero cobertura oficial
 * OUTDOOR; si no hay, también fotoesferas de usuarios). Devuelve null
 * si no hay cobertura; LANZA si el servicio falla por otra causa
 * (key, cuota, red) para abortar de inmediato en vez de insistir a
 * ciegas con decenas de peticiones condenadas.
 */
async function buscarPanorama(
  svc: google.maps.StreetViewService,
  lugar: CampusLocation
): Promise<google.maps.StreetViewPanoramaData | null> {
  const base: google.maps.StreetViewLocationRequest = {
    location: { lat: lugar.lat, lng: lugar.lng },
    radius: 150,
    preference: google.maps.StreetViewPreference.NEAREST,
  };
  try {
    const { data } = await svc.getPanorama({
      ...base,
      sources: [google.maps.StreetViewSource.OUTDOOR],
    });
    return data;
  } catch (e) {
    if (!esSinCobertura(e)) throw errorDeServicio(e);
  }
  try {
    const { data } = await svc.getPanorama(base);
    return data;
  } catch (e) {
    if (!esSinCobertura(e)) throw errorDeServicio(e);
    return null;
  }
}

/**
 * Arma una partida: elige lugares al azar SIN repetir (los ids ya usados
 * se marcan en una HashTable usada como conjunto), busca el panorama de
 * cada uno, valida que quede DENTRO del perímetro del campus y ENCOLA
 * las rondas. El juego luego consume la cola en orden (FIFO).
 *
 * También deduplica por panoId: dos lugares vecinos pueden resolver al
 * MISMO panorama (radius 150 + NEAREST), y sin este chequeo la partida
 * tendría dos rondas idénticas.
 */
export async function crearPartida(
  svc: google.maps.StreetViewService,
  lugares: HashTable<string, CampusLocation>,
  perimetro: LinkedList<Coordenada>,
  numRondas = RONDAS_POR_PARTIDA
): Promise<Queue<Ronda>> {
  const cola = new Queue<Ronda>();
  const usados = new HashTable<string, boolean>(); // conjunto: ids de lugar y panoIds ya usados
  const llaves = lugares.keys(); // LinkedList<string>
  const MAX_INTENTOS = numRondas * 10;

  for (let intento = 0; intento < MAX_INTENTOS && cola.size < numRondas; intento++) {
    const id = llaves.get(Math.floor(Math.random() * llaves.size))!;
    if (usados.has(id)) continue;
    usados.set(id, true);
    const lugar = lugares.get(id)!; // búsqueda O(1) en nuestra HashTable

    const data = await buscarPanorama(svc, lugar);
    if (!data) {
      console.log(`[UNALGuessr] ${lugar.nombre}: sin panorama cercano, descartado`);
      continue;
    }

    const pos = data.location!.latLng!.toJSON();
    if (!dentroDePoligono(pos, perimetro)) {
      console.log(
        `[UNALGuessr] ${lugar.nombre}: el panorama más cercano cae fuera del campus, descartado`
      );
      continue;
    }

    const panoId = data.location!.pano;
    if (usados.has(`pano:${panoId}`)) {
      console.log(
        `[UNALGuessr] ${lugar.nombre}: resuelve al mismo panorama de otra ronda, descartado`
      );
      continue;
    }
    usados.set(`pano:${panoId}`, true);

    cola.enqueue({ lugar, panoId, posicionReal: pos });
  }

  if (cola.size < numRondas) {
    throw new Error(
      `Solo se encontraron ${cola.size} panoramas válidos dentro del campus`
    );
  }
  return cola;
}
