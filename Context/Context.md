Here's your **complete one-shot context file** with all terminal commands included:

## `CONTEXT.md` (Complete One-Shot - Give this to Copilot)

```markdown
# OoNt Grocery API – Complete Build Context

## Goal
Build a production-style NestJS + PostgreSQL backend for a grocery delivery service with concurrent order safety.

## Critical Requirement (MOST IMPORTANT)
Prevent overselling under concurrent requests. 10 simultaneous requests for 1 item = only 1 succeeds.

## Required APIs

### Products & Categories (Read-heavy)
- GET /products?page=1&limit=20 - List available products (paginated)
- GET /products/:id - Get product details with current stock
- GET /categories - List all categories
- GET /categories/:id/products - List products in category

### Cart (Persistent in PostgreSQL)
- GET /cart/:userId - View cart
- POST /cart/:userId/items - Add/update item { productId, quantity }
- PUT /cart/:userId/items/:productId - Update quantity { quantity }
- DELETE /cart/:userId/items/:productId - Remove item
- DELETE /cart/:userId - Clear cart

Rules: No duplicate products, quantities > 0, cart persists between sessions

### Orders (Transactional - HEART OF SYSTEM)
- POST /orders - Create order from cart { userId }
- GET /orders/:id - Get order details
- POST /orders/:id/cancel - Cancel order & restore stock

Order creation MUST be atomic:
1. Start transaction
2. For each cart item: decrement stock ONLY IF stock >= quantity
3. If any fails → rollback everything, cart unchanged
4. Create order with PENDING status
5. Clear cart
6. Commit

Cancel MUST restore stock and prevent double cancellation.

## Tech Stack
- NestJS
- PostgreSQL
- Prisma ORM
- Docker + docker-compose
- Swagger (/api)
- class-validator + class-transformer

## Data Model Requirements
Entities: Category, Product, Cart, CartItem, Order, OrderItem

Key constraints:
- Product belongs to Category
- Cart belongs to userId (one-to-one)
- CartItem unique on (cartId, productId)
- Product soft delete via deletedAt (hide from lists, keep for order history)
- OrderItem should store snapshot fields: priceAt, productName (for historical accuracy)

## Concurrency Strategy
Use PostgreSQL transaction with atomic conditional updates:

```sql
UPDATE products
SET stock = stock - :requestedQuantity
WHERE id = :productId AND stock >= :requestedQuantity;
```

If any update affects 0 rows → rollback entire transaction. No read-then-update pattern.

## Deliverables
- Full NestJS project with all modules
- Prisma schema + migrations
- Dockerfile + docker-compose.yml
- Seed script (5-10 categories + 20-30 products)
- Swagger docs at /api
- README.md (setup + concurrency explanation)
- SCHEMA.md (database design with diagram)
- E2E tests for concurrency (bonus)

## Key Constraints
- Cart must be in PostgreSQL (not in-memory/Redis)
- All inputs must be validated with class-validator
- No partial order creation ever
- Stock must be accurate under concurrent load

## Important Notes for Implementation
- userId is a string, not necessarily UUID (use @IsString, not @IsUUID)
- For concurrency testing: use 5 different users with 5 different carts
- Seed script should be idempotent (can run multiple times)
- Decimal precision for prices: use Prisma's Decimal or float with 2 decimals

---

## Complete Setup & Installation Commands

Run these commands in order to create the project:

```bash
# 1. Create project directory and enter it
mkdir oont-backend
cd oont-backend

# 2. Create NestJS project (answers: npm, yes for all)
nest new .

# 3. Install production dependencies
npm install @prisma/client @nestjs/config class-validator class-transformer @nestjs/swagger swagger-ui-express

# 4. Install development dependencies
npm install -D prisma @types/node

# 5. Initialize Prisma
npx prisma init

# 6. Create Docker setup files (create these files manually or let Copilot generate)
# - docker-compose.yml
# - Dockerfile
# - .env
# - .env.example

# 7. Start PostgreSQL with Docker
docker-compose up -d

# 8. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# 9. Seed the database
npx prisma db seed

# 10. Start the development server
npm run start:dev
```

## Docker Commands for Testing

```bash
# Build and start everything
docker-compose up --build

# Stop everything
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Run in background
docker-compose up -d
```

## Testing Concurrency Manually

```bash
# Create 5 different users with carts (run this after server is running)
# First, add product to each user's cart
for i in {1..5}; do
  curl -X POST http://localhost:3000/cart/user-$i/items \
    -H "Content-Type: application/json" \
    -d '{"productId":"<actual-product-id>","quantity":1}'
done

# Then send 5 simultaneous order requests
for i in {1..5}; do
  curl -X POST http://localhost:3000/orders \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"user-$i\"}" &
done

# Expected result: exactly 1 success, 4 failures
```

## Package.json Scripts to Include

```json
"scripts": {
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "prisma db seed",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "docker:up": "docker-compose up -d",
  "docker:down": "docker-compose down -v"
},
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

## Environment Variables (.env)

```env
DATABASE_URL=postgresql://oont:oont123@localhost:5432/oont_grocery
PORT=3000
```

For Docker, use:
```env
DATABASE_URL=postgresql://oont:oont123@postgres:5432/oont_grocery
PORT=3000
```

## Project Structure to Generate

```
oont-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── dto/
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── dto/
│   ├── cart/
│   │   ├── cart.module.ts
│   │   ├── cart.controller.ts
│   │   ├── cart.service.ts
│   │   └── dto/
│   └── orders/
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       └── dto/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── concurrency.spec.ts
├── docker-compose.yml
├── Dockerfile
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
├── README.md
└── SCHEMA.md
```

## Docker Configuration Files

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: oont-postgres
    environment:
      POSTGRES_USER: oont
      POSTGRES_PASSWORD: oont123
      POSTGRES_DB: oont_grocery
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oont"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: oont-app
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://oont:oont123@postgres:5432/oont_grocery
      PORT: 3000

volumes:
  postgres_data:
```

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

## Now Generate the Complete Working Application
Build all files needed for a working NestJS + Prisma + PostgreSQL application that passes the concurrency requirement. Include everything: schema, services, controllers, DTOs with validation, Swagger docs, seed script, tests, Docker setup, README, and SCHEMA.md.
```

This one file now contains:
- ✅ All requirements
- ✅ All terminal commands (install, setup, test)
- ✅ Docker commands
- ✅ Environment variables
- ✅ Project structure
- ✅ Docker config templates
- ✅ Clear build order

Just paste this into Copilot and say: **"Generate the complete working application based on this context file."**