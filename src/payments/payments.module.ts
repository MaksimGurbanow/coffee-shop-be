import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe/stripe.service';
import { OrdersService } from 'src/modules/orders/orders.service';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { ProductsModule } from 'src/modules/products/products.module';

@Module({
  imports: [OrdersModule, TypeOrmModule.forFeature([Order]), ProductsModule],
  providers: [StripeService, OrdersService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
