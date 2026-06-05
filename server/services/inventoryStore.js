import crypto from "node:crypto";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const seedProducts = [
  {
    productId: "P001",
    name: "Essential T-Shirt",
    brand: "Nike",
    productFor: "Men",
    season: "Summer",
    rate: 499,
    imageUrl: "/assets/products/tshirt.png",
    inStock: 50
  },
  {
    productId: "P002",
    name: "Straight Fit Jeans",
    brand: "Levi's",
    productFor: "Men",
    season: "Winter",
    rate: 1299,
    imageUrl: "/assets/products/jeans.png",
    inStock: 20
  },
  {
    productId: "P003",
    name: "Quilted Jacket",
    brand: "Puma",
    productFor: "Men",
    season: "Winter",
    rate: 2499,
    imageUrl: "/assets/products/jacket.png",
    inStock: 15
  },
  {
    productId: "P004",
    name: "Court Sneakers",
    brand: "Adidas",
    productFor: "Unisex",
    season: "All",
    rate: 2999,
    imageUrl: "/assets/products/sneakers.png",
    inStock: 0
  },
  {
    productId: "P005",
    name: "Fleece Hoodie",
    brand: "Zara",
    productFor: "Unisex",
    season: "Winter",
    rate: 1999,
    imageUrl: "/assets/products/hoodie.png",
    inStock: 5
  },
  {
    productId: "P006",
    name: "Printed Kurti",
    brand: "Fabline",
    productFor: "Women",
    season: "Festive",
    rate: 1499,
    imageUrl: "/assets/products/kurti.png",
    inStock: 8
  }
];

const seedPurchases = [
  { purchaseId: "P9A1B2C3D", itemId: "P001", noOfItems: 18, amount: 8982, purchaseDate: "2026-05-28" },
  { purchaseId: "P3E4F5A6B", itemId: "P002", noOfItems: 12, amount: 15588, purchaseDate: "2026-05-29" },
  { purchaseId: "P8C7D6E5F", itemId: "P003", noOfItems: 10, amount: 24990, purchaseDate: "2026-05-30" },
  { purchaseId: "P4B5C6D7E", itemId: "P005", noOfItems: 6, amount: 11994, purchaseDate: "2026-06-01" }
];

const seedSales = [
  { saleId: "S1A2B3C4D", itemId: "P001", noOfItemsSold: 10, saleRate: 449.1, discount: 10, amount: 4491, dateOfSale: "2026-05-30" },
  { saleId: "S5E6F7A8B", itemId: "P002", noOfItemsSold: 5, saleRate: 1169.1, discount: 10, amount: 5845.5, dateOfSale: "2026-05-31" },
  { saleId: "S9C8D7E6F", itemId: "P003", noOfItemsSold: 3, saleRate: 2249.1, discount: 10, amount: 6747.3, dateOfSale: "2026-06-01" },
  { saleId: "S2B3C4D5E", itemId: "P005", noOfItemsSold: 2, saleRate: 1799.1, discount: 10, amount: 3598.2, dateOfSale: "2026-06-02" },
  { saleId: "S6F7A8B9C", itemId: "P006", noOfItemsSold: 4, saleRate: 1424.05, discount: 5, amount: 5696.2, dateOfSale: "2026-06-03" }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function recordId(prefix) {
  return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function statusFor(inStock) {
  return Number(inStock) > 0 ? "Yes" : "No";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function requireText(value, field) {
  const text = String(value || "").trim();
  if (!text) {
    throw new HttpError(400, `${field} is required`);
  }
  return text;
}

function positiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new HttpError(400, `${field} must be greater than zero`);
  }
  return number;
}

function nonNegativeNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new HttpError(400, `${field} cannot be negative`);
  }
  return number;
}

function normalizeProductPayload(payload, editing = false) {
  const rate = positiveNumber(payload.rate, "Rate");
  const product = {
    name: requireText(payload.name, "Product name"),
    brand: requireText(payload.brand, "Brand"),
    productFor: payload.productFor || "Unisex",
    season: payload.season || "All",
    rate,
    imageUrl: payload.imageUrl || "/assets/products/tshirt.png"
  };

  if (!editing) {
    product.productId = String(payload.productId || "").trim();
  }

  return product;
}

function mergeProductStock(product, stock) {
  return {
    productId: product.productId,
    name: product.name,
    brand: product.brand,
    productFor: product.productFor,
    season: product.season,
    rate: Number(product.rate),
    imageUrl: product.imageUrl,
    inStock: Number(stock?.inStock || 0),
    status: stock?.status || statusFor(stock?.inStock || 0),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

function mergeRecordProduct(record, products) {
  const product = products.find((item) => item.productId === record.itemId);
  return {
    ...record,
    productName: product?.name || "Deleted product",
    brand: product?.brand || "-",
    rate: product?.rate || 0,
    imageUrl: product?.imageUrl || "/assets/products/tshirt.png"
  };
}

function trendFrom(records, dateField, amountField) {
  const buckets = new Map();

  for (const record of records) {
    const date = record[dateField];
    buckets.set(date, (buckets.get(date) || 0) + Number(record[amountField] || 0));
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, amount]) => ({
      date,
      amount: Math.round(amount)
    }));
}

