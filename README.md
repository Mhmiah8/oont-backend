# OoNt Grocery API

Production-style NestJS + PostgreSQL backend for grocery products, persistent carts, and concurrency-safe order processing.

## Tech Stack

- NestJS
- PostgreSQL
- Prisma ORM
- Docker + docker-compose
- Swagger/OpenAPI (`/api`)
- class-validator + class-transformer

## Features

- Products and categories APIs with pagination
- Persistent user carts in PostgreSQL
- Atomic order creation from cart
- Robust stock safety under concurrent requests
- Order cancellation with stock restoration
- Product soft delete (`deletedAt`)
- Idempotent seed script with sample data

## API Endpoints

### Products

- `GET /products?page=1&limit=20`
- `GET /products/:id`

### Categories

- `GET /categories`
- `GET /categories/:id/products?page=1&limit=20`

### Cart

- `GET /cart/:userId`
- `POST /cart/:userId/items` with body `{ "productId": "...", "quantity": 1 }`
- `PUT /cart/:userId/items/:productId` with body `{ "quantity": 3 }`
- `DELETE /cart/:userId/items/:productId`
- `DELETE /cart/:userId`

### Orders

- `POST /orders` with body `{ "userId": "..." }`
- `GET /orders/:id`
- `POST /orders/:id/cancel`

## Concurrency Strategy

`POST /orders` uses a single PostgreSQL transaction and never does a read-then-update stock write.

For each cart item, it performs an atomic conditional decrement:

```sql
UPDATE products
SET stock = stock - :requestedQuantity
WHERE id = :productId AND stock >= :requestedQuantity;
```

In Prisma, this is implemented using `updateMany` with `stock: { gte: quantity }` and `stock: { decrement: quantity }`.

If any item update affects 0 rows, the transaction throws and rolls back all prior changes, so:

- no partial stock decrements are persisted
- no order is created
- the cart remains unchanged

This ensures that if multiple users race for the last unit, only one order can succeed.

## Local Setup (without Docker)

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL (or run Docker postgres service).

3. Configure `.env`:

```env
DATABASE_URL="postgresql://oont:oont123@localhost:5432/oont_grocery"
PORT=3000
```

4. Generate client and migrate:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

5. Seed sample data:

```bash
npm run prisma:seed
```

6. Run app:

```bash
npm run start:dev
```

## Docker Setup

1. Build and run:

```bash
docker-compose up --build
```

2. # Run the seed script to load sample data
   
```bash   
docker compose exec app npm run prisma:seed
```
3. Swagger URL: `http://localhost:3000/api`

Useful commands:

```bash
docker-compose up -d
docker-compose down
docker-compose down -v
docker-compose logs -f app
docker-compose logs -f postgres
```

## Scripts

- `npm run build`
- `npm run start`
- `npm run start:dev`
- `npm run start:prod`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run test:e2e`
- `npm run docker:up`
- `npm run docker:down`

## Notes

- `userId` is treated as a plain string.
- Cart state is stored in PostgreSQL, not in-memory.
- `OrderItem` stores `priceAt` and `productName` snapshots for historical consistency.
