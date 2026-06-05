import { localApi } from "./localApi.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if ((response.status === 404 || response.status === 405) && !data) {
        return localApi.handle(path, {
          method: options.method || "GET",
          body: options.body ? JSON.parse(options.body) : undefined
        });
      }
      throw new Error(data?.message || "Request failed");
    }

    return data;
  } catch (error) {
    if (window.location.protocol === "file:" || error instanceof TypeError) {
      return localApi.handle(path, {
        method: options.method || "GET",
        body: options.body ? JSON.parse(options.body) : undefined
      });
    }
    throw error;
  }
}

export const api = {
  dashboard: () => request("/api/dashboard"),
  products: (search = "") => request(`/api/products?search=${encodeURIComponent(search)}`),
  stock: () => request("/api/stock"),
  sales: () => request("/api/sales"),
  purchases: () => request("/api/purchases"),
  createProduct: (payload) =>
    request("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProduct: (productId, payload) =>
    request(`/api/products/${encodeURIComponent(productId)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteProduct: (productId) =>
    request(`/api/products/${encodeURIComponent(productId)}`, {
      method: "DELETE"
    }),
  addPurchase: (payload) =>
    request("/api/purchases", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addSale: (payload) =>
    request("/api/sales", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
