"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  PackagePlus,
  RefreshCw,
  Store,
} from "lucide-react";

type Product = {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock_quantity: number;
  approved: boolean;
  active: boolean;
  image_url?: string | null;
};

type ProductForm = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock_quantity: string;
  image_url: string;
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8020/api/v1"
).replace(/\/$/, "");

const EMPTY_FORM: ProductForm = {
  sku: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  stock_quantity: "0",
  image_url: "",
};

export default function SellerPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("Seller");
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("apexive_token") || "";
    const rawUser = localStorage.getItem("apexive_user");

    setToken(savedToken);

    if (!savedToken) {
      setError("Sign in with your Seller Account to access your shop.");
      setLoading(false);
      return;
    }

    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        setUsername(user.username || "Seller");

        if (String(user.role || "").toUpperCase() !== "SELLER") {
          setError("Sign in with a Seller Account to manage products.");
        }
      } catch {
        setError("Your saved account information is invalid. Please sign in again.");
      }
    }
  }, []);

  const loadProducts = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/seller/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || `Unable to load products (${response.status})`,
        );
      }

      const list: Product[] = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.products)
            ? data.products
            : [];

      setProducts(list);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void loadProducts();
    } else {
      setLoading(false);
    }
  }, [token, loadProducts]);

  function updateField(key: keyof ProductForm, value: string) {
    setForm((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "name" && !previous.slug) {
        next.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      return next;
    });
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Please sign in with your Seller Account.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/seller/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          price: Number(form.price),
          stock_quantity: Number(form.stock_quantity),
          image_url: form.image_url.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || `Product creation failed (${response.status})`,
        );
      }

      setNotice(
        "Product submitted successfully. It will appear in the public collection after approval.",
      );

      setForm(EMPTY_FORM);
      setShowForm(false);

      await loadProducts();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to create product.",
      );
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("apexive_token");
    localStorage.removeItem("apexive_user");
    window.location.href = "/login?role=seller";
  }

  const inventoryValue = products.reduce(
    (total, product) =>
      total +
      Number(product.price || 0) * Number(product.stock_quantity || 0),
    0,
  );

  const approvedProducts = products.filter(
    (product) => product.approved && product.active,
  ).length;

  if (!token) {
    return (
      <main>
        <div className="announcement">
          ApexiveAI Marketplace · Seller Studio
        </div>

        <section className="form-shell">
          <aside className="form-art">
            <div className="form-art-copy">
              <span className="eyebrow">For independent sellers</span>
              <h2 className="serif">
                Your shop.
                <br />
                Your point of view.
              </h2>
            </div>
          </aside>

          <div className="form-panel">
            <div className="form-inner">
              <span className="eyebrow">Seller studio</span>

              <h1 className="serif">Your business starts here.</h1>

              <p className="sub">
                Sign in with your Seller Account to manage products, inventory
                and your marketplace catalog.
              </p>

              <Link className="btn-primary" href="/login?role=seller">
                Seller sign in
                <ArrowUpRight size={14} style={{ marginLeft: 12 }} />
              </Link>

              <p style={{ marginTop: 22, fontSize: 12 }}>
                Need an account?{" "}
                <Link
                  href="/login?role=seller"
                  style={{ textDecoration: "underline" }}
                >
                  Request a Seller Account
                </Link>
              </p>

              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 20,
                  fontSize: 12,
                }}
              >
                <ArrowLeft size={14} />
                Return to marketplace
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="seller-shell">
      <div className="seller-top">
        <div className="container-wide seller-top-inner">
          <Link
            href="/"
            className="brand"
            style={{ fontSize: 15, color: "white" }}
          >
            APEXIVEAI
            <small>SELLER STUDIO</small>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 12,
            }}
          >
            <span>{username}</span>

            <button
              onClick={signOut}
              style={{
                background: "none",
                border: 0,
                color: "white",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="container-wide seller-main">
        <div className="seller-title">
          <div>
            <span className="eyebrow">Your business, considered</span>
            <h1 className="serif">Seller Studio</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Manage your products and keep your collection up to date.
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={() => setShowForm((current) => !current)}
          >
            <PackagePlus size={15} style={{ marginRight: 10 }} />
            {showForm ? "Close form" : "Add a product"}
          </button>
        </div>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="notice error-notice">{error}</div>}

        <div
          className="category-grid"
          style={{ marginBottom: 25 }}
        >
          <div className="panel">
            <span className="eyebrow">Total products</span>
            <div className="serif" style={{ fontSize: 36, marginTop: 12 }}>
              {products.length}
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Products in your catalog
            </span>
          </div>

          <div className="panel">
            <span className="eyebrow">Approved & active</span>
            <div className="serif" style={{ fontSize: 36, marginTop: 12 }}>
              {approvedProducts}
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Visible in the marketplace
            </span>
          </div>

          <div className="panel">
            <span className="eyebrow">Inventory value</span>
            <div className="serif" style={{ fontSize: 30, marginTop: 12 }}>
              {inventoryValue.toLocaleString()}{" "}
              <span style={{ fontSize: 12 }}>MMK*</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              *Listed price multiplied by stock
            </span>
          </div>

          <div className="panel">
            <span className="eyebrow">Quick actions</span>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-outline"
                onClick={() => void loadProducts()}
              >
                <RefreshCw size={13} style={{ marginRight: 7 }} />
                Refresh
              </button>

              <Link href="/" className="btn-outline">
                <Store size={13} style={{ marginRight: 7 }} />
                View store
              </Link>
            </div>
          </div>
        </div>

        {showForm && (
          <section className="panel" style={{ marginBottom: 25 }}>
            <h2>List a new product</h2>

            <form
              onSubmit={createProduct}
              className="category-grid"
              style={{
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: "0 24px",
              }}
            >
              <div className="field">
                <label htmlFor="product-name">Product name</label>
                <input
                  id="product-name"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="Product name"
                />
              </div>

              <div className="field">
                <label htmlFor="product-sku">SKU</label>
                <input
                  id="product-sku"
                  required
                  value={form.sku}
                  onChange={(event) =>
                    updateField("sku", event.target.value)
                  }
                  placeholder="SKU-001"
                />
              </div>

              <div className="field">
                <label htmlFor="product-slug">URL slug</label>
                <input
                  id="product-slug"
                  required
                  value={form.slug}
                  onChange={(event) =>
                    updateField("slug", event.target.value)
                  }
                  placeholder="product-name"
                />
              </div>

              <div className="field">
                <label htmlFor="product-price">Price (MMK)</label>
                <input
                  id="product-price"
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  placeholder="45000"
                />
              </div>

              <div className="field">
                <label htmlFor="product-stock">Available stock</label>
                <input
                  id="product-stock"
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock_quantity}
                  onChange={(event) =>
                    updateField("stock_quantity", event.target.value)
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="product-image">Product image URL</label>
                <input
                  id="product-image"
                  type="url"
                  value={form.image_url}
                  onChange={(event) =>
                    updateField("image_url", event.target.value)
                  }
                  placeholder="https://example.com/product.jpg"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="product-description">Description</label>
                <textarea
                  id="product-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Tell customers what makes this product special."
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Submitting…" : "Submit for approval"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <h2 style={{ margin: 0 }}>Your products</h2>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              {products.length} listed
            </span>
          </div>

          {loading ? (
            <div className="empty-state">Loading your product catalog…</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              No products yet. Add your first product to start building your
              collection.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Approval</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong style={{ fontWeight: 500 }}>
                          {product.name}
                        </strong>
                      </td>
                      <td>{product.sku}</td>
                      <td>{Number(product.price).toLocaleString()} MMK</td>
                      <td>{product.stock_quantity}</td>
                      <td>
                        <span className="status-pill">
                          {product.approved ? "Approved" : "Pending review"}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill">
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}