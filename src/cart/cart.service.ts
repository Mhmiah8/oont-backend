import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartByUserId(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      return {
        userId,
        items: [],
      };
    }

    return cart;
  }

  async upsertCartItem(userId: string, body: UpsertCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: body.productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    });

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: body.productId,
        },
      },
      update: { quantity: body.quantity },
      create: {
        cartId: cart.id,
        productId: body.productId,
        quantity: body.quantity,
      },
    });

    return this.getCartByUserId(userId);
  }

  async updateCartItemQuantity(userId: string, productId: string, quantity: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const updated = await this.prisma.cartItem.updateMany({
      where: {
        cartId: cart.id,
        productId,
      },
      data: { quantity },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Cart item not found');
    }

    return this.getCartByUserId(userId);
  }

  async removeCartItem(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const removed = await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (removed.count === 0) {
      throw new NotFoundException('Cart item not found');
    }
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return;
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  async getCartOrThrow(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return cart;
  }
}
