const storageKey = "fashionhub-local-store-v1";
const base = import.meta.env.BASE_URL || "/";
const asset = (name) => `${base}assets/products/${name}`;

const seed = {
  products: [
    { productId: "P001", name: "Essential T-Shirt", brand: "Nike", productFor: "Men", season: "Summer", rate: 499, imageUrl: asset("tshirt.png"), inStock: 50 },
    { productId: "P002", name: "Straight Fit Jeans", brand: "Levi's", productFor: "Men", season: "Winter", rate: 1299, imageUrl: asset("jeans.png"), inStock: 20 },
    { productId: "P003", name: "Quilted Jacket", brand: "Puma", productFor: "Men", season: "Winter", rate: 2499, imageUrl: asset("jacket.png"), inStock: 15 },
    { productId: "P004", name: "Court Sneakers", brand: "Adidas", productFor: "Unisex", season: "All", rate: 2999, imageUrl: asset("sneakers.png"), inStock: 0 },
    { productId: "P005", name: "Fleece Hoodie", brand: "Zara", productFor: "Unisex", season: "Winter", rate: 1999, imageUrl: asset("hoodie.png"), inStock: 5 },
    { productId: "P006", name: "Printed Kurti", brand: "Fabline", productFor: "Women", season: "Festive", rate: 1499, imageUrl: asset("kurti.png"), inStock: 8 }
  ],
  purchases: [
    { purchaseId: "P9A1B2C3D", itemId: "P001", noOfItems: 18, amount: 8982, purchaseDate: "2026-05-28" },
    { purchaseId: "P3E4F5A6B", itemId: "P002", noOfItems: 12, amount: 15588, purchaseDate: "2026-05-29" },
    { purchaseId: "P8C7D6E5F", itemId: "P003", noOfItems: 10, amount: 24990, purchaseDate: "2026-05-30" },
    { purchaseId: "P4B5C6D7E", itemId: "P005", noOfItems: 6, amount: 11994, purchaseDate: "2026-06-01" }
  ],
  sales: [
    { saleId: "S1A2B3C4D", itemId: "P001", noOfItemsSold: 10, saleRate: 449.1, discount: 10, amount: 4491, dateOfSale: "2026-05-30" },
    { saleId: "S5E6F7A8B", itemId: "P002", noOfItemsSold: 5, saleRate: 1169.1, discount: 10, amount: 5845.5, dateOfSale: "2026-05-31" },
    { saleId: "S9C8D7E6F", itemId: "P003", noOfItemsSold: 3, saleRate: 2249.1, discount: 10, amount: 6747.3, dateOfSale: "2026-06-01" },
    { saleId: "S2B3C4D5E", itemId: "P005", noOfItemsSold: 2, saleRate: 1799.1, discount: 10, amount: 3598.2, dateOfSale: "2026-06-02" },
    { saleId: "S6F7A8B9C", itemId: "P006", noOfItemsSold: 4, saleRate: 1424.05, discount: 5, amount: 5696.2, dateOfSale: "2026-06-03" }
  ]
};

function load() {
  const stored = window.localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : structuredClone(seed);
}

function save(data) {
  window.localStorage.setItem(storageKey, JSON.stringify(data));
}

function recordId(prefix) {
  return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function statusFor(inStock) {
  return Number(inStock) > 0 ? "Yes" : "No";
}

function withStatus(product) {
  return { ...product, status: statusFor(product.inStock) };
}

function mergeRecord(record, products) {
  const product = products.find((item) => item.productId === record.itemId);
  return {
    ...record,
    productName: product?.name || "Deleted product",
    brand: product?.brand || "-",
    imageUrl: product?.imageUrl || asset("tshirt.png")
  };
}

function trend(records, dateField, amountField) {
  const buckets = new Map();
  for (const record of records) {
    buckets.set(record[dateField], (buckets.get(record[dateField]) || 0) + Number(record[amountField] || 0));
  }
  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, amount]) => ({ date, amount: Math.round(amount) }));
}

function dashboard(data) {
  const productRows = data.products.map(withStatus);
  const saleRows = data.sales.map((sale) => mergeRecord(sale, data.products));
  const purchaseRows = data.purchases.map((purchase) => mergeRecord(purchase, data.products));
  const lowStock = productRows.filter((product) => product.inStock <= 5).sort((left, right) => left.inStock - right.inStock);

  return {
    totalProducts: productRows.length,
    inStockItems: productRows.filter((product) => product.inStock > 0).length,
    totalSales: saleRows.reduce((sum, sale) => sum + Number(sale.amount || 0), 0),
    totalPurchase: purchaseRows.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0),
    lowStockCount: lowStock.length,
    stockTotalUnits: productRows.reduce((sum, product) => sum + Number(product.inStock || 0), 0),
    recentSales: saleRows.slice().sort((left, right) => right.dateOfSale.localeCompare(left.dateOfSale)).slice(0, 5),
    lowStock,
    salesTrend: trend(saleRows, "dateOfSale", "amount"),
    purchaseTrend: trend(purchaseRows, "purchaseDate", "amount"),
    productRows,
    saleRows,
    purchaseRows
  };
}

