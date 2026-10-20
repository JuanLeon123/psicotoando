# Recursos para familias

Ruta: `/recursos-para-familias`. Se abre desde el menú, carga mediante `loadComponent` y marca su enlace como activo en el navbar compartido.

## Estructura

```text
src/app/pages/resources/
  resources.component.*            Composición de la página: artículo, recomendaciones y nota final
  data/resources.data.ts           Las cinco recomendaciones tipadas
  components/
    resources-intro/               Título y nota introductoria
    featured-article/              Artículo destacado «Cuidar a quien cuida» y fotografía
    caregiver-recommendations/     5 recomendaciones y recordatorio final
    resource-illustration/         Ilustraciones decorativas (WebP o SVG en línea)
```

Todos los componentes usan `OnPush`. Los colores proceden de `src/styles/_tokens.scss`. En escritorio la página usa dos columnas, como el mockup. En tablet y móvil las secciones se apilan, y en móvil la fotografía del artículo pasa a mostrarse antes del texto.

Las ilustraciones son decorativas (`aria-hidden`). La fotografía del artículo tiene texto alternativo. Las recomendaciones forman una lista ordenada, y el número visible se oculta a lectores de pantalla para que no se repita.

## Imágenes provisionales

- `public/images/resources-family.webp`: fotografía de madre e hija jugando con bloques.
- `public/images/resources-feelings.webp`, `resources-rest.webp` y `resources-support.webp`: ilustraciones de las recomendaciones 1, 3 y 5.
- Las ilustraciones de las recomendaciones 2 y 4 y la de la mano con la flor son SVG en línea, dentro de `resource-illustration`.

Son aproximaciones al mockup. Sustituirlas por los recursos definitivos cuando estén disponibles.

## Verificación

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

La prueba de integración comprueba la navegación desde el menú, el estado activo, el cierre del menú, el encabezado único, el artículo destacado, las cinco recomendaciones y la cita final. En el navegador se revisaron anchos de 1280, 900 y 390 px sin desplazamiento horizontal.

Para revisar localmente: `npm start` y abrir `http://localhost:4200/recursos-para-familias`.
