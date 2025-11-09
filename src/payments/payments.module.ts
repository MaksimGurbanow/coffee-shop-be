import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe/stripe.service';

@Module({
  providers: [PaymentsService, StripeService],
  controllers: [PaymentsController]
})
export class PaymentsModule {}
