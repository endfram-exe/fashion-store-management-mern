import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectDatabase } from "./db.js";
import Product from "./models/Product.js";
import Purchase from "./models/Purchase.js";
import Sale from "./models/Sale.js";
import Stock from "./models/Stock.js";
import { createApiRouter } from "./routes/api.js";
import { InventoryStore } from "./services/inventoryStore.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

app.use(cors());
app.use(express.json({ limit: "6mb" }));
app.use(morgan("dev"));

const useMongo = await connectDatabase();
const store = new InventoryStore({
  useMongo,
  models: { Product, Stock, Purchase, Sale }
});

await store.initialize();

app.use("/api", createApiRouter(store));

const distDir = path.join(rootDir, "client", "dist");
app.use(express.static(distDir));

app.get("*", (request, response) => {
  response.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) {
      response.status(404).send("Run npm run build before using npm start, or use npm run dev.");
    }
  });
});

app.use((error, request, response, next) => {
  const status = error.status || 500;
  response.status(status).json({
    message: error.message || "Server error"
  });
});

app.listen(port, () => {
  console.log(`[api] FashionHub API listening on http://127.0.0.1:${port}`);
});
