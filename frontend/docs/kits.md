# Nuestros kits

Ruta: `/nuestros-kits`. Se abre desde el enlace «Nuestros kits» del menú, carga mediante `loadComponent` y marca ese enlace como activo. El carrito lleva a la tienda (`/tienda`, ver [shop.md](shop.md)).

## Estructura

```text
src/app/pages/kits/
  kits.component.*               Composición, burbuja de propósito y decoraciones
  data/kits.data.ts              Fotografías, niveles y áreas de desarrollo tipados
  components/
    kits-intro/                  Título, «¿Qué es la caja W°alli?» y nota de niveles
    kits-gallery/                Las cuatro fotografías de actividades
    kit-levels/                  Niveles Explorador, Experimentador y Experto
    development-areas/           Tabla «Áreas de desarrollo que trabajamos»
```

Todos los componentes usan `OnPush`. Los iconos nuevos (cerebro, mano, oído, lupa, bombilla, estrella, etc.) se añadieron al `IconComponent` compartido. Los colores proceden de `src/styles/_tokens.scss`.

En escritorio la página usa dos columnas, como el mockup, y la tabla ocupa todo el ancho. En tablet las secciones se apilan y la burbuja pasa a ser una franja. En móvil, la galería se muestra en 2 × 2, los niveles en lista y cada fila de la tabla se convierte en una tarjeta. La tabla declara roles ARIA explícitos para conservar su semántica cuando cambia el `display`.

## Pendiente

- Las cuatro fotografías reutilizan las imágenes provisionales de Asesoría y seguimiento (`advisory-stacking`, `advisory-sorting`, `advisory-tracing` y `advisory-matching`). Sustituirlas por fotos reales de la caja cuando estén disponibles.

## Verificación

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

La prueba de integración comprueba la navegación desde el menú, el estado activo, el cierre del menú, el encabezado único, las cuatro fotografías con texto alternativo, los tres niveles y las siete áreas. En el navegador se revisaron anchos de 1280, 1100, 900 y 390 px sin desplazamiento horizontal.

Para revisar localmente: `npm start` y abrir `http://localhost:4200/nuestros-kits`.
