import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DELIVERED = 'delivered',
}

@Entity('orders')
export class Order {
  @ApiProperty({ example: 'b3c4e230-7e41-11ee-b962-0242ac120002' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 29.99 })
  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @ApiProperty({ example: [{ name: 'Espresso', quantity: 2 }] })
  @Column('json')
  items: {
    productId: number;
    quantity: number;
    size: string;
    title: string;
    additives: string[];
  }[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
  @Column({
    type: 'text',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;
}
