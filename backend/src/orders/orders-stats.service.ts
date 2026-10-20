import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SalesTotals {
  readonly approvedOrders: number;
  readonly revenueCop: number;
  readonly averageTicketCop: number;
}

export interface SalesSummary {
  readonly last30Days: SalesTotals;
  readonly allTime: SalesTotals;
  /** Pedidos pagados que aún no se han enviado. */
  readonly pendingToShip: number;
  readonly topProducts: readonly { name: string; units: number }[];
  /** Un punto por día (hora de Colombia), del más antiguo al de hoy. */
  readonly dailyRevenue: readonly { date: string; revenueCop: number }[];
}

const TIME_ZONE = 'America/Bogota';
const DAYS = 30;

/** Cifras de ventas para el resumen del panel; solo cuentan pedidos aprobados. */
@Injectable()
export class OrdersStatsService {
  constructor(private readonly db: DataSource) {}

  async summary(): Promise<SalesSummary> {
    const [recent, allTime, toShip, top, daily] = await Promise.all([
      this.totals(`AND paid_at >= now() - interval '${DAYS} days'`),
      this.totals(''),
      this.db.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM orders
          WHERE status = 'approved' AND fulfillment IN ('unfulfilled', 'preparing')`,
      ),
      this.db.query<{ name: string; units: number }[]>(
        `SELECT i.product_name AS name, SUM(i.quantity)::int AS units
           FROM order_items i JOIN orders o ON o.id = i.order_id
          WHERE o.status = 'approved' AND o.paid_at >= now() - interval '${DAYS} days'
          GROUP BY i.product_name
          ORDER BY units DESC, name
          LIMIT 5`,
      ),
      this.db.query<{ date: string; revenue: number }[]>(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
                COALESCE(SUM(o.total_cop), 0)::bigint AS revenue
           FROM generate_series(
                  (now() AT TIME ZONE '${TIME_ZONE}')::date - ${DAYS - 1},
                  (now() AT TIME ZONE '${TIME_ZONE}')::date,
                  interval '1 day') AS d(day)
           LEFT JOIN orders o
             ON o.status = 'approved'
            AND (o.paid_at AT TIME ZONE '${TIME_ZONE}')::date = d.day::date
          GROUP BY d.day
          ORDER BY d.day`,
      ),
    ]);
    return {
      last30Days: recent,
      allTime,
      pendingToShip: toShip[0]?.count ?? 0,
      topProducts: top,
      dailyRevenue: daily.map((d) => ({
        date: d.date,
        revenueCop: Number(d.revenue),
      })),
    };
  }

  private async totals(extraWhere: string): Promise<SalesTotals> {
    const [row] = await this.db.query<{ orders: number; revenue: string }[]>(
      `SELECT COUNT(*)::int AS orders, COALESCE(SUM(total_cop), 0)::bigint AS revenue
         FROM orders WHERE status = 'approved' ${extraWhere}`,
    );
    const approvedOrders = row?.orders ?? 0;
    const revenueCop = Number(row?.revenue ?? 0);
    return {
      approvedOrders,
      revenueCop,
      averageTicketCop: approvedOrders
        ? Math.round(revenueCop / approvedOrders)
        : 0,
    };
  }
}
