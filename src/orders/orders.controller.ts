import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { IdParamDto } from '../common/dto/id-param.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order from cart atomically' })
  @ApiCreatedResponse({ description: 'Order created' })
  createOrder(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Order details' })
  getOrder(@Param() params: IdParamDto) {
    return this.ordersService.getOrderById(params.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order and restore stock' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Order cancelled' })
  cancelOrder(@Param() params: IdParamDto) {
    return this.ordersService.cancelOrder(params.id);
  }
}
