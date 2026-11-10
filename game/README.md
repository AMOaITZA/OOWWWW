# OOWWWW — Prototipo RPG (fases 0 y 1)

## Estado

Este prototipo está aislado del sitio clásico: `/` mantiene su HTML, CSS y JavaScript originales sin modificar; `/game.html` carga módulos ES, Canvas 2D y sus propios estilos.

**Incluido:** mapa lógico de 1920×1280 (120×80 celdas de 16 px); visor de 480×270; cámara centrada; desplazamiento con A*, teclado opcional (flechas/WASD); colisiones con edificios; una entidad de pareja con dos personajes; diez puntos de interés; ventanas DOM; guardado local versionado `oowwww-game-v1`.

**Aún no incluido:** sprites definitivos, animaciones por capa terminadas, armario funcional, extracción literal de todos los textos y migración de las nueve experiencias a ventanas independientes. Por ahora los paneles enlazan a las secciones originales. No eliminar el sitio clásico durante la migración.

## Desarrollo

```bash
npm install
npm run dev
npm run build
npm run preview
```

En Vite, visitar `/game.html` para el juego; `/` es el sitio clásico. Render estático: comando de build `npm install && npm run build` y directorio de publicación `dist`, tras verificar ajustes del servicio.

## Recursos para sustituir los provisionales

El único punto de configuración de recursos gráficos es `game/data/assets.json`. Las rutas son absolutas desde la raíz del sitio: por ejemplo, `/assets/game/world/ground.png`. Un valor `null` significa dibujar un provisional. Nunca hacer referencia a nombres de PNG dentro del motor.

- `assets/game/world/ground.png`: imagen de suelo **1920×1280**, sin estructuras ni obstáculos pintados.
- `assets/game/objects/{house,letter,gallery,book,playlist,tv,clock,places,final,wardrobe}.png`: sprites individuales, con transparencia; el prototipo los dibuja en cajas de 96×80. Los árboles y otras decoraciones tendrán entradas propias al ampliar el manifiesto.
- `assets/game/characters/leo/base.png` y `assets/game/characters/itza/base.png`: hojas **192×144** transparentes, seis columnas × tres filas; cada frame mide 32×48. Filas: frente, lado derecho, espalda. Columnas: dos quieto y cuatro caminar.
- Posteriormente: `hairBack.png`, `hairFront.png`, `top.png`, `bottom.png`, `shoes.png`, `accessories.png` por personaje, cada hoja con el mismo formato y alineación exacta.

Para subir la primera prueba gráfica no hace falta producir todos estos recursos: empieza con `ground.png`, `leo/base.png` y `itza/base.png`. El resto puede quedarse en `null`. No producir lotes de ropa antes de validar una prueba de capas.

Las coordenadas y nombres de puntos de interés viven en `game/data/places.json`. No cambiar el contenido de `index.html` hasta la fase de extracción literal y pruebas de regresión.

## Comprobaciones manuales

1. Abrir `/`, confirmar que el modo clásico conserva su entrada y las nueve secciones.
2. Abrir `/game.html`, pulsar Entrar, ver a Itza y Leo cerca de Inicio.
3. Tocar Inicio; la pareja camina hacia su posición de llegada evitando el edificio. Tocar otra vez para abrir panel.
4. Cerrar el panel: se conserva la posición. Recargar la página: se recupera la posición y los lugares visitados.
5. Probar clic/táctil, teclado, móvil vertical y modo de movimiento reducido.
6. Compilar en producción y abrir tanto `dist/index.html` como `dist/game.html` desde servidor (no protocolo file://).

## Limitaciones conocidas

- Los objetos temporales comparten geometría de colisión predefinida; ajustar cada colisionador al adoptar sprites definitivos.
- El armario es todavía un panel informativo; la estructura de guardado ya reserva conjuntos separados.
- El escalado CSS puede ser fraccionario en pantallas estrechas; ajustar el modo de presentación de zoom entero con una estrategia de viewport para móvil en la fase de pulido.
- El prototipo todavía no ha sido validado en un navegador de producción.
