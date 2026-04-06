import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto';
import { UpdateCartItemQuantityDto } from './dto/update-cart-item-quantity.dto';
import { UserIdParamDto } from '../common/dto/user-id-param.dto';
import { UserProductParamDto } from '../common/dto/user-product-param.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get the current user cart' })
  @ApiParam({ name: 'userId' })
  @ApiOkResponse({ description: 'Cart details' })
  getCart(@Param() params: UserIdParamDto) {
    return this.cartService.getCartByUserId(params.userId);
  }

  @Post(':userId/items')
  @ApiOperation({ summary: 'Add or update an item in cart' })
  @ApiCreatedResponse({ description: 'Cart updated' })
  upsertCartItem(
    @Param() params: UserIdParamDto,
    @Body() body: UpsertCartItemDto,
  ) {
    return this.cartService.upsertCartItem(params.userId, body);
  }

  @Put(':userId/items/:productId')
  @ApiOperation({ summary: 'Update quantity of cart item' })
  @ApiOkResponse({ description: 'Cart item quantity updated' })
  updateQuantity(
    @Param() params: UserProductParamDto,
    @Body() body: UpdateCartItemQuantityDto,
  ) {
    return this.cartService.updateCartItemQuantity(
      params.userId,
      params.productId,
      body.quantity,
    );
  }

  @Delete(':userId/items/:productId')
  @ApiOperation({ summary: 'Remove one item from cart' })
  @ApiNoContentResponse({ description: 'Item removed' })
  async removeItem(@Param() params: UserProductParamDto) {
    await this.cartService.removeCartItem(params.userId, params.productId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiNoContentResponse({ description: 'Cart cleared' })
  async clear(@Param() params: UserIdParamDto) {
    await this.cartService.clearCart(params.userId);
  }
}
