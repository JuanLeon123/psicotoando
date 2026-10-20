# Checkout y pagos con Wompi

Flujo: `/carrito` → `/checkout` → Web Checkout de Wompi → `/pago/resultado?id=<transacción>`.

## Cuándo se puede pagar

`GET /api/payments/config` dice si el backend tiene las cuatro llaves de Wompi. Sin ellas:

- en el carrito, «Continuar al pago» queda deshabilitado con la nota «El pago en línea se activará muy pronto»;
- `/checkout` muestra el aviso y deshabilita «Pagar con Wompi»;
- si hay WhatsApp configurado, el carrito ofrece «Enviar pedido por WhatsApp».

## `/checkout`

- **Sin productos:** si el carrito está vacío, vuelve a `/carrito`.
- **Formulario:** datos de contacto (nombre, correo, celular, cédula) y de envío (departamento, ciudad, dirección e indicaciones opcionales).
  - Con la sesión iniciada, se rellena con el perfil.
  - Las reglas coinciden con el backend: celular colombiano de 10 dígitos (se acepta `+57`) y cédula de 5 a 15 dígitos.
- **Resumen:** precios del servidor (`POST /api/cart/quote`) y envío calculado con los ajustes del panel (`shippingFor`, el mismo cálculo que el backend).
- **«Pagar con Wompi»:** hace `POST /api/checkout`. El backend vuelve a calcular el carrito, crea el pedido pendiente y devuelve `{ reference, checkoutUrl, fields }`. `WompiRedirectService` envía entonces un formulario GET a `checkout.wompi.co`, porque Wompi necesita salir de la página, no un iframe.
- **Errores:**
  - 409: el carrito cambió. Se ajustan las cantidades, se quitan los productos no disponibles y se avisa.
  - 503: pagos desactivados.
  - 400: mensajes de validación en español.

## `/pago/resultado`

Wompi vuelve con `?id=<transacción>`. La página llama a `POST /api/checkout/verify`, que consulta Wompi desde el servidor y actualiza el pedido. Así funciona también en local, donde Wompi no puede llamar al webhook.

- **Aprobado:** agradecimiento, resumen del pedido y correo enmascarado. **Vacía el carrito.**
- **Pendiente** (PSE o efectivo pueden tardar): vuelve a consultar cada 4 s hasta 15 veces y después ofrece «Actualizar».
- **Rechazado, anulado o error:** explica que no hubo cobro y lleva al carrito, **sin vaciarlo**.
- **Sin `id`:** mensaje con enlaces a la tienda y al carrito.

## Panel

- `/admin/pedidos`: lista con búsqueda (referencia, nombre o correo), filtros por pago y envío, y paginación de 20 pedidos.
- `/admin/pedidos/:id`: productos, cliente y dirección, pago (medio, fecha, id de transacción y «Ver en Wompi») y cambio del estado de envío (Sin preparar, Preparando, Enviado, Entregado, Cancelado).
- **Resumen:** ventas, pedidos pagados, ticket promedio y pedidos por enviar de los últimos 30 días, gráfico de ventas por día, lo más vendido y el total desde el inicio.
- **Ajustes:** valor del envío (0 = gratis) y «Envío gratis desde», más una tarjeta con el estado de Wompi, los pasos para configurarlo y la URL de eventos para copiar.
- **Mi cuenta:** «Mis pedidos» lista los pedidos hechos con la sesión iniciada.

## Archivos

```text
src/app/core/orders/                 Modelos, OrdersService, WompiRedirectService y fechas
src/app/pages/checkout/              Checkout, validadores y página de resultado
src/app/pages/admin/orders/          Lista y detalle de pedidos
src/app/pages/account/components/my-orders/
```

## Probar en local

1. Pon las llaves de **pruebas** de Wompi en `backend/.env` y ejecuta `docker compose up -d --force-recreate backend`.
2. Da precio a un kit desde el panel y cómpralo.
3. En Wompi, paga con `4242 4242 4242 4242` (aprobada) o `4111 1111 1111 1111` (rechazada), con cualquier fecha futura y CVC.
4. Al volver, `/pago/resultado` confirma el pago y el pedido aparece en el panel. Los correos llegan a Mailpit (http://localhost:8025).
