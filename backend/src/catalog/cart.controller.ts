import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CartQuote } from './cart-quote';
import { CartQuoteDto } from './dto/cart-quote.dto';
import { ProductsService } from './products.service';

/** El carrito vive en el navegador; aquí se calculan precios e inventario reales. */
@Controller('cart')
export class CartController {
  constructor(private readonly products: ProductsService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() dto: CartQuoteDto): Promise<CartQuote> {
    return this.products.quote(dto.items);
  }
}
