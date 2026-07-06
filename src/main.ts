import "./style.css";
import { cargarLugares, cargarPerimetro } from "./campus";
import { dentroDePoligono, haversine, type Coordenada } from "./game/geo";
import {
  crearPartida,
  puntaje,
  RONDAS_POR_PARTIDA,
  type Ronda,
  type ResultadoRonda,
} from "./game/partida";
import { cargarRedDeSenderos } from "./game/rutas";
import { LinkedList } from "./structures/LinkedList";
import { Stack } from "./structures/Stack";
import type { Queue } from "./structures/Queue";

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;

// Centro aproximado del campus, para encuadrar el minimapa
const CAMPUS_CENTER = { lat: 4.6376, lng: -74.0834 };
const PISTA_RONDA = "¿Dónde estás? Marca tu adivinanza en el minimapa.";
const MSG_AUTH =
  "Error de autenticación con Google Maps: revisa que la key sea válida, " +
  "que la facturación esté activa y que localhost:5173 esté permitido en los referrers.";

// ---- referencias al DOM ----
const statusEl = document.getElementById("status")!;
const rondaInfo = document.getElementById("ronda-info")!;
const puntosInfo = document.getElementById("puntos-info")!;
const guessBtn = document.getElementById("guess-btn") as HTMLButtonElement;
const undoBtn = document.getElementById("undo-btn") as HTMLButtonElement;
const resultEl = document.getElementById("result")!;
const resultTexto = document.getElementById("result-texto")!;
const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
const errorEl = document.getElementById("error")!;
const errorTexto = document.getElementById("error-texto")!;
const retryBtn = document.getElementById("retry-btn") as HTMLButtonElement;
const finalEl = document.getElementById("final")!;
const finalTotal = document.getElementById("final-total")!;
const finalLista = document.getElementById("final-lista")!;
const againBtn = document.getElementById("again-btn") as HTMLButtonElement;
const menuBtn = document.getElementById("menu-btn") as HTMLButtonElement;
const musicBtn = document.getElementById("music-btn") as HTMLButtonElement;
const inicioEl = document.getElementById("inicio")!;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const avatarBtn = document.getElementById("avatar-btn") as HTMLButtonElement;
const avatarPanel = document.getElementById("avatar-panel")!;
const avatarInfo = document.getElementById("avatar-info")!;

// ---- música de fondo: una pista para el inicio y otra para el juego ----
const PISTA_INICIO = "/Musica-Fondo.mp3";
const PISTA_JUEGO = "/Juego.mp3";
const VOL_INICIO = 0.25;
const VOL_JUEGO = 0.6; // la pista del juego suena más fuerte
const musica = new Audio(PISTA_INICIO);
musica.loop = true;
musica.volume = VOL_INICIO;
let musicaActiva = true; // preferencia del jugador (botón 🔊/🔇)

function cambiarPista(src: string) {
  musica.src = src; // reinicia la reproducción con la nueva pista
  musica.volume = src === PISTA_JUEGO ? VOL_JUEGO : VOL_INICIO;
  musicBtn.dataset.track = src;
  if (musicaActiva) musica.play().catch(() => {});
}

musica.addEventListener("play", () => (musicBtn.dataset.playing = "1"));
musica.addEventListener("pause", () => (musicBtn.dataset.playing = "0"));

function iniciarMusica() {
  if (musicaActiva && musica.paused) {
    // Si el navegador aún bloquea el audio, se reintenta en la próxima interacción
    musica.play().catch(() => {});
  }
}

musicBtn.addEventListener("click", () => {
  musicaActiva = !musicaActiva;
  if (musicaActiva) iniciarMusica();
  else musica.pause();
  musicBtn.textContent = musicaActiva ? "🔊" : "🔇";
  musicBtn.title = musicaActiva ? "Silenciar música" : "Activar música";
});

// Los navegadores exigen un gesto del usuario antes de reproducir audio:
// arrancamos (o reintentamos) en cualquier clic/toque/tecla. En fase de
// captura, porque los widgets de Google detienen la propagación normal.
document.addEventListener("pointerdown", iniciarMusica, { capture: true });
document.addEventListener("keydown", iniciarMusica, { capture: true });

// ---- avatar del jugador (3 opciones, persistido en localStorage) ----
const AVATAR_DEFECTO = "🐿️";
let avatar = localStorage.getItem("avatar") ?? AVATAR_DEFECTO;