function buildSummary(products, stockRows, sales, purchases) {
  const stockMap = new Map(stockRows.map((row) => [row.itemId, row]));
  const productRows = products.map((product) => mergeProductStock(product, stockMap.get(product.productId)));
  const saleRows = sales.map((sale) => mergeRecordProduct(sale, products));
  const purchaseRows = purchases.map((purchase) => mergeRecordProduct(purchase, products));
  const totalSales = saleRows.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const totalPurchase = purchaseRows.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  const lowStock = productRows
    .filter((product) => product.inStock <= 5)
    .sort((left, right) => left.inStock - right.inStock);

  return {
    totalProducts: productRows.length,
    inStockItems: productRows.filter((product) => product.inStock > 0).length,
    totalSales,
    totalPurchase,
    lowStockCount: lowStock.length,
    stockTotalUnits: productRows.reduce((sum, product) => sum + product.inStock, 0),
    recentSales: saleRows
      .slice()
      .sort((left, right) => right.dateOfSale.localeCompare(left.dateOfSale))
      .slice(0, 5),
    lowStock,
    salesTrend: trendFrom(saleRows, "dateOfSale", "amount"),
    purchaseTrend: trendFrom(purchaseRows, "purchaseDate", "amount"),
    productRows,
    saleRows,
    purchaseRows
  };
}

export class InventoryStore {
  constructor({ useMongo, models }) {
    this.useMongo = useMongo;
    this.models = models;
    this.memory = {
      products: [],
      stock: [],
      sales: [],
      purchases: []
    };
  }

  async initialize() {
    if (this.useMongo) {
      const count = await this.models.Product.countDocuments();
      if (count === 0) {
        const products = seedProducts.map(({ inStock, ...product }) => product);
        const stock = seedProducts.map((product) => ({
          itemId: product.productId,
          inStock: product.inStock,
          status: statusFor(product.inStock)
        }));

        await this.models.Product.insertMany(products);
        await this.models.Stock.insertMany(stock);
        await this.models.Purchase.insertMany(seedPurchases);
        await this.models.Sale.insertMany(seedSales);
      }
      return;
    }

    this.memory.products = seedProducts.map(({ inStock, ...product }) => clone(product));
    this.memory.stock = seedProducts.map((product) => ({
      itemId: product.productId,
      inStock: product.inStock,
      status: statusFor(product.inStock)
    }));
    this.memory.purchases = clone(seedPurchases);
    this.memory.sales = clone(seedSales);
  }

  async dashboard() {
    const { products, stock, sales, purchases } = await this.snapshot();
    return buildSummary(products, stock, sales, purchases);
  }

  async snapshot() {
    if (!this.useMongo) {
      return clone(this.memory);
    }

    const [products, stock, sales, purchases] = await Promise.all([
      this.models.Product.find().sort({ productId: 1 }).lean(),
      this.models.Stock.find().lean(),
      this.models.Sale.find().sort({ dateOfSale: -1 }).lean(),
      this.models.Purchase.find().sort({ purchaseDate: -1 }).lean()
    ]);

    return { products, stock, sales, purchases };
  }

  async listProducts(search = "") {
    const { products, stock } = await this.snapshot();
    const stockMap = new Map(stock.map((row) => [row.itemId, row]));
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (!query) return true;
        return [product.productId, product.name, product.brand, product.productFor, product.season]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .map((product) => mergeProductStock(product, stockMap.get(product.productId)));
  }

  async listStock() {
    const products = await this.listProducts();
    return products.map((product) => ({
      productId: product.productId,
      name: product.name,
      brand: product.brand,
      inStock: product.inStock,
      status: product.status,
      imageUrl: product.imageUrl
    }));
  }

  async listSales() {
    const { products, sales } = await this.snapshot();
    return sales.map((sale) => mergeRecordProduct(sale, products));
  }

  async listPurchases() {
    const { products, purchases } = await this.snapshot();
    return purchases.map((purchase) => mergeRecordProduct(purchase, products));
  }

  async nextProductId() {
    const products = await this.listProducts();
    const max = products.reduce((value, product) => {
      const number = Number.parseInt(product.productId.replace(/\D/g, ""), 10);
      return Number.isFinite(number) ? Math.max(value, number) : value;
    }, 0);

    return `P${String(max + 1).padStart(3, "0")}`;
  }

