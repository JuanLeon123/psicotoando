# Blog

Artículos con texto, fotos y videos, escritos desde el panel de administración y publicados en `/blog`.

## Rutas

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/blog` | Libre | Listado de artículos publicados, filtro por categoría y «Cargar más» (9 por página) |
| `/blog/:slug` | Libre | Artículo completo, con «Sigue leyendo» (hasta 3 artículos recientes) |
| `/admin/blog` | Administración | Lista de artículos (publicados, programados y borradores), búsqueda y borrado |
| `/admin/blog/nuevo` | Administración | Editor de un artículo nuevo |
| `/admin/blog/:id` | Administración | Editor de un artículo existente |

## Bloques

El contenido de un artículo es una lista ordenada de bloques:

| Bloque | Qué guarda |
| --- | --- |
| Párrafo | Texto; se respetan los saltos de línea |
| Subtítulo | Texto corto (h2) |
| Imagen | Imagen de la biblioteca, descripción obligatoria y pie de foto opcional |
| Galería | De 1 a 12 imágenes con su descripción. Al pulsar una se amplía |
| Video subido | MP4 o WebM de la biblioteca, con controles nativos |
| Video de YouTube | Cualquier enlace de YouTube; se guarda solo el id del video |
| Cita | Texto y autor opcional |
| Lista | Un elemento por línea |

`PostBlocksComponent` (`pages/blog/post-blocks`) pinta los bloques tanto en el artículo público como en la vista previa del editor. Cada tipo tiene su plantilla y el texto se interpola siempre como texto, nunca con `innerHTML`. Los videos de YouTube se incrustan desde `youtube-nocookie.com`, y solo después de validar que el id tiene el formato de YouTube.

## Editor

- **Datos y publicación:** título, resumen (hasta 300 caracteres), categoría (sugiere las ya usadas), portada, estado publicado o borrador, y fecha de publicación opcional. Si la fecha queda vacía, se usa el momento de publicar; una fecha futura programa el artículo.
- **Bloques:** se añaden con «Añadir bloque», se ordenan con las flechas y se eliminan con la X. Antes de guardar se comprueba cada bloque y el aviso indica cuál está incompleto.
- **Biblioteca:** imágenes y videos se eligen o se suben desde una ventana (`MediaPickerComponent`) con barra de progreso. El navegador comprueba tipo y tamaño (imágenes de hasta 5 MB, videos de hasta 80 MB) y el servidor vuelve a validarlo por el contenido real del archivo.
- **Vista previa:** muestra el artículo tal como se verá en la web.
- **Cambios sin guardar:** si intentas cerrar la pestaña con cambios pendientes, el navegador avisa.

## Código

```text
src/app/core/blog/
  blog.models.ts              Tipos, límites y formato de fecha
  blog.service.ts             API pública (/api/blog/posts)
  admin-blog-api.service.ts   API del panel (artículos y biblioteca)
  youtube.ts                  Id de YouTube a partir de un enlace
src/app/pages/blog/
  blog-list/                  /blog
  blog-post/                  /blog/:slug
  post-blocks/                Renderizado de bloques (compartido)
src/app/pages/admin/blog/
  post-list/                  /admin/blog
  post-editor/                Editor y lógica de bloques (editor-blocks.ts)
  media-picker/               Biblioteca de fotos y videos
```
