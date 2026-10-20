import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { FulfillmentStatus, PaymentStatus } from '../order.entity';

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'pending',
  'approved',
  'declined',
  'voided',
  'error',
];
export const FULFILLMENT_STATUSES: readonly FulfillmentStatus[] = [
  'unfulfilled',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
];

export class AdminOrdersQueryDto {
  @IsOptional()
  @IsIn(PAYMENT_STATUSES, { message: 'Estado de pago no válido.' })
  status?: PaymentStatus;

  @IsOptional()
  @IsIn(FULFILLMENT_STATUSES, { message: 'Estado de envío no válido.' })
  fulfillment?: FulfillmentStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(120, { message: 'La búsqueda es demasiado larga.' })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número.' })
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número.' })
  @Min(5, { message: 'Muestra al menos 5 pedidos por página.' })
  @Max(100, { message: 'Muestra como máximo 100 pedidos por página.' })
  pageSize?: number;
}

export class UpdateFulfillmentDto {
  @IsIn(FULFILLMENT_STATUSES, { message: 'Elige un estado de envío válido.' })
  fulfillment!: FulfillmentStatus;
}
