# OoNt Grocery API Database Schema

## Overview

This service uses PostgreSQL with Prisma ORM and a normalized schema for inventory, cart, and order lifecycle management.

## Entities

- Category
- Product
- Cart
- CartItem
- Order
- OrderItem

## Relationship Diagram

```text
Category (1) ----< (N) Product

Cart (1) ----< (N) CartItem >---- (1) Product

Order (1) ----< (N) OrderItem >---- (1) Product
```

## Model Details

### Category

- `id` (PK)
- `name` (unique)
- timestamps

Reasoning: stable lookup table for product grouping and filtering.

### Product

- `id` (PK)
- `name` (unique)
- `description`
- `price` (`Decimal(10,2)`)
- `stock` (int)
- `categoryId` (FK to Category)
- `deletedAt` (nullable soft delete marker)
- timestamps

Reasoning: `deletedAt` preserves historical links for order records while hiding products from public listings.

### Cart

- `id` (PK)
- `userId` (unique)
- timestamps

Reasoning: one persistent cart per user (`userId` is an arbitrary string).

### CartItem

- `id` (PK)
- `cartId` (FK to Cart, cascade delete)
- `productId` (FK to Product)
- `quantity` (int > 0 enforced at DTO layer)
- timestamps
- unique composite key: `(cartId, productId)`

Reasoning: prevents duplicate products in a cart.

### Order

- `id` (PK)
- `userId`
- `status` (`PENDING`, `CANCELLED`)
- timestamps

Reasoning: tracks order lifecycle independently from cart.

### OrderItem

- `id` (PK)
- `orderId` (FK to Order, cascade delete)
- `productId` (FK to Product)
- `quantity`
- `priceAt` (`Decimal(10,2)` snapshot)
- `productName` (snapshot)
- `createdAt`

Reasoning: snapshot fields preserve historical accuracy even when product price/name changes later.

## Concurrency-Safe Stock Reservation

During order creation, each line item uses an atomic conditional update inside one transaction:

```sql
UPDATE products
SET stock = stock - :requestedQuantity
WHERE id = :productId AND stock >= :requestedQuantity;
```

If any update affects 0 rows, the transaction is rolled back, so no partial decrements or partial orders can occur.
