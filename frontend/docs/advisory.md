# Asesoría y seguimiento

Ruta: `/asesoria-y-seguimiento`, con carga diferida, título de página y enlace activo en el navbar compartido. El encabezado conserva la misma geometría que Inicio y Sobre nosotros.

## Organización

```text
src/app/pages/advisory/
  advisory.component.*          Composición y decoraciones de la página
  _advisory-shared.scss          Estilos compartidos de las etapas
  data/advisory.data.ts          Pasos, servicios y galería tipados
  components/
    advisory-hero/              Presentación y acceso móvil a asesoría
    initial-consultation/       Etapa inicial y cuatro pasos
    follow-up/                  Acompañamiento y seguimientos virtuales
    family-resources/           Recursos, redes y disponibilidad
    new-challenges/             Extensiones y galería de actividades
```

Todos los componentes usan `OnPush`. Se reutilizan los iconos, el servicio de ventanas, el navbar y el footer. La paleta se amplía en `src/styles/_tokens.scss`, sin colores literales dentro de los estilos de los componentes.

El recorrido tiene tres etapas numeradas. Los recursos continuos son un bloque complementario, evitando la numeración 3 repetida del mockup. En móvil, los pasos y la galería se presentan en dos columnas; las secciones se apilan conservando todo el contenido.

## Acciones y datos pendientes

- El enlace «Asesoría y seguimiento» abre la página. «Agenda una asesoría» conserva la ventana informativa compartida, disponible también desde la portada móvil.
- Falta el WhatsApp o enlace de reservas definitivo; no se simulan reservas.
- Los enlaces de redes sociales y Club de Padres están pendientes. Los símbolos de redes son ilustrativos y el texto indica su próxima disponibilidad.
- Los servicios y el límite de dos asesorías se transcribieron de la referencia proporcionada.

## Recursos visuales

Fotografías provisionales creadas con la herramienta integrada `image_gen`, convertidas a WebP con `cwebp` y guardadas en el proyecto. No representan productos reales de la empresa. La ilustración del teléfono, los iconos y las formas decorativas están hechos con CSS y SVG.

- `public/images/advisory-hero.webp`
- `public/images/advisory-matching.webp`
- `public/images/advisory-sorting.webp`
- `public/images/advisory-tracing.webp`
- `public/images/advisory-stacking.webp`

## Validación

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Se añade una prueba de navegación y reserva informativa a la suite existente. Las comprobaciones en Chrome cubren diez anchos entre 320 y 1592 px, imágenes, desbordamiento horizontal, estabilidad del navbar, enlace activo y cierre de la ventana con Escape. Axe revisa la página en móvil y escritorio con reglas WCAG A/AA.

Para abrirla localmente: `npm start` y visitar `http://localhost:4200/asesoria-y-seguimiento`.

## Prompts de las fotografías

### advisory-hero

```text
Use case: photorealistic-natural. Website hero photograph, wide landscape 2:1 composition. Warm candid scene in a bright cozy home: smiling brunette mother in a sage green shirt waving at an open silver laptop to her left, beside her cheerful 5 year old daughter in a cream cardigan. The girl holds a small yellow wooden toy, colorful ring stacking toy on the wooden table in front of her. They are participating in a friendly video call together. Eye-level shot includes faces, waving hand, laptop and tabletop. Soft blurred shelves, plants and beige walls. Natural daylight, realistic anatomy. No text, logos, watermark or graphic overlays.
```

### advisory-matching

```text
Use case: product-mockup. Square documentary photograph of a handmade early childhood learning activity on a wooden table, slightly overhead three quarter view. A compact wooden activity box with colorful round discs arranged in a four by four grid on its top, each in red, blue, green, yellow with a small chunky black handle to grasp; simple matching symbols under some pieces. Visible natural plywood edges, colorful small toys slightly out of focus behind it. Friendly occupational therapy play material, handmade authentic look, warm daylight, no people. No text, readable numbers, logos or watermark. Frame entire box with a little margin.
```

### advisory-sorting

```text
Use case: photorealistic-natural. Square close-up documentary photograph of a preschool color sorting play activity on a table. Only small child's hands and sleeves visible, using large child-safe red plastic tweezers to pick up a colorful pompom and place it in one of six bright silicone bowls (red, orange, yellow, green, blue, purple). Natural daylight, realistic hand anatomy, homemade tactile learning materials, warm approachable feel. Slightly overhead angle, all bowls visible, rich cheerful colors. No faces, no text, logos, watermark or graphic borders.
```

### advisory-tracing

```text
Use case: photorealistic-natural. Square close-up documentary photograph of a handmade wooden framed black chalkboard lying flat on a light wooden table, a child's small hand in a cream long sleeve using white chalk to trace simple wavy lines, curved loops and zigzag paths. The board fills most of the frame with natural plywood frame and a few chunky chalk pieces beside it. Warm daylight, realistic anatomy, tactile Montessori style fine motor learning activity, slightly overhead view. No letters, no numbers, no logos, no watermark.
```

### advisory-stacking

```text
Use case: product-mockup. Square close-up documentary photograph of bright red blue yellow green translucent plastic stacking cups on a natural plywood activity tray on a wooden table, an upright small tower of three cups to the left and two individual cups to the right. A small card with simple colored square pattern swatches lies in the tray. Warm natural daylight, colorful tactile play materials for young children, three-quarter overhead view. Entire tray visible with a little breathing room. No people, no text, no logos, no watermark.
```
