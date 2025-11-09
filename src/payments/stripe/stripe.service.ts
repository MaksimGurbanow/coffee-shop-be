import { Injectable, NotFoundException } from '@nestjs/common';
import { FR_URL } from '../../../data/url';
import { Product } from 'src/entities/product.entity';
import { ProductsService } from 'src/modules/products/products.service';
import Stripe from 'stripe';
import * as crypto from 'crypto';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly productService: ProductsService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }

  async createCheckoutSession(order: {
    id: number | string;
    items: {
      productId: string | number;
      title: string;
      quantity: number;
      size: string;
      additives: string[];
    }[];
  }) {
    const lineItems = [];

    for (const item of order.items) {
      const product = await this.productService.getProductById(+item.productId);
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      const unitPrice = this.countTotal(product, {
        size: item.size,
        additives: item.additives,
      });

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${product.name} (${item.size}). (${product.additives.map((add) => add.name).join(', ')})`,
          },
          unit_amount: Math.round(+unitPrice * 100),
        },
        quantity: item.quantity,
      });
    }

    const orderHash = crypto
      .createHmac('sha256', process.env.ORDER_HASH_SECRET)
      .update(order.id.toString())
      .digest('hex');
    // const orderKey = crypto
    //   .createHmac('sha256', process.env.ORDER_HASH_SECRET)
    //   .update('hash')
    //   .digest('hex');

    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: { orderId: order.id, hash: orderHash },
      success_url: `${FR_URL}/payment_confirm?hash=${orderHash}&orderId=${order.id}`,
      cancel_url: `${FR_URL}/cart`,
    });
  }

  verifyWebhook(payload: Buffer, sig: string) {
    return this.stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }

  private countTotal(
    product: Product,
    opt: { size: string; additives: string[] },
  ) {
    const size = Object.values(product.sizes).find((v) => v.size === opt.size);
    console.log(
      'total',
      (size?.discountPrice || size?.price) +
        product.additives
          .filter((a) => opt.additives.includes(a.name))
          .reduce(
            (sum, curr) => sum + +(curr?.discountPrice || curr?.price),
            0,
          ),
    );
    return (
      +(size?.discountPrice || size?.price) +
      +product.additives
        .filter((a) => opt.additives.includes(a.name))
        .reduce((sum, curr) => sum + +(curr?.discountPrice || curr?.price), 0)
    );
  }
}