  async createProduct(payload) {
    const product = normalizeProductPayload(payload);
    product.productId = product.productId || (await this.nextProductId());
    const initialStock = Math.floor(nonNegativeNumber(payload.initialStock || 0, "Initial stock"));

    const existing = (await this.listProducts()).find((item) => item.productId === product.productId);
    if (existing) {
      throw new HttpError(409, "Product ID already exists");
    }

    if (this.useMongo) {
      await this.models.Product.create(product);
      await this.models.Stock.create({
        itemId: product.productId,
        inStock: initialStock,
        status: statusFor(initialStock)
      });
      return (await this.listProducts()).find((item) => item.productId === product.productId);
    }

    this.memory.products.push(product);
    this.memory.stock.push({
      itemId: product.productId,
      inStock: initialStock,
      status: statusFor(initialStock)
    });
    return (await this.listProducts()).find((item) => item.productId === product.productId);
  }

  async updateProduct(productId, payload) {
    const product = normalizeProductPayload(payload, true);

    if (this.useMongo) {
      const updated = await this.models.Product.findOneAndUpdate(
        { productId },
        product,
        { new: true }
      );

      if (!updated) {
        throw new HttpError(404, "Product not found");
      }
      return (await this.listProducts()).find((item) => item.productId === productId);
    }

    const index = this.memory.products.findIndex((item) => item.productId === productId);
    if (index === -1) {
      throw new HttpError(404, "Product not found");
    }
    this.memory.products[index] = {
      ...this.memory.products[index],
      ...product
    };
    return (await this.listProducts()).find((item) => item.productId === productId);
  }

  async deleteProduct(productId) {
    const exists = (await this.listProducts()).some((product) => product.productId === productId);
    if (!exists) {
      throw new HttpError(404, "Product not found");
    }

    if (this.useMongo) {
      await Promise.all([
        this.models.Sale.deleteMany({ itemId: productId }),
        this.models.Purchase.deleteMany({ itemId: productId }),
        this.models.Stock.deleteMany({ itemId: productId }),
        this.models.Product.deleteOne({ productId })
      ]);
      return { deleted: true };
    }

    this.memory.sales = this.memory.sales.filter((sale) => sale.itemId !== productId);
    this.memory.purchases = this.memory.purchases.filter((purchase) => purchase.itemId !== productId);
    this.memory.stock = this.memory.stock.filter((stock) => stock.itemId !== productId);
    this.memory.products = this.memory.products.filter((product) => product.productId !== productId);
    return { deleted: true };
  }

  async addPurchase(payload) {
    const itemId = requireText(payload.itemId, "Product ID");
    const quantity = Math.floor(positiveNumber(payload.itemNo, "Number of items"));
    const products = await this.listProducts();
    const product = products.find((item) => item.productId === itemId);

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const purchase = {
      purchaseId: recordId("P"),
      itemId,
      noOfItems: quantity,
      amount: product.rate * quantity,
      purchaseDate: payload.purchaseDate || today()
    };

    if (this.useMongo) {
      await this.models.Purchase.create(purchase);
      const stock = await this.models.Stock.findOne({ itemId });
      const nextStock = Number(stock?.inStock || 0) + quantity;
      await this.models.Stock.findOneAndUpdate(
        { itemId },
        { itemId, inStock: nextStock, status: statusFor(nextStock) },
        { upsert: true, new: true }
      );
      return mergeRecordProduct(purchase, await this.rawProducts());
    }

    this.memory.purchases.push(purchase);
    const stock = this.memory.stock.find((row) => row.itemId === itemId);
    if (stock) {
      stock.inStock += quantity;
      stock.status = statusFor(stock.inStock);
    } else {
      this.memory.stock.push({ itemId, inStock: quantity, status: "Yes" });
    }

    return mergeRecordProduct(purchase, this.memory.products);
  }

  async addSale(payload) {
    const itemId = requireText(payload.itemId, "Product ID");
    const quantity = Math.floor(positiveNumber(payload.itemNo, "Number of items"));
    const discount = Math.min(100, nonNegativeNumber(payload.discount || 0, "Discount"));
    const products = await this.listProducts();
    const product = products.find((item) => item.productId === itemId);

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    if (quantity > product.inStock) {
      throw new HttpError(409, "Not enough stock");
    }

    const saleRate = product.rate - (product.rate * discount) / 100;
    const sale = {
      saleId: recordId("S"),
      itemId,
      noOfItemsSold: quantity,
      saleRate,
      discount,
      amount: saleRate * quantity,
      dateOfSale: payload.dateOfSale || today()
    };

    if (this.useMongo) {
      await this.models.Sale.create(sale);
      const nextStock = product.inStock - quantity;
      await this.models.Stock.findOneAndUpdate(
        { itemId },
        { inStock: nextStock, status: statusFor(nextStock) },
        { new: true }
      );
      return mergeRecordProduct(sale, await this.rawProducts());
    }

    this.memory.sales.push(sale);
    const stock = this.memory.stock.find((row) => row.itemId === itemId);
    stock.inStock -= quantity;
    stock.status = statusFor(stock.inStock);

    return mergeRecordProduct(sale, this.memory.products);
  }

  async rawProducts() {
    if (!this.useMongo) return clone(this.memory.products);
    return this.models.Product.find().lean();
  }
}

export { HttpError };
