# Homepage de Psico T.O ando

Implementación de las referencias de escritorio y móvil en Angular 19, con componentes standalone, SCSS y detección de cambios `OnPush`.

## Ejecutar

```bash
npm install
npm start
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

En macOS, si Karma no encuentra Chrome:

```bash
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test -- --watch=false --browsers=ChromeHeadless
```

## Organización

```text
src/app/
  components/                 Navbar y footer del sitio
  core/
    catalog/                  Productos de la tienda (API) y formato de precios
    settings/                 Contacto y redes editables desde el panel
    services/                 Estado compartido de la ventana informativa
  pages/home/
    components/
      hero/                   Portada y llamadas a la acción
      benefits/               Beneficios de la propuesta
      kits/                   Primeros kits publicados (GET /api/products)
      kit-card/               Tarjeta de producto con input/output
    data/home.data.ts         Contenido de los beneficios
    home.component.*          Composición de la homepage
  shared/components/
    icon/                     Iconos SVG tipados
    decorative-leaves/        Decoración visual
    info-dialog/              Ventana accesible basada en dialog nativo
src/styles/_tokens.scss       Paleta y puntos de quiebre
src/styles.scss               Variables CSS, tipografía y estilos compartidos
public/images/                Imágenes locales y marca provisional
public/fonts/                 Nunito y su licencia
```

La ruta Home carga con `loadComponent`. Los kits salen del catálogo que se gestiona en el panel de administración; los enlaces «Conoce nuestros kits» y «Ver todos los kits» llevan a la tienda (`/tienda`). La navegación de móvil usa una señal local; el estado compartido de las ventanas se encapsula en un servicio. Las tarjetas emiten la selección y el componente contenedor abre los detalles.

Los colores se editan en `_tokens.scss` y se exponen como propiedades personalizadas en `styles.scss`. El CSS de Bootstrap y su JavaScript no se cargan en esta homepage: la maquetación usa CSS Grid y Flexbox. La dependencia existente permanece instalada.

## Comportamiento de esta primera entrega

- Inicio abre la homepage; el carrito lleva a la tienda. Al final, «Sigue explorando» enlaza con Sobre nosotros, Asesoría y Recursos.
- La sección de kits muestra los tres primeros productos publicados, con su precio; cada tarjeta abre su ficha. Mientras carga muestra marcadores y, si no hay productos, un mensaje breve.
- Sobre nosotros abre la página `/sobre-nosotros`. Recursos para familias muestra contenido introductorio provisional.
- Agenda una asesoría abre la ficha informativa. Si en el panel hay un WhatsApp configurado, ofrece «Escribir por WhatsApp»; si no, indica que el canal de reservas está pendiente.
- Las redes del footer y de Asesoría se convierten en enlaces cuando el panel tiene sus URL; el correo de contacto aparece en el footer si está configurado.
- Aún no hay pagos ni pedidos en línea: ver [shop.md](shop.md).

Las fotografías y la marca son provisionales. Su procedencia, archivos y prompts se documentan en [image-assets.md](image-assets.md).

## Validación

- Compilación de producción dentro de los presupuestos configurados.
- Nueve pruebas de integración con Jasmine/Karma para renderizado de ruta, menú, navegación por fragmentos, detalles de kit, aviso de asesoría y redirección de rutas desconocidas.
- Revisión en Chrome a 320, 375, 390, 430, 640, 768, 1024, 1280 y 1592 píxeles: sin desbordamiento horizontal ni imágenes rotas.
- Revisión automatizada con axe de la homepage en móvil y escritorio y de la ventana de kit, con reglas WCAG A/AA: sin incidencias detectadas. Esta comprobación no sustituye una auditoría manual completa.
- Menú y ventanas probados con Escape; el dialog nativo gestiona el foco y el bloqueo del contenido de fondo.

Las capturas locales de revisión están en `tmp/screenshots/` (directorio ignorado por Git).
