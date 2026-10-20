import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { RequestAuth } from '../auth/guards/access-token.guard';
import { CurrentAuth } from '../auth/guards/current-auth.decorator';
import { OrderSummary, toOrderSummary } from './order.views';
import { OrdersService } from './orders.service';

@Controller('users/me/orders')
@UseGuards(AccessTokenGuard)
export class MyOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  async list(@CurrentAuth() auth: RequestAuth): Promise<OrderSummary[]> {
    return (await this.orders.listForUser(auth.userId)).map(toOrderSummary);
  }
}
