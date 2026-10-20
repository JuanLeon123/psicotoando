# Panel de administración

Ruta: `/admin`. Solo entra la cuenta fija de administración (`ADMIN_EMAIL` / `ADMIN_PASSWORD` en `backend/.env`). Al iniciar sesión con ella en `/iniciar-sesion` se abre el panel. En la web pública, el acceso de cuenta del navbar y del footer muestra «Panel».

## Secciones

| Ruta | Contenido |
| --- | --- |
| `/admin` | Resumen: clientes registrados, nuevos en 30 días, productos publicados y accesos rápidos |
| `/admin/productos` | Lista con búsqueda, publicar o pasar a borrador, editar y eliminar (con confirmación) |
| `/admin/productos/nuevo` | Crear producto. Al guardar se crea, se sube la imagen y se abre su edición |
| `/admin/productos/:id` | Editar producto, con vista previa de cómo se verá en la tienda |
| `/admin/pedidos` | Vacío hasta que exista el checkout con la pasarela de pago (Wompi) |
| `/admin/ajustes` | WhatsApp, correo de contacto, Instagram y Facebook |

## Cómo se conecta con la web pública

- **Productos:** la tienda (`/tienda`) y la sección de kits de la portada leen `GET /api/products`, que devuelve los productos publicados en el orden del campo «Orden en la tienda». Un borrador solo se ve en el panel.
- **Precio:** pesos colombianos sin decimales. Vacío = «Precio próximamente».
- **Inventario:** vacío = sin control; 0 = «Agotado».
- **Ajustes:** con WhatsApp configurado, «Agenda una asesoría» y la ficha de cada kit ofrecen escribir por WhatsApp con un mensaje ya redactado. Instagram, Facebook y el correo aparecen como enlaces en el footer y en la página de Asesoría. Sin ellos, la web muestra «Enlaces disponibles próximamente».

## Protección

- **Rutas:** `adminGuard` envía a quien no tiene sesión a iniciar sesión, y a los clientes, a la portada.
- **API:** toda la API `/api/admin/*` exige el rol `admin`, así que el guard del frontend es solo comodidad.
- **Layout:** el panel no muestra el navbar ni el footer públicos (`AppComponent.isAdminArea`).

## Código

```text
src/app/core/admin/          AdminApiService y modelos del resumen
src/app/core/catalog/        Modelos de producto, ProductsService (público) y formatCop
src/app/core/settings/       SiteSettingsService (se carga al arrancar) y enlace de WhatsApp
src/app/pages/admin/         Layout, resumen, productos (lista y formulario), pedidos y ajustes
```
