# Estructuras de datos (implementadas desde 0)

Núcleo evaluable del proyecto. Reglas de esta carpeta:

- **Prohibido** usar `Array`, `Map`, `Set` o cualquier estructura ya implementada de JS/TS.
- Todo se construye con nodos enlazados (`class Node { value; next; }`).
- Excepción acordada con el profesor: la tabla hash puede usar un array de
  tamaño fijo como memoria cruda (solo acceso por índice, sin métodos).
- Cada estructura define primero su interfaz (TAD) y luego la implementación.

Orden de implementación (cada una usa las anteriores):

1. ✅ `LinkedList` — lista enlazada genérica (usada como base de todo y para el
   perímetro del campus, el historial de resultados y los marcadores por ronda)
2. ✅ `Stack` / `Queue` — sobre la lista enlazada (deshacer el pin / cola de
   rondas de la partida)
3. ✅ `HashTable` — encadenamiento con `LinkedList`, rehashing por factor de
   carga (banco de lugares del campus; también como conjunto de ids usados)
4. ✅ `MinHeap` — montículo binario mínimo, la cola de prioridad de Dijkstra
   (árbol binario completo sobre memoria contigua indexada)
5. ✅ `Graph` — no dirigido y ponderado, lista de adyacencia hecha con
   `HashTable` + `LinkedList`, con Dijkstra. Es la red real de senderos del
   campus (~1262 nodos y ~1419 tramos desde OSM): el juego puntúa por la
   distancia CAMINANDO y dibuja la ruta más corta en el minimapa
6. ⬜ `BST` — árbol binario de búsqueda (leaderboard)