function aplicarAvatar(nuevo: string) {
  avatar = nuevo;
  localStorage.setItem("avatar", avatar);
  avatarInfo.textContent = avatar;
  document.querySelectorAll<HTMLButtonElement>(".avatar-opcion").forEach((btn) => {
    btn.classList.toggle("seleccionado", btn.dataset.avatar === avatar);
  });
}

// ---- estructuras propias con el estado del juego ----
const perimetro = cargarPerimetro(); // LinkedList<Coordenada>
const lugares = cargarLugares(perimetro); // HashTable<string, CampusLocation>
const red = cargarRedDeSenderos(); // Graph + Dijkstra + MinHeap: senderos del campus
const resultados = new LinkedList<ResultadoRonda>(); // historial de la partida
const pinsPrevios = new Stack<Coordenada>(); // historial del pin (deshacer)
const marcadoresRonda = new LinkedList<google.maps.Marker | google.maps.Polyline>();

// ---- estado de la partida ----
let svc: google.maps.StreetViewService;
let panorama: google.maps.StreetViewPanorama;
let map: google.maps.Map;
let colaRondas: Queue<Ronda> | null = null; // la partida es una COLA de rondas
let rondaActual: Ronda | null = null; // null = cargando partida (bloquea el minimapa)
let numeroRonda = 0;
let puntosTotal = 0;
let pin: google.maps.Marker | null = null;
let enResultado = false; // bloquea el minimapa mientras se muestra el resultado
let authFallo = false; // gm_authFailure disparado: no pisar su mensaje
let ultimoPanoValido = ""; // último panorama dentro del perímetro (guardián)
let revirtiendoPano = false; // evita recursión al revertir un pano fuera del campus

declare global {
  interface Window {
    gm_authFailure?: () => void;
    __gmapsReady?: () => void;
  }
}

