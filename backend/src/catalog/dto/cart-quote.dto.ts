import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const MAX_CART_LINES = 20;
export const MAX_LINE_QUANTITY = 20;

export class CartQuoteItemDto {
  @IsUUID('4', { message: 'Hay un producto no válido en el carrito.' })
  productId!: string;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad mínima es 1.' })
  @Max(MAX_LINE_QUANTITY, {
    message: `Puedes pedir hasta ${MAX_LINE_QUANTITY} unidades de cada producto.`,
  })
  quantity!: number;
}

export class CartQuoteDto {
  @IsArray({ message: 'El carrito debe ser una lista.' })
  @ArrayMaxSize(MAX_CART_LINES, {
    message: `El carrito admite hasta ${MAX_CART_LINES} productos distintos.`,
  })
  @ValidateNested({ each: true })
  @Type(() => CartQuoteItemDto)
  items!: CartQuoteItemDto[];
}
