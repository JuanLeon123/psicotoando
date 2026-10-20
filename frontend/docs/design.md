# Reglas de diseño

El sitio busca ser tranquilo y fácil de leer: misma marca, poco ruido visual y una acción clara en cada sección.

## Principios

- **Diseño minimalista** (heurística 8 de Nielsen Norman Group): cada elemento extra compite con lo importante.
- **Proximidad** (Gestalt): se agrupa con espacio, no con cajas de distintos colores.
- **Una acción principal por sección** (ley de Hick): el resto, como enlace o botón outline.
- **Legibilidad**: cuerpo de 16 px o más, interlineado 1.5–1.7 y líneas de 50–75 caracteres (`--measure`).
- **Color 60-30-10**: blanco como base, crema (`--color-cream`) como superficie y teal, coral y oliva solo como acento (iconos, números, una palabra del H1).
- **Accesibilidad (WCAG 2.2 AA)**: contraste 4.5:1 en texto, objetivos táctiles de 44 px o más y foco visible.

## Tokens (`src/styles.scss`)

| Token | Uso |
| --- | --- |
| `--space-1` … `--space-7` | Escala de 8 px: 8, 16, 24, 32, 48, 64, 96 |
| `--section-gap` | Separación entre secciones de una página |
| `--page-top` / `--page-bottom` | Espacio bajo el navbar y antes del footer (clase `.page`) |
| `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-lead`, `--fs-small` | Escala tipográfica |
| `--measure` | Ancho máximo de los párrafos |

Clases compartidas: `.page`, `.section-title`, `.lead`, `.eyebrow` y `.button--*`.

## Reglas

1. Sin decoración de relleno (ondas, puntos, ramas de fondo). Como mucho un acento decorativo por página.
2. Títulos en `--color-heading`; como mucho una palabra con color de acento en el H1.
3. Nada de texto por debajo de 14 px, salvo metadatos (13 px). Negrita solo en una frase corta por párrafo.
4. Las tarjetas de una misma vista comparten superficie, radio (`--radius-card`) y padding (24–32 px).
5. Cada página termina en blanco con `--page-bottom`; el footer no tiene margen superior.
6. En móvil: una columna, sin decoración y tablas convertidas en tarjetas.
