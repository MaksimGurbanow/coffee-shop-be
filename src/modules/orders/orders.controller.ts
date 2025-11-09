import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../common/dto/order.dto';
// import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { OptionalUser } from '../auth/optional-user.decorator';
import { ApiResponse } from '../../common/interfaces/api.interfaces';
import { User } from '../../entities/user.entity';
import {
  OrderResponseDto,
  ErrorResponseDto,
  GetOrderResponseDto,
} from '../../common/dto/response.dto';
import { ErrorSimulationService } from '../../common/services/error-simulation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly errorSimulationService: ErrorSimulationService,
  ) {}

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirm order (anonymous or authenticated)' })
  @ApiBody({ type: CreateOrderDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Order confirmed successfully',
    type: OrderResponseDto,
  })
  @SwaggerApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async confirmOrder(
    @Body() createOrderDto: CreateOrderDto,
    @OptionalUser() user: User | null,
  ): Promise<ApiResponse<{ message: string; orderId: string }>> {
    // Simulate random API errors for testing
    // this.errorSimulationService.simulateRandomError();

    try {
      const result = await this.ordersService.confirmOrder(
        createOrderDto,
        user,
      );

      return {
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to confirm order',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get orders for specific user' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Orders are received',
    type: GetOrderResponseDto,
  })
  async getOrdersByUserId(@Param('userId') userId: string) {
    try {
      const orders = await this.ordersService.getOrders(userId);
      return { data: orders, message: 'Orders received successfully' };
    } catch (error) {
      throw new HttpException(
        { error: 'Failed to fetch orders' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