// Google llama a esta función global cuando la key es inválida,
// no tiene facturación, o el referrer no está permitido.
window.gm_authFailure = () => {
  authFallo = true;
  setStatus(MSG_AUTH);
};

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&v=weekly&loading=async&callback=__gmapsReady`;
    s.async = true;
    window.__gmapsReady = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar el script de Google Maps"));
    document.head.appendChild(s);
  });
}

function setStatus(msg: string | null) {
  if (msg === null) {
    statusEl.classList.add("hidden");
  } else {
    statusEl.textContent = msg;
    statusEl.classList.remove("hidden");
  }
}

function actualizarTopbar() {
  rondaInfo.textContent =
    numeroRonda > 0
      ? `Ronda ${numeroRonda}/${RONDAS_POR_PARTIDA}`
      : `Ronda –/${RONDAS_POR_PARTIDA}`;
  puntosInfo.textContent = `${puntosTotal} pts`;
}

function limpiarMapa() {
  for (const m of marcadoresRonda) m.setMap(null);
  marcadoresRonda.clear();
  if (pin) {
    pin.setMap(null);
    pin = null;
  }
  pinsPrevios.clear();
}

async function nuevaPartida() {
  // Estado "cargando": rondaActual null bloquea minimapa y Adivinar
  rondaActual = null;
  enResultado = false;
  colaRondas = null;
  finalEl.classList.add("hidden");
  resultEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  guessBtn.disabled = true;
  undoBtn.disabled = true;
  puntosTotal = 0;
  numeroRonda = 0;
  resultados.clear();
  limpiarMapa();
  actualizarTopbar();
  setStatus(`Preparando partida: buscando ${RONDAS_POR_PARTIDA} panoramas en el campus…`);

  try {
    colaRondas = await crearPartida(svc, lugares, perimetro);
  } catch (err) {
    // Callejón sin salida NO: siempre queda el botón Reintentar visible.
    setStatus(null);
    errorTexto.textContent = authFallo ? MSG_AUTH : `Error: ${(err as Error).message}`;
    errorEl.classList.remove("hidden");
    return;
  }
  siguienteRonda();
}

function siguienteRonda() {
  const ronda = colaRondas?.dequeue(); // consumir la cola (FIFO)
  if (!ronda) {
    mostrarFinal();
    return;
  }
  rondaActual = ronda;
  numeroRonda++;
  enResultado = false;
  limpiarMapa();
  guessBtn.disabled = true;
  undoBtn.disabled = true;
  resultEl.classList.add("hidden");

  ultimoPanoValido = ronda.panoId;
  panorama.setPano(ronda.panoId);
  panorama.setPov({ heading: 0, pitch: 0 });
  map.setCenter(CAMPUS_CENTER);
  map.setZoom(15);

  actualizarTopbar();
  setStatus(PISTA_RONDA);
  console.log(`[UNALGuessr] Ronda ${numeroRonda}: ${ronda.lugar.nombre}`);
}

function adivinar() {
  if (!pin || !rondaActual || enResultado) return;
  enResultado = true;

  const adivinanza = pin.getPosition()!.toJSON();
  const recta = haversine(adivinanza, rondaActual.posicionReal);
  // Distancia CAMINANDO por los senderos del campus: Dijkstra (con
  // nuestro MinHeap) sobre nuestro grafo. Si no hay ruta, línea recta.
  const ruta = red.rutaCaminando(adivinanza, rondaActual.posicionReal);
  const pts = ruta ? puntaje(ruta.distanciaM, true) : puntaje(recta);
  puntosTotal += pts;

  // El historial de la partida vive en nuestra LinkedList
  resultados.addLast({
    lugar: rondaActual.lugar,
    adivinanza,
    posicionReal: rondaActual.posicionReal,
    distanciaM: recta,
    distanciaCaminandoM: ruta ? ruta.distanciaM : null,
    puntos: pts,
  });

  const estrella = new google.maps.Marker({
    map,
    position: rondaActual.posicionReal,
    label: "★",
  });
  const linea = new google.maps.Polyline({
    map,
    path: [adivinanza, rondaActual.posicionReal],
    strokeColor: "#e53935",
    strokeOpacity: 0.7,
    strokeWeight: 2,
  });
  marcadoresRonda.addLast(estrella);
  marcadoresRonda.addLast(linea);

  const bounds = new google.maps.LatLngBounds()
    .extend(adivinanza)
    .extend(rondaActual.posicionReal);
  if (ruta) {
    // Dibujar el camino de Dijkstra sobre el minimapa
    const camino: google.maps.LatLngLiteral[] = [];
    for (const c of ruta.camino) {
      camino.push(c);
      bounds.extend(c);
    }
    const rutaLinea = new google.maps.Polyline({
      map,
      path: camino,
      strokeColor: "#1e88e5",
      strokeOpacity: 0.85,
      strokeWeight: 4,
    });
    marcadoresRonda.addLast(rutaLinea);
  }
  map.fitBounds(bounds, 60);

  actualizarTopbar();
  guessBtn.disabled = true;
  undoBtn.disabled = true;
  setStatus(null);

  resultTexto.textContent = ruta
    ? `${rondaActual.lugar.nombre} — ${Math.round(ruta.distanciaM)} m caminando (${Math.round(recta)} m en línea recta) · +${pts} puntos`
    : `${rondaActual.lugar.nombre} — te alejaste ${Math.round(recta)} m · +${pts} puntos`;
  nextBtn.textContent =
    colaRondas && !colaRondas.isEmpty() ? "Siguiente ronda ➜" : "Ver resultados";
  resultEl.classList.remove("hidden");
}

function mostrarFinal() {
  resultEl.classList.add("hidden");
  setStatus(null);
  finalTotal.textContent = `Puntaje total: ${puntosTotal} / ${RONDAS_POR_PARTIDA * 5000}`;

  while (finalLista.firstChild) finalLista.removeChild(finalLista.firstChild);
  for (const r of resultados) {
    const li = document.createElement("li");
    const dist =
      r.distanciaCaminandoM !== null
        ? `${Math.round(r.distanciaCaminandoM)} m caminando`
        : `${Math.round(r.distanciaM)} m`;
    li.textContent = `${r.lugar.nombre} — ${dist} · `;
    const pts = document.createElement("span");
    pts.className = "pts";
    pts.textContent = `${r.puntos} pts`;
    li.appendChild(pts);
    finalLista.appendChild(li);
  }
  finalEl.classList.remove("hidden");
}

/** Regresa a la pantalla de inicio (y a su música) dejando todo limpio. */
function volverAlMenu() {
  finalEl.classList.add("hidden");
  resultEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  rondaActual = null;
  colaRondas = null;
  enResultado = false;
  numeroRonda = 0;
  puntosTotal = 0;
  resultados.clear();
  limpiarMapa();
  actualizarTopbar();
  guessBtn.disabled = true;
  undoBtn.disabled = true;
  setStatus(null);
  cambiarPista(PISTA_INICIO);
  inicioEl.classList.remove("hidden");
}

async function main() {
  await loadGoogleMaps();
  console.log(
    `[UNALGuessr] ${lugares.size} lugares en la tabla hash, perímetro de ${perimetro.size} vértices, ` +
      `red de senderos: ${red.numNodos} nodos y ${red.numTramos} tramos`
  );

  svc = new google.maps.StreetViewService();

  panorama = new google.maps.StreetViewPanorama(document.getElementById("pano")!, {
    pov: { heading: 0, pitch: 0 },
    // Anti-spoiler: sin dirección ni nombres de calles
    addressControl: false,
    showRoadLabels: false,
    fullscreenControl: false,
    motionTracking: false,
    zoomControl: true,
  });

  // Guardián del perímetro: si el jugador navega con las flechas hasta
  // salir del campus, lo regresamos al último panorama válido. Reusa
  // nuestro punto-en-polígono sobre la LinkedList del perímetro.
  panorama.addListener("position_changed", () => {
    if (revirtiendoPano) {
      revirtiendoPano = false;
      return;
    }
    if (!rondaActual) return;
    const pos = panorama.getPosition()?.toJSON();
    if (!pos) return;
    if (dentroDePoligono(pos, perimetro)) {
      ultimoPanoValido = panorama.getPano();
    } else if (ultimoPanoValido) {
      revirtiendoPano = true;
      panorama.setPano(ultimoPanoValido);
      setStatus("El juego es solo dentro del campus 🙂");
      setTimeout(() => {
        if (rondaActual && !enResultado) setStatus(PISTA_RONDA);
      }, 2500);
    }
  });

  map = new google.maps.Map(document.getElementById("map")!, {
    center: CAMPUS_CENTER,
    zoom: 15,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    // Sin nombres de edificios ni POIs: harían el juego demasiado fácil
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
  });

  map.addListener("click", (e: google.maps.MapMouseEvent) => {
    // Bloqueado mientras se muestra un resultado o mientras carga la partida
    if (enResultado || !rondaActual || !e.latLng) return;
    const pos = e.latLng.toJSON();
    pinsPrevios.push(pos); // historial para deshacer (Stack)
    if (!pin) {
      // El pin del jugador lleva su avatar
      pin = new google.maps.Marker({
        map,
        position: pos,
        label: { text: avatar, fontSize: "18px" },
      });
    } else {
      pin.setPosition(pos);
    }
    guessBtn.disabled = false;
    undoBtn.disabled = false;
  });

  undoBtn.addEventListener("click", () => {
    if (enResultado || !rondaActual) return;
    pinsPrevios.pop(); // descarta la posición actual
    const anterior = pinsPrevios.peek(); // la anterior queda en el tope
    if (anterior && pin) {
      pin.setPosition(anterior);
    } else {
      if (pin) pin.setMap(null);
      pin = null;
      guessBtn.disabled = true;
    }
    undoBtn.disabled = pinsPrevios.isEmpty();
  });

  if (import.meta.env.DEV) {
    // Gancho para pruebas manuales/automatizadas en desarrollo
    (window as unknown as Record<string, unknown>).__debug = { map, panorama, red, musica };
  }

  guessBtn.addEventListener("click", adivinar);
  nextBtn.addEventListener("click", siguienteRonda);
  againBtn.addEventListener("click", () => void nuevaPartida());
  menuBtn.addEventListener("click", volverAlMenu);
  retryBtn.addEventListener("click", () => void nuevaPartida());

  // ---- pantalla de inicio ----
  aplicarAvatar(avatar); // marca la opción guardada y pinta el pill del topbar
  avatarBtn.addEventListener("click", () => avatarPanel.classList.toggle("hidden"));
  document.querySelectorAll<HTMLButtonElement>(".avatar-opcion").forEach((btn) => {
    btn.addEventListener("click", () => aplicarAvatar(btn.dataset.avatar!));
  });

  setStatus(null); // el overlay de inicio cubre la pantalla; sin mensajes debajo
  startBtn.textContent = "Iniciar juego";
  startBtn.disabled = false;
  startBtn.addEventListener("click", () => {
    inicioEl.classList.add("hidden");
    cambiarPista(PISTA_JUEGO); // al entrar al juego cambia la música
    void nuevaPartida();
  });
}

main().catch((err) => {
  inicioEl.classList.add("hidden"); // que el panel de error no quede tapado
  setStatus(null);
  errorTexto.textContent = authFallo ? MSG_AUTH : `Error: ${err?.message ?? err}`;
  errorEl.classList.remove("hidden");
  console.error(err);
});
