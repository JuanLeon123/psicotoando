import { ADMIN_EMAIL, ADMIN_PASSWORD, PREVIOUS_ENV } from './admin-env';
import { WOMPI_TEST_KEYS } from './wompi-env';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { MailService } from '../src/mail/mail.service';
import { WompiService, WompiTransaction } from '../src/orders/wompi.service';
import { AdminAccountService } from '../src/users/admin-account.service';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('Checkout, Wompi and orders (e2e)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const mails: { kind: string; to: string; reference: string }[] = [];
  const wompiTransactions = new Map<string, WompiTransaction>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({
        sendPasswordReset: () => Promise.resolve(),
        sendOrderConfirmation: (order: {
          customerEmail: string;
          reference: string;
        }) => {
          mails.push({
            kind: 'customer',
            to: order.customerEmail,
            reference: order.reference,
          });
          return Promise.resolve();
        },
        sendNewOrderNotification: (
          to: string,
          order: { reference: string },
        ) => {
          mails.push({ kind: 'admin', to, reference: order.reference });
          return Promise.resolve();
        },
      })
      .overrideProvider(WompiService)
      .useValue({
        getTransaction: (id: string) => {
          const tx = wompiTransactions.get(id);
          return tx
            ? Promise.resolve(tx)
            : Promise.reject(new Error('no existe'));
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(DataSource);
  });

  beforeEach(async () => {
    await db.query(
      'TRUNCATE order_items, orders, password_reset_tokens, sessions, users, products RESTART IDENTITY CASCADE',
    );
    await db.query(
      'UPDATE site_settings SET shipping_flat_cop = 12000, free_shipping_from_cop = 300000',
    );
    await app.get(AdminAccountService).onApplicationBootstrap();
    mails.length = 0;
    wompiTransactions.clear();
  });

  afterAll(async () => {
    await db.query(
      'UPDATE site_settings SET shipping_flat_cop = 0, free_shipping_from_cop = NULL',
    );
    await app.close();
    await rm(process.env.UPLOADS_DIR!, { recursive: true, force: true });
    process.env = PREVIOUS_ENV;
  });

  const api = () => request(app.getHttpServer());

  async function token(email: string, password: string): Promise<string> {
    const res = await api()
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  }
  const adminToken = () => token(ADMIN_EMAIL, ADMIN_PASSWORD);

  async function customerToken(email = 'ana@example.com'): Promise<string> {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'Ana Cliente', email, password: 'secreta123' })
      .expect(201);
    return (res.body as { accessToken: string }).accessToken;
  }

  async function product(
    body: { priceCop: number; stock?: number | null; name?: string } = {
      priceCop: 120000,
    },
  ): Promise<string> {
    // El token se pide antes: supertest cierra su servidor efímero entre peticiones.
    const admin = await adminToken();
    const res = await api()
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        name: body.name ?? 'Kit Desarrollo Sensorial',
        summary: 'Texturas y colores para jugar en familia.',
        priceCop: body.priceCop,
        stock: body.stock ?? null,
        published: true,
      })
      .expect(201);
    return (res.body as { id: string }).id;
  }

  function checkoutBody(items: { productId: string; quantity: number }[]) {
    return {
      items,
      customer: {
        fullName: 'Ana Pérez',
        email: 'Ana@Example.com',
        phone: '+57 300 123 4567',
        document: '1.020.304.050',
      },
      shipping: {
        department: 'Antioquia',
        city: 'Medellín',
        address: 'Calle 10 # 43-20, apto 501',
        notes: '',
      },
    };
  }

  interface Session {
    reference: string;
    checkoutUrl: string;
    fields: Record<string, string>;
  }

  async function checkout(
    items: { productId: string; quantity: number }[],
    bearer?: string,
  ): Promise<Session> {
    const req = api().post('/api/checkout');
    if (bearer) req.set('Authorization', `Bearer ${bearer}`);
    const res = await req.send(checkoutBody(items)).expect(201);
    return res.body as Session;
  }

  function signedEvent(
    transaction: WompiTransaction,
    secret: string = WOMPI_TEST_KEYS.WOMPI_EVENTS_SECRET,
  ) {
    const timestamp = 1760000000;
    const properties = [
      'transaction.id',
      'transaction.status',
      'transaction.amount_in_cents',
    ];
    const checksum = sha256(
      `${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${secret}`,
    ).toUpperCase();
    return {
      event: 'transaction.updated',
      data: { transaction },
      environment: 'test',
      signature: { properties, checksum },
      timestamp,
      sent_at: new Date().toISOString(),
    };
  }

  function transaction(
    session: Session,
    status: string,
    overrides: Partial<WompiTransaction> = {},
  ): WompiTransaction {
    return {
      id: `1234-${status}-${session.reference.slice(-4)}`,
      status,
      reference: session.reference,
      amount_in_cents: Number(session.fields['amount-in-cents']),
      currency: 'COP',
      payment_method_type: 'CARD',
      ...overrides,
    };
  }

  const stockOf = async (id: string) =>
    (
      await db.query<{ stock: number | null }[]>(
        'SELECT stock FROM products WHERE id = $1',
        [id],
      )
    )[0].stock;

  it('reports that payments are enabled without exposing keys', async () => {
    const res = await api().get('/api/payments/config').expect(200);
    expect(res.body).toEqual({ enabled: true, environment: 'sandbox' });
    expect(JSON.stringify(res.body)).not.toContain('prv_test');
  });

  it('creates a pending order and a correctly signed Wompi checkout', async () => {
    const id = await product({ priceCop: 120000, stock: 5 });
    const session = await checkout([{ productId: id, quantity: 1 }]);

    expect(session.reference).toMatch(/^PT-\d{8}-[A-Z0-9]{10}$/);
    expect(session.checkoutUrl).toBe('https://checkout.wompi.co/p/');
    const amount = String((120000 + 12000) * 100);
    expect(session.fields).toMatchObject({
      'public-key': WOMPI_TEST_KEYS.WOMPI_PUBLIC_KEY,
      currency: 'COP',
      'amount-in-cents': amount,
      reference: session.reference,
      'redirect-url': 'http://localhost:4200/pago/resultado',
      'customer-data:email': 'ana@example.com',
      'customer-data:phone-number': '3001234567',
      'customer-data:legal-id': '1020304050',
      'shipping-address:region': 'Antioquia',
    });
    expect(session.fields['signature:integrity']).toBe(
      sha256(
        `${session.reference}${amount}COP${WOMPI_TEST_KEYS.WOMPI_INTEGRITY_SECRET}`,
      ),
    );
    expect(JSON.stringify(session)).not.toContain(
      WOMPI_TEST_KEYS.WOMPI_INTEGRITY_SECRET,
    );

    const [order] = await db.query<
      { status: string; total_cop: number; user_id: string | null }[]
    >('SELECT status, total_cop, user_id FROM orders');
    expect(order).toEqual({
      status: 'pending',
      total_cop: 132000,
      user_id: null,
    });
    const items = await db.query<{ product_name: string; quantity: number }[]>(
      'SELECT product_name, quantity FROM order_items',
    );
    expect(items).toEqual([
      { product_name: 'Kit Desarrollo Sensorial', quantity: 1 },
    ]);
    expect(await stockOf(id)).toBe(5);
  });

  it('applies free shipping from the threshold and links signed-in customers', async () => {
    const customer = await customerToken();
    const id = await product({ priceCop: 120000 });
    const session = await checkout([{ productId: id, quantity: 3 }], customer);
    expect(session.fields['amount-in-cents']).toBe(String(360000 * 100));

    const mine = await api()
      .get('/api/users/me/orders')
      .set('Authorization', `Bearer ${customer}`)
      .expect(200);
    expect(mine.body).toEqual([
      expect.objectContaining({
        reference: session.reference,
        status: 'pending',
        itemCount: 3,
        totalCop: 360000,
      }),
    ]);
    const other = await customerToken('otra@example.com');
    const none = await api()
      .get('/api/users/me/orders')
      .set('Authorization', `Bearer ${other}`)
      .expect(200);
    expect(none.body).toEqual([]);
  });

  it('validates the checkout in Spanish and rejects carts that changed', async () => {
    const id = await product({ priceCop: 50000, stock: 2 });
    const invalid = await api()
      .post('/api/checkout')
      .send({
        ...checkoutBody([{ productId: id, quantity: 1 }]),
        customer: {
          fullName: 'A',
          email: 'no',
          phone: '123',
          document: 'abc',
        },
        shipping: { department: 'Narnia', city: '', address: 'x' },
      })
      .expect(400);
    expect(invalid.body.message).toEqual(
      expect.arrayContaining([
        'El nombre debe tener entre 2 y 120 caracteres.',
        'Introduce un correo electrónico válido.',
        'Escribe un celular colombiano de 10 dígitos, por ejemplo 300 123 4567.',
        'La cédula debe tener entre 5 y 15 dígitos, sin puntos.',
        'Elige un departamento.',
        'Escribe la ciudad o municipio.',
      ]),
    );

    const stale = await api()
      .post('/api/checkout')
      .send(checkoutBody([{ productId: id, quantity: 5 }]))
      .expect(409);
    expect(stale.body.message).toBe(
      'Tu carrito cambió: revisa los productos y las cantidades antes de pagar.',
    );
    expect(stale.body.quote.lines[0]).toMatchObject({
      issue: 'limited_stock',
      quantity: 2,
    });
    await api().post('/api/checkout').send(checkoutBody([])).expect(409);
    expect(await db.query('SELECT id FROM orders')).toEqual([]);
  });

  describe('Wompi events', () => {
    it('rejects events with an invalid signature', async () => {
      const id = await product({ priceCop: 120000, stock: 5 });
      const session = await checkout([{ productId: id, quantity: 1 }]);
      const forged = signedEvent(
        transaction(session, 'APPROVED'),
        'otro-secreto',
      );
      await api().post('/api/payments/wompi/events').send(forged).expect(401);
      await api()
        .post('/api/payments/wompi/events')
        .send({ event: 'transaction.updated', data: {} })
        .expect(401);
      const [order] = await db.query<{ status: string }[]>(
        'SELECT status FROM orders',
      );
      expect(order.status).toBe('pending');
    });

    it('approves the order once: stock and emails are applied a single time', async () => {
      const id = await product({ priceCop: 120000, stock: 5 });
      const session = await checkout([{ productId: id, quantity: 2 }]);
      const approved = signedEvent(transaction(session, 'APPROVED'));

      await api().post('/api/payments/wompi/events').send(approved).expect(200);
      await api().post('/api/payments/wompi/events').send(approved).expect(200);
      // Un evento atrasado no devuelve el pedido a pendiente.
      await api()
        .post('/api/payments/wompi/events')
        .send(signedEvent(transaction(session, 'PENDING')))
        .expect(200);

      const [order] = await db.query<
        {
          status: string;
          paid_at: Date | null;
          stock_applied: boolean;
          payment_method: string;
          wompi_transaction_id: string;
        }[]
      >(
        'SELECT status, paid_at, stock_applied, payment_method, wompi_transaction_id FROM orders',
      );
      expect(order.status).toBe('approved');
      expect(order.paid_at).not.toBeNull();
      expect(order.stock_applied).toBe(true);
      expect(order.payment_method).toBe('CARD');
      expect(order.wompi_transaction_id).toBe(
        transaction(session, 'APPROVED').id,
      );
      expect(await stockOf(id)).toBe(3);
      expect(mails).toEqual([
        {
          kind: 'customer',
          to: 'ana@example.com',
          reference: session.reference,
        },
        { kind: 'admin', to: ADMIN_EMAIL, reference: session.reference },
      ]);

      const pub = await api()
        .get(`/api/orders/${session.reference}`)
        .expect(200);
      expect(pub.body).toMatchObject({
        status: 'approved',
        totalCop: 252000,
        emailMasked: 'an•••@example.com',
        items: [expect.objectContaining({ quantity: 2 })],
      });
      expect(JSON.stringify(pub.body)).not.toContain('1020304050');
      await api().get('/api/orders/PT-00000000-XXXXXXXXXX').expect(404);
      await api().get('/api/orders/cualquier-cosa').expect(404);
    });

    it('restores stock once when an approved payment is voided', async () => {
      const id = await product({ priceCop: 120000, stock: 5 });
      const session = await checkout([{ productId: id, quantity: 2 }]);
      await api()
        .post('/api/payments/wompi/events')
        .send(signedEvent(transaction(session, 'APPROVED')))
        .expect(200);
      expect(await stockOf(id)).toBe(3);

      const voided = signedEvent(transaction(session, 'VOIDED'));
      await api().post('/api/payments/wompi/events').send(voided).expect(200);
      await api().post('/api/payments/wompi/events').send(voided).expect(200);
      // Un aprobado atrasado no vuelve a descontar un pedido anulado.
      await api()
        .post('/api/payments/wompi/events')
        .send(signedEvent(transaction(session, 'APPROVED')))
        .expect(200);

      const [order] = await db.query<
        { status: string; stock_applied: boolean; fulfillment: string }[]
      >('SELECT status, stock_applied, fulfillment FROM orders');
      expect(order).toEqual({
        status: 'voided',
        stock_applied: false,
        fulfillment: 'cancelled',
      });
      expect(await stockOf(id)).toBe(5);
    });

    it('ignores amount mismatches and leaves stock alone on declined payments', async () => {
      const id = await product({ priceCop: 120000, stock: 5 });
      const tampered = await checkout([{ productId: id, quantity: 1 }]);
      await api()
        .post('/api/payments/wompi/events')
        .send(
          signedEvent(
            transaction(tampered, 'APPROVED', { amount_in_cents: 100 }),
          ),
        )
        .expect(200);

      const declined = await checkout([{ productId: id, quantity: 1 }]);
      await api()
        .post('/api/payments/wompi/events')
        .send(signedEvent(transaction(declined, 'DECLINED')))
        .expect(200);

      const rows = await db.query<{ reference: string; status: string }[]>(
        'SELECT reference, status FROM orders',
      );
      const statusOf = (ref: string) =>
        rows.find((r) => r.reference === ref)?.status;
      expect(statusOf(tampered.reference)).toBe('pending');
      expect(statusOf(declined.reference)).toBe('declined');
      expect(await stockOf(id)).toBe(5);
      expect(mails).toEqual([]);
    });

    it('answers 200 to valid events for unknown references', async () => {
      await api()
        .post('/api/payments/wompi/events')
        .send(
          signedEvent({
            id: 'x-1',
            status: 'APPROVED',
            reference: 'PT-20260101-AAAAAAAAAA',
            amount_in_cents: 100,
            currency: 'COP',
          }),
        )
        .expect(200);
    });
  });

  it('verifies the payment with Wompi when the customer comes back', async () => {
    const id = await product({ priceCop: 120000, stock: null });
    const session = await checkout([{ productId: id, quantity: 1 }]);
    const tx = transaction(session, 'APPROVED', { payment_method_type: 'PSE' });
    wompiTransactions.set(tx.id, tx);

    const res = await api()
      .post('/api/checkout/verify')
      .send({ transactionId: tx.id })
      .expect(200);
    expect(res.body).toMatchObject({
      reference: session.reference,
      status: 'approved',
      paymentMethod: 'PSE',
    });
    expect(await stockOf(id)).toBeNull();
    await api()
      .post('/api/checkout/verify')
      .send({ transactionId: 'no existe!' })
      .expect(400);
  });

  it('lets the admin list, inspect and fulfil orders, with sales metrics', async () => {
    const id = await product({
      priceCop: 120000,
      stock: 10,
      name: 'Kit Motricidad',
    });
    const paid = await checkout([{ productId: id, quantity: 2 }]);
    await api()
      .post('/api/payments/wompi/events')
      .send(signedEvent(transaction(paid, 'APPROVED')))
      .expect(200);
    await checkout([{ productId: id, quantity: 1 }]);

    const admin = await adminToken();
    const customer = await customerToken();
    await api()
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${customer}`)
      .expect(403);

    const list = await api()
      .get('/api/admin/orders?status=approved')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    const orderId = (list.body.items as { id: string }[])[0].id;
    const search = await api()
      .get(`/api/admin/orders?q=${paid.reference.slice(-6)}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(search.body.total).toBe(1);

    const detail = await api()
      .get(`/api/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(detail.body).toMatchObject({
      reference: paid.reference,
      customerDocument: '1020304050',
      shipping: { department: 'Antioquia', city: 'Medellín' },
      fulfillment: 'unfulfilled',
    });

    const shipped = await api()
      .patch(`/api/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ fulfillment: 'shipped' })
      .expect(200);
    expect(shipped.body.fulfillment).toBe('shipped');
    await api()
      .patch(`/api/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ fulfillment: 'perdido' })
      .expect(400);

    const summary = await api()
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    // Los ingresos son lo cobrado: 2 × $120.000 + $12.000 de envío.
    expect(summary.body.sales).toMatchObject({
      last30Days: {
        approvedOrders: 1,
        revenueCop: 252000,
        averageTicketCop: 252000,
      },
      allTime: { approvedOrders: 1, revenueCop: 252000 },
      pendingToShip: 0,
      topProducts: [{ name: 'Kit Motricidad', units: 2 }],
    });
    const daily = summary.body.sales.dailyRevenue as { revenueCop: number }[];
    expect(daily).toHaveLength(30);
    expect(daily.reduce((sum, d) => sum + d.revenueCop, 0)).toBe(252000);
  });
});
