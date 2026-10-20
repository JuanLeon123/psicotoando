# Tienda

Ruta: `/tienda`. Se abre desde el carrito del menú, «Tienda» en el footer y los botones de kits de la portada.

## Datos

Los productos se crean y publican en el panel de administración (`/admin/productos`). La tienda y la portada leen la misma API pública:

| Llamada | Uso |
| --- | --- |
| `GET /api/products` | Productos publicados, en el orden del panel |
| `GET /api/settings` | WhatsApp, correo y redes (los carga `AppComponent` una vez) |

Cada producto trae nombre, descripción, contenidos, actividades, precio en pesos (`priceCop`, `null` = «Precio próximamente»), disponibilidad (`inStock`) e imagen. La imagen puede ser de la web (`images/...`) o subida desde el panel (`/api/uploads/...`), por eso se usa `<img>` con `loading="lazy"` en lugar de `NgOptimizedImage`.

## Comportamiento

- Tarjetas en cuadrícula (3 columnas en escritorio, 2 en tablet, 1 en móvil) con imagen, nombre, actividades, descripción y precio. Los productos sin stock muestran «Agotado».
- «Ver detalle» abre la ficha informativa con los contenidos y el precio.
- Los productos con precio y stock tienen «Añadir al carrito», tanto en la tarjeta como en la ficha. Los que aún no tienen precio ofrecen «Preguntar por WhatsApp» si hay un número configurado en el panel.
- Estados de carga (marcadores), error (con «Intentar de nuevo») y catálogo vacío.

## Carrito (`/carrito`)

- **Dónde se guarda:** en el navegador (`localStorage`, clave `pt-cart-v1`), así que funciona sin iniciar sesión y se sincroniza entre pestañas. Solo guarda `productId` y cantidad. Al leerlo, se descartan las entradas manipuladas.
- **Precios:** nunca los calcula el navegador. La página pide `POST /api/cart/quote` en cada cambio y muestra lo que devuelve el backend: precio unitario, total por línea, subtotal e incidencias.
- **Incidencias:** un producto retirado, sin precio o agotado se marca y bloquea el pago hasta quitarlo. Si hay menos unidades de las pedidas, el carrito ajusta la cantidad y lo explica.
- **Límites:** hasta 20 productos distintos y 20 unidades de cada uno, los mismos que aplica el backend.
- **Navbar:** el icono lleva al carrito y muestra el número de unidades. Al añadir un producto aparece un aviso flotante con «Ver carrito», que se cierra solo a los 5 segundos.
- **Pago:** «Continuar al pago» está deshabilitado hasta integrar Wompi. Mientras tanto, si hay WhatsApp configurado, «Enviar pedido por WhatsApp» manda el resumen del carrito.

## Archivos

```text
src/app/pages/shop/                 Página de la tienda y su spec
src/app/pages/cart/                 Página del carrito y su spec
src/app/core/cart/                  CartService (localStorage + cotización) y modelos
src/app/shared/catalog/
  product-dialog.ts                 Ficha de producto y mensaje de WhatsApp
  testing.ts                        Productos de prueba para los specs
src/app/core/catalog/               Modelos, servicio y formato de precios
src/app/core/settings/              Ajustes del sitio y enlace de WhatsApp
```
