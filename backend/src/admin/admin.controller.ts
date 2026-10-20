import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ProductsService } from '../catalog/products.service';
import {
  OrdersStatsService,
  SalesSummary,
} from '../orders/orders-stats.service';
import { UsersService } from '../users/users.service';

export interface AdminSummary {
  readonly customers: { readonly total: number; readonly last30Days: number };
  readonly products: { readonly total: number; readonly published: number };
  readonly sales: SalesSummary;
}

@Controller('admin')
@UseGuards(AccessTokenGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly products: ProductsService,
    private readonly orderStats: OrdersStatsService,
  ) {}

  /** Cifras para la portada del panel: clientes, catálogo y ventas aprobadas. */
  @Get('summary')
  async summary(): Promise<AdminSummary> {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const [total, last30Days, productTotal, published, sales] =
      await Promise.all([
        this.users.countCustomers(),
        this.users.countCustomers(since),
        this.products.countAll(),
        this.products.countPublished(),
        this.orderStats.summary(),
      ]);
    return {
      customers: { total, last30Days },
      products: { total: productTotal, published },
      sales,
    };
  }
}
