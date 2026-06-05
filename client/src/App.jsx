import {
  Bell,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  ImagePlus,
  LayoutDashboard,
  PackagePlus,
  ReceiptIndianRupee,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Upload,
  UserRound,
  Warehouse,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const navigation = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: ShoppingBag },
  { key: "purchase", label: "Purchase", icon: PackagePlus },
  { key: "sales", label: "Sales", icon: ShoppingCart },
  { key: "stock", label: "Stock", icon: Warehouse },
  { key: "reports", label: "Reports", icon: TrendingUp }
];

const assetPath = (name) => `${import.meta.env.BASE_URL}assets/products/${name}`;

const emptyProductForm = {
  productId: "",
  name: "",
  brand: "",
  productFor: "Unisex",
  season: "All",
  rate: "",
  initialStock: 0,
  imageUrl: assetPath("tshirt.png")
};

const today = new Date().toISOString().slice(0, 10);

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function shortDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [purchaseForm, setPurchaseForm] = useState({ itemId: "", itemNo: "", purchaseDate: today });
  const [saleForm, setSaleForm] = useState({ itemId: "", itemNo: "", discount: 0, dateOfSale: today });

  async function refresh(search = query) {
    setLoading(true);
    const [dashboardData, productsData, stockData, salesData, purchasesData] = await Promise.all([
      api.dashboard(),
      api.products(search),
      api.stock(),
      api.sales(),
      api.purchases()
    ]);
    setDashboard(dashboardData);
    setProducts(productsData);
    setStock(stockData);
    setSales(salesData);
    setPurchases(purchasesData);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((error) => {
      setToast(error.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh(query).catch((error) => setToast(error.message));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedPurchaseProduct = useMemo(
    () => products.find((product) => product.productId === purchaseForm.itemId),
    [products, purchaseForm.itemId]
  );

  const selectedSaleProduct = useMemo(
    () => products.find((product) => product.productId === saleForm.itemId),
    [products, saleForm.itemId]
  );

  const saleRate = selectedSaleProduct
    ? selectedSaleProduct.rate - (selectedSaleProduct.rate * Number(saleForm.discount || 0)) / 100
    : 0;

  const addOrUpdateProduct = async (event) => {
    event.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.productId, productForm);
        setToast("Product updated");
      } else {
        await api.createProduct(productForm);
        setToast("Product added");
      }
      setProductForm(emptyProductForm);
      setEditingProduct(null);
      await refresh();
    } catch (error) {
      setToast(error.message);
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      productId: product.productId,
      name: product.name,
      brand: product.brand,
      productFor: product.productFor,
      season: product.season,
      rate: product.rate,
      initialStock: product.inStock,
      imageUrl: product.imageUrl
    });
    setActiveView("products");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteProduct(deleteTarget.productId);
      setDeleteTarget(null);
      setToast("Product deleted");
      await refresh();
    } catch (error) {
      setToast(error.message);
    }
  };

  const addPurchase = async (event) => {
    event.preventDefault();
    try {
      await api.addPurchase(purchaseForm);
      setPurchaseForm({ itemId: "", itemNo: "", purchaseDate: today });
      setToast("Purchase added");
      await refresh();
    } catch (error) {
      setToast(error.message);
    }
  };

  const addSale = async (event) => {
    event.preventDefault();
    try {
      await api.addSale(saleForm);
      setSaleForm({ itemId: "", itemNo: "", discount: 0, dateOfSale: today });
      setToast("Sale completed");
      await refresh();
    } catch (error) {
      setToast(error.message);
    }
  };

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProductForm((current) => ({ ...current, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand-lockup">
          <div className="brand-mark">FH</div>
          <div>
            <strong>FashionHub</strong>
            <span>Store ops</span>
          </div>
          <ChevronDown size={16} />
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.key}
                className={activeView === item.key ? "nav-item active" : "nav-item"}
                onClick={() => setActiveView(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, brands, seasons..."
            />
          </div>
          <div className="top-actions">
            <button className="icon-button" type="button" title="Notifications" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button className="icon-button" type="button" title="Profile" aria-label="Profile">
              <UserRound size={18} />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">Loading FashionHub...</div>
        ) : (
          <>
            {activeView === "dashboard" && (
              <DashboardView dashboard={dashboard} setActiveView={setActiveView} />
            )}
            {activeView === "products" && (
              <ProductsView
                products={products}
                productForm={productForm}
                setProductForm={setProductForm}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
                addOrUpdateProduct={addOrUpdateProduct}
                editProduct={editProduct}
                setDeleteTarget={setDeleteTarget}
                handleImageFile={handleImageFile}
              />
            )}
            {activeView === "purchase" && (
              <PurchaseView
                products={products}
                form={purchaseForm}
                setForm={setPurchaseForm}
                selectedProduct={selectedPurchaseProduct}
                addPurchase={addPurchase}
              />
            )}
            {activeView === "sales" && (
              <SalesView
                products={products}
                form={saleForm}
                setForm={setSaleForm}
                selectedProduct={selectedSaleProduct}
                saleRate={saleRate}
                addSale={addSale}
              />
            )}
            {activeView === "stock" && <StockView stock={stock} />}
            {activeView === "reports" && (
              <ReportsView dashboard={dashboard} sales={sales} purchases={purchases} />
            )}
          </>
        )}
      </main>

      <MobileNav activeView={activeView} setActiveView={setActiveView} />

      {deleteTarget && (
        <DeleteDialog
          product={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function DashboardView({ dashboard, setActiveView }) {
  const metrics = [
    { label: "Total Products", value: formatNumber(dashboard.totalProducts), tone: "ink", icon: Boxes },
    { label: "In Stock Items", value: formatNumber(dashboard.inStockItems), tone: "green", icon: Warehouse },
    { label: "Total Sales", value: formatCurrency(dashboard.totalSales), tone: "gold", icon: CircleDollarSign },
    { label: "Total Purchase", value: formatCurrency(dashboard.totalPurchase), tone: "coral", icon: ReceiptIndianRupee }
  ];

  return (
    <section className="view-stack">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Fashion store management</p>
          <h1>Dashboard</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => setActiveView("products")}>
          <PackagePlus size={18} />
          Add Product
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="banner-panel">
          <img src={assetPath("banner.png")} alt="Fashion inventory workspace" />
          <div className="banner-copy">
            <span>Today</span>
            <strong>{formatNumber(dashboard.stockTotalUnits)} stock units tracked</strong>
            <button className="ghost-on-dark" type="button" onClick={() => setActiveView("stock")}>
              View Stock
            </button>
          </div>
        </div>

        <div className="metric-grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className={`metric-card ${metric.tone}`} key={metric.label}>
                <div className="metric-icon">
                  <Icon size={18} />
                </div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            );
          })}
        </div>
      </div>

      <div className="split-grid">
        <TablePanel title="Recent Sales">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentSales.map((sale) => (
                <tr key={sale.saleId}>
                  <td>{sale.productName}</td>
                  <td>{sale.noOfItemsSold}</td>
                  <td>{formatCurrency(sale.amount)}</td>
                  <td>{sale.dateOfSale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>

        <section className="panel">
          <div className="panel-header">
            <h2>Low Stock Alert</h2>
            <button className="text-button" type="button" onClick={() => setActiveView("stock")}>
              View all
            </button>
          </div>
          <div className="alert-list">
            {dashboard.lowStock.slice(0, 4).map((product) => (
              <div className="alert-row" key={product.productId}>
                <img src={product.imageUrl} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.productId}</span>
                </div>
                <em className={product.inStock === 0 ? "danger" : ""}>{product.inStock}</em>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function ProductsView({
  products,
  productForm,
  setProductForm,
  editingProduct,
  setEditingProduct,
  addOrUpdateProduct,
  editProduct,
  setDeleteTarget,
  handleImageFile
}) {
  return (
    <section className="view-stack two-column">
      <div>
        <div className="view-heading">
          <div>
            <p className="eyebrow">Catalog</p>
            <h1>Products</h1>
          </div>
          <span className="count-chip">{products.length} items</span>
        </div>

        <TablePanel title="Product List">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>For</th>
                <th>Season</th>
                <th>Rate</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.productId}>
                  <td>
                    <div className="product-cell">
                      <img src={product.imageUrl} alt="" />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.productId}</span>
                      </div>
                    </div>
                  </td>
                  <td>{product.brand}</td>
                  <td>{product.productFor}</td>
                  <td>{product.season}</td>
                  <td>{formatCurrency(product.rate)}</td>
                  <td>
                    <StatusBadge status={product.status} label={`${product.inStock}`} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-button small" type="button" title="Edit product" onClick={() => editProduct(product)}>
                        <Edit3 size={15} />
                      </button>
                      <button className="icon-button small danger" type="button" title="Delete product" onClick={() => setDeleteTarget(product)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>
      </div>

      <form className="form-panel" onSubmit={addOrUpdateProduct}>
        <div className="panel-header">
          <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
          {editingProduct && (
            <button
              className="icon-button small"
              type="button"
              title="Cancel edit"
              onClick={() => {
                setEditingProduct(null);
                setProductForm(emptyProductForm);
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <label>
          Product ID
          <input
            value={productForm.productId}
            disabled={Boolean(editingProduct)}
            onChange={(event) => setProductForm({ ...productForm, productId: event.target.value })}
            placeholder="Auto or P007"
          />
        </label>

        <label>
          Product Name
          <input
            value={productForm.name}
            onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
            placeholder="Enter product name"
            required
          />
        </label>

        <label>
          Brand
          <input
            value={productForm.brand}
            onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })}
            placeholder="Enter brand"
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Product For
            <select
              value={productForm.productFor}
              onChange={(event) => setProductForm({ ...productForm, productFor: event.target.value })}
            >
              <option>Men</option>
              <option>Women</option>
              <option>Unisex</option>
            </select>
          </label>

          <label>
            Season
            <select
              value={productForm.season}
              onChange={(event) => setProductForm({ ...productForm, season: event.target.value })}
            >
              <option>Summer</option>
              <option>Winter</option>
              <option>All</option>
              <option>Festive</option>
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label>
            Rate
            <input
              type="number"
              min="1"
              value={productForm.rate}
              onChange={(event) => setProductForm({ ...productForm, rate: event.target.value })}
              placeholder="Enter rate"
              required
            />
          </label>
          <label>
            Initial Stock
            <input
              type="number"
              min="0"
              disabled={Boolean(editingProduct)}
              value={productForm.initialStock}
              onChange={(event) => setProductForm({ ...productForm, initialStock: event.target.value })}
            />
          </label>
        </div>

        <label>
          Image URL
          <input
            value={productForm.imageUrl}
            onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })}
            placeholder="/assets/products/tshirt.png"
          />
        </label>

        <div className="product-preview">
          <img src={productForm.imageUrl || assetPath("tshirt.png")} alt="Product preview" />
          <label className="upload-button">
            <Upload size={16} />
            Upload Image
            <input type="file" accept="image/*" onChange={handleImageFile} />
          </label>
        </div>

        <button className="primary-button full" type="submit">
          <CheckCircle2 size={18} />
          {editingProduct ? "Update Product" : "Save Product"}
        </button>
      </form>
    </section>
  );
}

function PurchaseView({ products, form, setForm, selectedProduct, addPurchase }) {
  const total = selectedProduct ? Number(selectedProduct.rate) * Number(form.itemNo || 0) : 0;

  return (
    <section className="workflow-stage purchase-stage" style={{ "--stage-bg": `url("${assetPath("purchase-bg.png")}")` }}>
      <form className="workflow-card" onSubmit={addPurchase}>
        <div className="view-heading compact">
          <div>
            <p className="eyebrow">Inventory intake</p>
            <h1>Purchase Product</h1>
          </div>
          <PackagePlus size={24} />
        </div>

        <label>
          Product ID
          <select value={form.itemId} onChange={(event) => setForm({ ...form, itemId: event.target.value })} required>
            <option value="">Select Product</option>
            {products.map((product) => (
              <option value={product.productId} key={product.productId}>
                {product.productId} - {product.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          No. of Items
          <input
            type="number"
            min="1"
            value={form.itemNo}
            onChange={(event) => setForm({ ...form, itemNo: event.target.value })}
            placeholder="Enter quantity"
            required
          />
        </label>

        <label>
          Purchase Date
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })}
            required
          />
        </label>

        <SummaryBox
          items={[
            ["Product Rate", formatCurrency(selectedProduct?.rate)],
            ["Total Amount", formatCurrency(total)]
          ]}
        />

        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => setForm({ itemId: "", itemNo: "", purchaseDate: today })}>
            Reset
          </button>
          <button className="primary-button" type="submit">
            Confirm Purchase
          </button>
        </div>
      </form>
    </section>
  );
}

function SalesView({ products, form, setForm, selectedProduct, saleRate, addSale }) {
  const total = saleRate * Number(form.itemNo || 0);

  return (
    <section className="workflow-stage sale-stage" style={{ "--stage-bg": `url("${assetPath("sale-bg.png")}")` }}>
      <form className="workflow-card" onSubmit={addSale}>
        <div className="view-heading compact">
          <div>
            <p className="eyebrow">Checkout</p>
            <h1>Sale Product</h1>
          </div>
          <ShoppingCart size={24} />
        </div>

        <label>
          Product ID
          <select value={form.itemId} onChange={(event) => setForm({ ...form, itemId: event.target.value })} required>
            <option value="">Select Product</option>
            {products.map((product) => (
              <option value={product.productId} key={product.productId}>
                {product.productId} - {product.name} ({product.inStock})
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          <label>
            No. of Items
            <input
              type="number"
              min="1"
              value={form.itemNo}
              onChange={(event) => setForm({ ...form, itemNo: event.target.value })}
              placeholder="Enter quantity"
              required
            />
          </label>
          <label>
            Discount (%)
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount}
              onChange={(event) => setForm({ ...form, discount: event.target.value })}
            />
          </label>
        </div>

        <label>
          Date of Sale
          <input
            type="date"
            value={form.dateOfSale}
            onChange={(event) => setForm({ ...form, dateOfSale: event.target.value })}
            required
          />
        </label>

        <SummaryBox
          items={[
            ["Original Rate", formatCurrency(selectedProduct?.rate)],
            ["Sale Rate", formatCurrency(saleRate)],
            ["Total Amount", formatCurrency(total)]
          ]}
        />

        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => setForm({ itemId: "", itemNo: "", discount: 0, dateOfSale: today })}>
            Reset
          </button>
          <button className="primary-button gold" type="submit">
            Complete Sale
          </button>
        </div>
      </form>
    </section>
  );
}

function StockView({ stock }) {
  const inStock = stock.filter((item) => item.status === "Yes").length;
  const outStock = stock.length - inStock;
  const percent = stock.length ? Math.round((inStock / stock.length) * 100) : 0;

  return (
    <section className="view-stack two-column stock-layout">
      <div>
        <div className="view-heading">
          <div>
            <p className="eyebrow">Inventory</p>
            <h1>Stock Overview</h1>
          </div>
        </div>

        <TablePanel title="Current Stock">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>In Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.productId}>
                  <td>
                    <div className="product-cell">
                      <img src={item.imageUrl} alt="" />
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.productId}</span>
                      </div>
                    </div>
                  </td>
                  <td>{item.brand}</td>
                  <td>{item.inStock}</td>
                  <td><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>
      </div>

      <section className="panel stock-summary">
        <div className="panel-header">
          <h2>Stock Summary</h2>
          <SlidersHorizontal size={18} />
        </div>
        <div className="donut" style={{ "--stock": `${percent}%` }}>
          <span>{formatNumber(stock.length)}</span>
          <small>Total Items</small>
        </div>
        <div className="legend-list">
          <div><span className="legend green"></span>In Stock <strong>{inStock}</strong></div>
          <div><span className="legend red"></span>Out of Stock <strong>{outStock}</strong></div>
        </div>
      </section>
    </section>
  );
}

function ReportsView({ dashboard, sales, purchases }) {
  const maxValue = Math.max(
    1,
    ...dashboard.salesTrend.map((item) => item.amount),
    ...dashboard.purchaseTrend.map((item) => item.amount)
  );

  return (
    <section className="view-stack">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Sales Report</h1>
        </div>
      </div>

      <div className="metric-grid reports">
        <article className="metric-card gold">
          <span>Total Sales</span>
          <strong>{formatCurrency(dashboard.totalSales)}</strong>
        </article>
        <article className="metric-card coral">
          <span>Total Purchase</span>
          <strong>{formatCurrency(dashboard.totalPurchase)}</strong>
        </article>
        <article className="metric-card green">
          <span>Total Products</span>
          <strong>{formatNumber(dashboard.totalProducts)}</strong>
        </article>
        <article className="metric-card ink">
          <span>Low Stock Items</span>
          <strong>{formatNumber(dashboard.lowStockCount)}</strong>
        </article>
      </div>

      <div className="split-grid">
        <TablePanel title="Sales Ledger">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Items Sold</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 6).map((sale) => (
                <tr key={sale.saleId}>
                  <td>{sale.productName}</td>
                  <td>{sale.noOfItemsSold}</td>
                  <td>{formatCurrency(sale.amount)}</td>
                  <td>{sale.dateOfSale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>

        <section className="panel">
          <div className="panel-header">
            <h2>Sales vs Purchase</h2>
            <CalendarDays size={18} />
          </div>
          <div className="bar-chart">
            {dashboard.salesTrend.map((salePoint, index) => {
              const purchasePoint = dashboard.purchaseTrend[index] || { amount: 0, date: salePoint.date };
              return (
                <div className="bar-group" key={salePoint.date}>
                  <div className="bars">
                    <span className="bar sales" style={{ height: `${Math.max(10, (salePoint.amount / maxValue) * 160)}px` }}></span>
                    <span className="bar purchase" style={{ height: `${Math.max(10, (purchasePoint.amount / maxValue) * 160)}px` }}></span>
                  </div>
                  <small>{shortDate(salePoint.date)}</small>
                </div>
              );
            })}
          </div>
          <div className="chart-key">
            <span><i className="sales-dot"></i>Sales</span>
            <span><i className="purchase-dot"></i>Purchase</span>
          </div>
        </section>
      </div>

      <TablePanel title="Purchase Ledger">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.slice(0, 6).map((purchase) => (
              <tr key={purchase.purchaseId}>
                <td>{purchase.productName}</td>
                <td>{purchase.noOfItems}</td>
                <td>{formatCurrency(purchase.amount)}</td>
                <td>{purchase.purchaseDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}

function TablePanel({ title, children }) {
  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="table-scroll">{children}</div>
    </section>
  );
}

function SummaryBox({ items }) {
  return (
    <div className="summary-box">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status, label = status }) {
  return <span className={status === "Yes" ? "status yes" : "status no"}>{label}</span>;
}

function DeleteDialog({ product, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="delete-icon">
          <Trash2 size={28} />
        </div>
        <h2 id="delete-title">Delete Product</h2>
        <p>Are you sure you want to delete {product.name}? This action removes related sales, purchase, and stock records.</p>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="danger-button" type="button" onClick={onConfirm}>Delete</button>
        </div>
      </section>
    </div>
  );
}

function MobileNav({ activeView, setActiveView }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            className={activeView === item.key ? "active" : ""}
            type="button"
            title={item.label}
            aria-label={item.label}
            onClick={() => setActiveView(item.key)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default App;
