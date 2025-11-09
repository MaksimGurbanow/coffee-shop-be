import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from 'src/common/dto/order.dto';
import { Order, OrderStatus } from 'src/entities/order.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async confirmOrder(
    orderDto: CreateOrderDto,
    user?: User,
  ): Promise<{ message: string; orderId: string }> {
    const order = this.orderRepository.create({
      items: orderDto.items,
      totalPrice: orderDto.totalPrice,
      user,
      status: OrderStatus.PENDING,
    });

    await this.orderRepository.save(order);

    return {
      message: 'Your order is confirmed',
      orderId: order.id,
    };
  }

  async getOrders(userId: string) {
    const id = Number(userId);
    return await this.orderRepository.find({
      where: { user: { id } },
    });
  }

  async getOrderByID(id: string) {
    return await this.orderRepository.findOne({ where: { id } });
  }

  // orders.service.ts
  async markPaid(orderId: string) {
    const order = await this.getOrderByID(orderId);
    if (!order) throw new NotFoundException('Order not found');
    order.status = OrderStatus.PAID;
    return this.orderRepository.save(order);
  }

  async verifyOrderHash(orderId: string, hash: string): Promise<boolean> {
    if (!process.env.ORDER_HASH_SECRET) {
      throw new Error('ORDER_HASH_SECRET not set');
    }

    const hmac = crypto.createHmac('sha256', process.env.ORDER_HASH_SECRET);
    hmac.update(orderId);
    const expectedHash = hmac.digest('hex');

    return hash === expectedHash;
  }
}
