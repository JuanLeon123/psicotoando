# Página Sobre nosotros

Ruta: `/sobre-nosotros`. Se abre desde el menú y carga mediante `loadComponent`.

## Estructura

- `src/app/pages/about/about.component.*`: composición de la página, ilustración y decoración.
- `components/about-story/`: título, historia, fotografía y mensaje de acompañamiento.
- `components/about-purpose/`: misión y visión.
- `components/about-values/`: valores de la marca.
- `data/about.data.ts`: textos del mockup y configuración tipada de los iconos.

Se reutilizan el navbar, footer, iconos y hojas decorativas existentes. La navegación usa `RouterLinkActive` para identificar la página actual y cerrar el menú al seleccionar un enlace. El encabezado comparte la misma distribución compacta en todas las rutas e incluye la acción de asesoría existente; el canal de reservas sigue pendiente de configuración.

La paleta se mantiene en `src/styles/_tokens.scss`, incluyendo un tono coral para títulos con contraste suficiente. Las formas decorativas usan variables CSS y se excluyen del árbol de accesibilidad. La fotografía tiene texto alternativo; la ilustración es decorativa.

## Imágenes provisionales

Preparadas con la herramienta integrada `image_gen` y exportadas localmente a WebP con `cwebp`:

- `public/images/about-play.webp`: fotografía de madre e hijo, 1200 × 900.
- `public/images/about-family.webp`: ilustración familiar con transparencia, 960 × 720.

Son aproximaciones visuales al mockup, no fotografías de la empresa ni archivos originales. Sustituirlas por los recursos definitivos cuando estén disponibles.

### Prompt de la fotografía

```text
Use case: photorealistic-natural. Asset type: About us page photograph for a family therapy and educational play brand. A warm candid medium shot of a smiling brunette mother in a sage olive green blouse beside her smiling 5 year old boy in a mustard yellow long sleeve shirt, seated at a pale wooden table. They are looking down together at colorful wooden blocks and two illustrated play activity sheets on the table. Bright cozy home, soft cream walls and blurred wooden shelves, small framed children's art. Natural daylight, realistic people and hands, warm approachable professional lifestyle photography. Landscape 4:3 framing with generous margin around both heads for an oval crop. Show heads, torsos, hands and tabletop. No text, no logo, no watermark, no graphic border.
```

### Prompt de la ilustración

```text
Use case: illustration-story. Asset type: small decorative editorial illustration for a family wellbeing website. Flat vector-like illustration of a father on the left, a small child in the middle and mother on the right, sitting cross-legged on the floor playing together with colorful wooden blocks. Father wearing olive green sweater and teal trousers, child wearing golden yellow top, mother wearing deep teal top and trousers. Both parents lean toward the child with gentle smiles. Stylized organic shapes, friendly modern children's book drawing with sparse delicate linework, minimal faces, warm cream skin tones. Restrained colors teal #008380, olive #8eac16, mustard #ffb916, small coral accents #ff694b. A small coral heart floats above the family. Very light cream oval rug under them. Fully transparent background beyond the rug. Complete figures, no cropping, landscape 4:3, generous clear margin. No lettering, no text, no logo, no watermark.
```

## Verificación

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Se amplían las pruebas de integración existentes para comprobar la navegación a Sobre nosotros, el estado activo del menú, el cierre del menú móvil, la carga directa y el regreso a la sección de kits. Las verificaciones en navegador cubren escritorio, tablet y móvil, las imágenes, el desplazamiento horizontal y las reglas de accesibilidad WCAG A/AA de axe.

Para revisar localmente: `npm start` y abrir `http://localhost:4200/sobre-nosotros`.
