import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from 'src/common/dto/order.dto';
import { Order } from 'src/entities/order.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

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
}
