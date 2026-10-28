import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Psico T.O ando | Crecemos en familia',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'sobre-nosotros',
    title: 'Sobre nosotros | Psico T.O ando',
    loadComponent: () =>
      import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'nuestros-kits',
    title: 'Nuestros kits | Psico T.O ando',
    loadComponent: () =>
      import('./pages/kits/kits.component').then((m) => m.KitsComponent),
  },
  {
    path: 'asesoria-y-seguimiento',
    title: 'Asesoría y seguimiento | Psico T.O ando',
    loadComponent: () =>
      import('./pages/advisory/advisory.component').then(
        (m) => m.AdvisoryComponent,
      ),
  },
  {
    path: 'recursos-para-familias',
    title: 'Recursos para familias | Psico T.O ando',
    loadComponent: () =>
      import('./pages/resources/resources.component').then(
        (m) => m.ResourcesComponent,
      ),
  },
  {
    path: 'tienda',
    title: 'Tienda | Psico T.O ando',
    loadComponent: () =>
      import('./pages/shop/shop.component').then((m) => m.ShopComponent),
  },
  {
    path: 'carrito',
    title: 'Tu carrito | Psico T.O ando',
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    title: 'Finalizar compra | Psico T.O ando',
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(
        (m) => m.CheckoutComponent,
      ),
  },
  {
    path: 'pago/resultado',
    title: 'Resultado del pago | Psico T.O ando',
    loadComponent: () =>
      import('./pages/checkout/payment-result/payment-result.component').then(
        (m) => m.PaymentResultComponent,
      ),
  },
  {
    path: 'blog',
    title: 'Blog | Psico T.O ando',
    loadComponent: () =>
      import('./pages/blog/blog-list/blog-list.component').then(
        (m) => m.BlogListComponent,
      ),
  },
  {
    path: 'blog/:slug',
    title: 'Blog | Psico T.O ando',
    loadComponent: () =>
      import('./pages/blog/blog-post/blog-post.component').then(
        (m) => m.BlogPostComponent,
      ),
  },
  {
    path: 'iniciar-sesion',
    title: 'Iniciar sesión | Psico T.O ando',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'registro',
    title: 'Crear cuenta | Psico T.O ando',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña | Psico T.O ando',
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'restablecer-contrasena',
    title: 'Restablecer contraseña | Psico T.O ando',
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'mi-cuenta',
    title: 'Mi cuenta | Psico T.O ando',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/account/account.component').then(
        (m) => m.AccountComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Resumen | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'productos',
        title: 'Productos | Panel Psico T.O ando',
        loadComponent: () =>
          import(
            './pages/admin/products/product-list/product-list.component'
          ).then((m) => m.ProductListComponent),
      },
      {
        path: 'productos/nuevo',
        title: 'Nuevo producto | Panel Psico T.O ando',
        loadComponent: () =>
          import(
            './pages/admin/products/product-form/product-form.component'
          ).then((m) => m.ProductFormComponent),
      },
      {
        path: 'productos/:id',
        title: 'Editar producto | Panel Psico T.O ando',
        loadComponent: () =>
          import(
            './pages/admin/products/product-form/product-form.component'
          ).then((m) => m.ProductFormComponent),
      },
      {
        path: 'pedidos',
        title: 'Pedidos | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/orders/orders.component').then(
            (m) => m.OrdersComponent,
          ),
      },
      {
        path: 'pedidos/:id',
        title: 'Detalle del pedido | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/orders/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent,
          ),
      },
      {
        path: 'blog',
        title: 'Blog | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/blog/post-list/post-list.component').then(
            (m) => m.PostListComponent,
          ),
      },
      {
        path: 'blog/nuevo',
        title: 'Nuevo artículo | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/blog/post-editor/post-editor.component').then(
            (m) => m.PostEditorComponent,
          ),
      },
      {
        path: 'blog/:id',
        title: 'Editar artículo | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/blog/post-editor/post-editor.component').then(
            (m) => m.PostEditorComponent,
          ),
      },
      {
        path: 'imagenes',
        title: 'Imágenes de la web | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/site-images/site-images.component').then(
            (m) => m.AdminSiteImagesComponent,
          ),
      },
      {
        path: 'ajustes',
        title: 'Ajustes | Panel Psico T.O ando',
        loadComponent: () =>
          import('./pages/admin/settings/settings.component').then(
            (m) => m.AdminSettingsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
