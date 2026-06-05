import { Router } from "express";

function asyncRoute(handler) {
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

export function createApiRouter(store) {
  const router = Router();

  router.get("/health", (request, response) => {
    response.json({ ok: true, store: store.useMongo ? "mongodb" : "memory" });
  });

  router.get(
    "/dashboard",
    asyncRoute(async (request, response) => {
      response.json(await store.dashboard());
    })
  );

  router.get(
    "/products",
    asyncRoute(async (request, response) => {
      response.json(await store.listProducts(request.query.search || ""));
    })
  );

  router.post(
    "/products",
    asyncRoute(async (request, response) => {
      response.status(201).json(await store.createProduct(request.body));
    })
  );

  router.put(
    "/products/:productId",
    asyncRoute(async (request, response) => {
      response.json(await store.updateProduct(request.params.productId, request.body));
    })
  );

  router.delete(
    "/products/:productId",
    asyncRoute(async (request, response) => {
      response.json(await store.deleteProduct(request.params.productId));
    })
  );

  router.get(
    "/stock",
    asyncRoute(async (request, response) => {
      response.json(await store.listStock());
    })
  );

  router.get(
    "/sales",
    asyncRoute(async (request, response) => {
      response.json(await store.listSales());
    })
  );

  router.post(
    "/sales",
    asyncRoute(async (request, response) => {
      response.status(201).json(await store.addSale(request.body));
    })
  );

  router.get(
    "/purchases",
    asyncRoute(async (request, response) => {
      response.json(await store.listPurchases());
    })
  );

  router.post(
    "/purchases",
    asyncRoute(async (request, response) => {
      response.status(201).json(await store.addPurchase(request.body));
    })
  );

  router.get(
    "/reports",
    asyncRoute(async (request, response) => {
      response.json(await store.dashboard());
    })
  );

  return router;
}