function nextProductId(products) {
  const max = products.reduce((value, product) => {
    const number = Number.parseInt(product.productId.replace(/\D/g, ""), 10);
    return Number.isFinite(number) ? Math.max(value, number) : value;
  }, 0);
  return `P${String(max + 1).padStart(3, "0")}`;
}

function requireProduct(data, productId) {
  const product = data.products.find((item) => item.productId === productId);
  if (!product) throw new Error("Product not found");
  return product;
}

export const localApi = {
  async handle(path, options) {
    const data = load();
    const url = new URL(path, "http://fashionhub.local");
    const method = options.method.toUpperCase();

    if (url.pathname === "/api/dashboard" || url.pathname === "/api/reports") {
      return dashboard(data);
    }

    if (url.pathname === "/api/products" && method === "GET") {
      const query = (url.searchParams.get("search") || "").toLowerCase();
      return data.products
        .map(withStatus)
        .filter((product) => !query || [product.productId, product.name, product.brand, product.productFor, product.season].join(" ").toLowerCase().includes(query));
    }

    if (url.pathname === "/api/products" && method === "POST") {
      const body = options.body;
      const productId = body.productId || nextProductId(data.products);
      if (data.products.some((product) => product.productId === productId)) throw new Error("Product ID already exists");
      const product = {
        productId,
        name: body.name,
        brand: body.brand,
        productFor: body.productFor,
        season: body.season,
        rate: Number(body.rate),
        imageUrl: body.imageUrl || asset("tshirt.png"),
        inStock: Number(body.initialStock || 0)
      };
      data.products.push(product);
      save(data);
      return withStatus(product);
    }

    if (url.pathname.startsWith("/api/products/") && method === "PUT") {
      const productId = decodeURIComponent(url.pathname.replace("/api/products/", ""));
      const product = requireProduct(data, productId);
      Object.assign(product, {
        name: options.body.name,
        brand: options.body.brand,
        productFor: options.body.productFor,
        season: options.body.season,
        rate: Number(options.body.rate),
        imageUrl: options.body.imageUrl || product.imageUrl
      });
      save(data);
      return withStatus(product);
    }

    if (url.pathname.startsWith("/api/products/") && method === "DELETE") {
      const productId = decodeURIComponent(url.pathname.replace("/api/products/", ""));
      requireProduct(data, productId);
      data.products = data.products.filter((product) => product.productId !== productId);
      data.sales = data.sales.filter((sale) => sale.itemId !== productId);
      data.purchases = data.purchases.filter((purchase) => purchase.itemId !== productId);
      save(data);
      return { deleted: true };
    }

    if (url.pathname === "/api/stock") {
      return data.products.map(withStatus);
    }

    if (url.pathname === "/api/sales" && method === "GET") {
      return data.sales.map((sale) => mergeRecord(sale, data.products));
    }

    if (url.pathname === "/api/sales" && method === "POST") {
      const product = requireProduct(data, options.body.itemId);
      const quantity = Number(options.body.itemNo);
      const discount = Number(options.body.discount || 0);
      if (quantity > product.inStock) throw new Error("Not enough stock");
      const saleRate = product.rate - (product.rate * discount) / 100;
      product.inStock -= quantity;
      const sale = {
        saleId: recordId("S"),
        itemId: product.productId,
        noOfItemsSold: quantity,
        saleRate,
        discount,
        amount: saleRate * quantity,
        dateOfSale: options.body.dateOfSale || new Date().toISOString().slice(0, 10)
      };
      data.sales.push(sale);
      save(data);
      return mergeRecord(sale, data.products);
    }

    if (url.pathname === "/api/purchases" && method === "GET") {
      return data.purchases.map((purchase) => mergeRecord(purchase, data.products));
    }

    if (url.pathname === "/api/purchases" && method === "POST") {
      const product = requireProduct(data, options.body.itemId);
      const quantity = Number(options.body.itemNo);
      product.inStock += quantity;
      const purchase = {
        purchaseId: recordId("P"),
        itemId: product.productId,
        noOfItems: quantity,
        amount: product.rate * quantity,
        purchaseDate: options.body.purchaseDate || new Date().toISOString().slice(0, 10)
      };
      data.purchases.push(purchase);
      save(data);
      return mergeRecord(purchase, data.products);
    }

    throw new Error("Local API route not found");
  }
};
