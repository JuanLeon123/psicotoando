import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  AdminOrdersQueryDto,
  UpdateFulfillmentDto,
} from './dto/admin-orders.dto';
import {
  AdminOrderDetail,
  OrderSummary,
  toAdminOrderDetail,
  toOrderSummary,
} from './order.views';
import { OrdersService } from './orders.service';

export interface AdminOrderPage {
  readonly items: readonly OrderSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

@Controller('admin/orders')
@UseGuards(AccessTokenGuard, AdminGuard)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  async list(@Query() query: AdminOrdersQueryDto): Promise<AdminOrderPage> {
    const page = await this.orders.listForAdmin(query);
    return { ...page, items: page.items.map(toOrderSummary) };
  }

  @Get(':id')
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminOrderDetail> {
    return toAdminOrderDetail(await this.orders.getForAdmin(id));
  }

  @Patch(':id')
  async updateFulfillment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFulfillmentDto,
  ): Promise<AdminOrderDetail> {
    return toAdminOrderDetail(
      await this.orders.updateFulfillment(id, dto.fulfillment),
    );
  }
}
