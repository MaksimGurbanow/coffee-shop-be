import { Injectable } from '@nestjs/common';
import { FR_URL } from 'data/url';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }

  async createCheckoutSession(order: {
    id: number;
    items: { title: string; price: number; quantity: number }[];
  }) {
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.title },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: { orderId: order.id },
      success_url: `${FR_URL}/payment-success`,
      cancel_url: `${FR_URL}/payment-cancel`,
    });
  }

  verifyWebhook(payload: Buffer, sig: string) {
    return this.stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }
}
