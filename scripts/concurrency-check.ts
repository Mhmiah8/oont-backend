import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:3000';

type RequestResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

async function requestJson(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<RequestResult> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (firstError) {
    // Retry once for transient socket errors under concurrent local load.
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (secondError) {
      const details =
        secondError instanceof Error ? secondError.message : String(secondError);
      throw new Error(`Request failed (${method} ${path}): ${details}`);
    }
  }

  let parsedBody: unknown;
  const text = await response.text();

  try {
    parsedBody = text ? JSON.parse(text) : null;
  } catch {
    parsedBody = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsedBody,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`Using API base URL: ${API_BASE_URL}`);

  const productIdArg = process.argv[2];

  const targetProduct = productIdArg
    ? await prisma.product.findFirst({
        where: { id: productIdArg, deletedAt: null },
        select: { id: true, name: true, stock: true },
      })
    : await prisma.product.findFirst({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, stock: true },
      });

  assert(targetProduct, 'No available product found to run concurrency test.');

  console.log(
    `Target product: ${targetProduct.name} (${targetProduct.id}), current stock=${targetProduct.stock}`,
  );

  await prisma.product.update({
    where: { id: targetProduct.id },
    data: { stock: 1 },
  });

  console.log('Step 1 complete: stock set to 1 with Prisma.');

  const runId = Date.now();
  const users = Array.from({ length: 5 }, (_, index) => `concurrency-user-${runId}-${index + 1}`);

  for (const userId of users) {
    const cartResponse = await requestJson(`/cart/${userId}/items`, 'POST', {
      productId: targetProduct.id,
      quantity: 1,
    });

    assert(
      cartResponse.ok,
      `Failed to add product to cart for ${userId}. Status=${cartResponse.status}, Body=${JSON.stringify(cartResponse.body)}`,
    );
  }

  console.log('Step 2 complete: created 5 user carts containing the product.');

  const orderPromises = users.map((userId) =>
    requestJson('/orders', 'POST', {
      userId,
    }),
  );

  const results = await Promise.all(orderPromises);
  const successResults = results.filter((result) => result.ok);
  const failureResults = results.filter((result) => !result.ok);

  console.log('Step 3 complete: dispatched 5 simultaneous order requests.');
  console.log(
    `Order outcomes: success=${successResults.length}, failed=${failureResults.length}`,
  );

  assert(
    successResults.length === 1,
    `Expected exactly 1 successful order, got ${successResults.length}. Full results=${JSON.stringify(results)}`,
  );

  assert(
    failureResults.length === 4,
    `Expected exactly 4 failed orders, got ${failureResults.length}. Full results=${JSON.stringify(results)}`,
  );

  console.log('Step 4 complete: verified only 1 order succeeded.');

  const finalProduct = await prisma.product.findUnique({
    where: { id: targetProduct.id },
    select: { stock: true },
  });

  assert(finalProduct, 'Target product disappeared before verification.');
  assert(
    finalProduct.stock === 0,
    `Expected stock to be 0 after race, got ${finalProduct.stock}.`,
  );

  console.log('Step 5 complete: verified stock is 0 via Prisma.');
  console.log('Concurrency test passed.');
}

main()
  .catch((error: unknown) => {
    console.error('Concurrency test failed.');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
