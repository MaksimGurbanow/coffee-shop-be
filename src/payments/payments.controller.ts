import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe/stripe.service';
import { OrdersService } from 'src/modules/orders/orders.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(
    private stripeService: StripeService,
    private ordersService: OrdersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(@Body('orderId') orderId: string) {
    try {
      const order = await this.ordersService.getOrderByID(orderId);
      console.log(order);
      if (!order) throw new BadRequestException('Order not found');

      const session = await this.stripeService.createCheckoutSession({
        id: order.id,
        items: order.items.map((i) => ({
          title: `${i.size} ${i.title}: ${i.additives.join(', ')}.`,
          size: i.size,
          additives: i.additives,
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      return { url: session.url };
    } catch (error) {
      if (error.status === 401) {
        throw new HttpException(
          {
            error: error.message,
          },
          error.status,
        );
      }
      console.log(error);
      throw new HttpException(
        {
          error: 'Login failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-order')
  async verifyOrder(@Body() { hash, orderId }) {
    console.log(hash, orderId);
    const isValid = await this.ordersService.verifyOrderHash(orderId, hash);
    if (!isValid) throw new UnauthorizedException('Invalid order link');
    return { valid: true };
  }
}
