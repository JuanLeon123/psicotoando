import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { MailService } from '../mail/mail.service';
import { SettingsModule } from '../settings/settings.module';
import { UsersModule } from '../users/users.module';
import { AdminOrdersController } from './admin-orders.controller';
import { CheckoutController } from './checkout.controller';
import { MyOrdersController } from './my-orders.controller';
import { Order, OrderItem } from './order.entity';
import { OrdersStatsService } from './orders-stats.service';
import { OrdersService } from './orders.service';
import { WompiConfig } from './wompi.config';
import { WompiService } from './wompi.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    AuthModule,
    UsersModule,
    CatalogModule,
    SettingsModule,
  ],
  controllers: [CheckoutController, MyOrdersController, AdminOrdersController],
  providers: [
    OrdersService,
    OrdersStatsService,
    WompiConfig,
    WompiService,
    MailService,
  ],
  exports: [OrdersStatsService],
})
export class OrdersModule {}
