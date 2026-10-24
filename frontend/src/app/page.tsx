"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Heart,
  Search,
  ShoppingBag,
  UserRound,
  Sparkles,
} from "lucide-react";

type Product = {
  id: number;
  tenant_id: number;
  seller_id: number;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number | string;
  stock_quantity: number;
  image_url?: string | null;
  approved: boolean;
  active: boolean;
};

type CurrentUser = {
  id?: string | number;
  username?: string;
  role?: string;
  tenant_id?: string | number;
};

type CartItem = {
  product_id: number;
  quantity: number;
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8020/api/v1"
).replace(/\/$/, "");

const categories = [
  { name: "Jewelry & Accessories", label: "Timeless details" },
  { name: "Home & Living", label: "Made for living" },
  { name: "Style & Apparel", label: "Your everyday edit" },
  { name: "Gifts & Discoveries", label: "Thoughtful finds" },
];

const featured = [
  {
    name: "The Sculpted Gold Ring",
    description: "A modern heirloom",
    price: 89000,
    badge: "Bestseller",
  },
  {
    name: "Everyday Pearl Pendant",
    description: "Quietly luminous",
    price: 125000,
    badge: "New arrival",
  },
  {
    name: "Organic Form Earrings",
    description: "Sculptural simplicity",
    price: 76000,
    badge: "Editor's pick",
  },
  {
    name: "The Keepsake Bracelet",
    description: "Made to be treasured",
    price: 99000,
    badge: "Signature",
  },
];

function money(value: number | string, currency = "MMK") {
  const number = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(number);
  } catch {
    return `${number.toLocaleString()} ${currency}`;
  }
}

function Header({
  user,
  search,
  setSearch,
  cartCount,
}: {
  user: CurrentUser | null;
  search: string;
  setSearch: (value: string) => void;
  cartCount: number;
}) {
  const role = user?.role?.toUpperCase();

  return (
    <>
      <div className="announcement">
        A considered collection of exceptional finds · Discover independent
        sellers
      </div>

      <header className="site-header">
        <div className="container-wide header-top">
          <Link href="/" className="brand">
            APEXIVEAI
            <small>MARKETPLACE</small>
          </Link>

          <label className="search-wrap">
            <Search size={15} strokeWidth={1.5} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the collection"
              aria-label="Search products"
            />
          </label>

          <div className="header-actions">
            <Link
              className="icon-link"
              href={role === "SELLER" ? "/seller" : "/login?role=buyer"}
              aria-label="Account"
            >
              <UserRound size={17} strokeWidth={1.5} />
              <span className="text-action">
                {user?.username || "Account"}
              </span>
            </Link>

            <Link
              className="icon-link"
              href="/login?role=buyer"
              aria-label="Shopping bag"
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              <span>{cartCount}</span>
            </Link>
          </div>
        </div>

        <div className="nav-bar">
          <nav className="nav-links">
            <a href="#new">New & Noteworthy</a>
            <a href="#categories">Shop by Category</a>
            <a href="#featured">The Collection</a>
            <a href="#story">Our Point of View</a>
            <Link href="/login?role=seller">Sell With Us</Link>
          </nav>
        </div>
      </header>
    </>
  );
}

function ProductCard({
  product,
  fallback,
  currency,
  onAdd,
}: {
  product?: Product;
  fallback?: (typeof featured)[number];
  currency: string;
  onAdd: (product: Product) => void;
}) {
  const [liked, setLiked] = useState(false);

  const name = product?.name || fallback?.name || "Considered Essential";
  const description =
    product?.description || fallback?.description || "Designed to be treasured";
  const price = product?.price ?? fallback?.price ?? 0;

  return (
    <article className="product-card">
      <div
        className="product-image"
        style={
          product?.image_url
            ? {
                backgroundImage: `url("${product.image_url}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <button
          className="heart"
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => setLiked(!liked)}
        >
          <Heart
            size={16}
            fill={liked ? "#a78a55" : "none"}
            color={liked ? "#a78a55" : "#36372f"}
            strokeWidth={1.5}
          />
        </button>

        {product && (
          <button
            className="quick-add"
            onClick={() => onAdd(product)}
            disabled={Number(product.stock_quantity) < 1}
          >
            {Number(product.stock_quantity) < 1 ? "Sold out" : "Add to bag"}
          </button>
        )}
      </div>

      <div className="product-meta">
        <span className="product-badge">
          {product
            ? Number(product.stock_quantity) > 0
              ? "Independent seller"
              : "Currently unavailable"
            : fallback?.badge}
        </span>

        <h3>{name}</h3>
        <p>{description}</p>
        <div className="product-price">{money(price, currency)}</div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState("");
  const [currency] = useState("MMK");

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("apexive_token") || "";
      const savedUser = localStorage.getItem("apexive_user");

      setToken(savedToken);

      if (savedUser) {
        const parsed = JSON.parse(savedUser) as CurrentUser;
        setUser(parsed);

        if (parsed.tenant_id != null) {
          setTenantId(String(parsed.tenant_id));
        }
      }

      const configuredTenant =
        process.env.NEXT_PUBLIC_MARKETPLACE_TENANT_ID || "";

      if (configuredTenant) {
        setTenantId((current) => current || configuredTenant);
      }

      const savedCart = localStorage.getItem("apexive_cart");

      if (savedCart) {
        const items = JSON.parse(savedCart) as CartItem[];
        setCartCount(
          items.reduce((total, item) => total + item.quantity, 0),
        );
      }
    } catch {
      // Ignore malformed local browser state.
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();

      if (tenantId) query.set("tenant_id", tenantId);
      if (search.trim()) query.set("search", search.trim());

      const suffix = query.toString() ? `?${query.toString()}` : "";

      const response = await fetch(
        `${API_URL}/catalog/products${suffix}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`Catalog request failed (${response.status})`);
      }

      const data = await response.json();

      const list: Product[] = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.products)
            ? data.products
            : [];

      setProducts(list.filter((product) => product.active && product.approved));
    } catch {
      setError(
        "The live catalog is unavailable. Please check the Marketplace API connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProducts();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      `${product.name} ${product.description || ""} ${product.sku}`
        .toLowerCase()
        .includes(term),
    );
  }, [products, search]);

  function addToCart(product: Product) {
    if (!token || user?.role?.toUpperCase() !== "BUYER") {
      setNotice("Sign in with your Buyer Account to add products to your bag.");
      return;
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem("apexive_cart") || "[]",
      ) as CartItem[];

      const existing = saved.find(
        (item) => item.product_id === product.id,
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        saved.push({ product_id: product.id, quantity: 1 });
      }

      localStorage.setItem("apexive_cart", JSON.stringify(saved));

      setCartCount(
        saved.reduce((total, item) => total + item.quantity, 0),
      );

      setNotice(`${product.name} added to your bag.`);
    } catch {
      setNotice("Please refresh the page and try again.");
    }
  }

  return (
    <main>
      <Header
        user={user}
        search={search}
        setSearch={setSearch}
        cartCount={cartCount}
      />

      <section className="hero" id="new">
        <div className="hero-copy">
          <span className="eyebrow">A new perspective on finding</span>

          <h1 className="serif">
            The art of
            <br />
            finding your
            <br />
            <em>exceptional.</em>
          </h1>

          <p>
            Discover thoughtful pieces, independent makers and everyday
            luxuries — all in one considered marketplace.
          </p>

          <a className="btn-primary" href="#featured">
            Explore the collection
            <ArrowRight size={14} style={{ marginLeft: 12 }} />
          </a>
        </div>

        <div
          className="hero-art"
          aria-label="Abstract warm gold luxury product artwork"
        >
          <div className="hero-orb" />
          <div className="hero-stamp">
            Find
            <br />
            something
            <br />
            meaningful
          </div>
        </div>
      </section>

      <section className="section container-wide" id="categories">
        <div className="section-head">
          <div>
            <span className="eyebrow">A world of possibilities</span>
            <h2 className="serif">Explore by category</h2>
          </div>

          <a className="text-link" href="#featured">
            Browse everything <ArrowRight size={13} style={{ display: "inline", marginLeft: 8 }} />
          </a>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <a className="category-card" href="#featured" key={category.name}>
              <span>
                <span>
                  <strong>{category.name}</strong>
                  <br />
                  <small
                    style={{
                      display: "inline-block",
                      marginTop: 5,
                      opacity: 0.68,
                      letterSpacing: ".02em",
                      textTransform: "none",
                    }}
                  >
                    {category.label}
                  </small>
                </span>
                <ArrowDownRight size={18} />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section
        className="section container-wide"
        id="featured"
        style={{ paddingTop: 20 }}
      >
        <div className="section-head">
          <div>
            <span className="eyebrow">Thoughtfully selected</span>
            <h2 className="serif">The collection</h2>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {products.length
              ? `${visibleProducts.length} pieces`
              : "A first look at our edit"}
          </span>
        </div>

        {notice && (
          <div className="notice">
            {notice}{" "}
            {notice.includes("Buyer Account") && (
              <Link
                href="/login?role=buyer"
                style={{ textDecoration: "underline", marginLeft: 8 }}
              >
                Buyer sign in
              </Link>
            )}
          </div>
        )}

        {error && <div className="notice error-notice">{error}</div>}
        {loading && <div className="notice">Curating the collection…</div>}

        <div className="product-grid">
          {visibleProducts.length > 0
            ? visibleProducts.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  currency={currency}
                />
              ))
            : featured.map((product) => (
                <ProductCard
                  key={product.name}
                  fallback={product}
                  onAdd={() =>
                    setNotice(
                      "Sign in with your Buyer Account to shop the live catalog.",
                    )
                  }
                  currency={currency}
                />
              ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 42 }}>
          <Link className="btn-outline" href="/login?role=buyer">
            Discover more pieces
            <ArrowRight size={14} style={{ marginLeft: 12 }} />
          </Link>
        </div>
      </section>

      <section className="container-wide" id="story">
        <div className="editorial">
          <div className="editorial-art" />
          <div className="editorial-copy">
            <span className="eyebrow">A better way to discover</span>
            <h2 className="serif">
              Good things.
              <br />
              Good people.
              <br />
              <em>Good stories.</em>
            </h2>
            <p>
              We bring independent sellers and curious shoppers together
              around products worth discovering — with thoughtful design at
              every step.
            </p>
            <Link className="btn-primary" href="/login?role=seller">
              Meet your marketplace
              <ArrowRight size={14} style={{ marginLeft: 12 }} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="section container-wide"
        style={{ paddingBottom: 65 }}
      >
        <div className="trust-strip">
          <div className="trust-item">
            <Sparkles size={19} strokeWidth={1.4} />
            <strong className="serif">Considered finds</strong>
            <span>
              Discover products from sellers with their own point of view.
            </span>
          </div>

          <div className="trust-item">
            <ShoppingBag size={19} strokeWidth={1.4} />
            <strong className="serif">One thoughtful place</strong>
            <span>
              A simpler way to explore collections across categories.
            </span>
          </div>

          <div className="trust-item">
            <Heart size={19} strokeWidth={1.4} />
            <strong className="serif">Independent spirit</strong>
            <span>
              Support the people and businesses behind the products.
            </span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container-wide">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">APEXIVEAI</div>
              <div className="eyebrow" style={{ marginTop: 7 }}>
                Marketplace
              </div>
              <p className="footer-copy">
                A considered destination for exceptional finds from
                independent sellers.
              </p>
            </div>

            <div className="footer-col">
              <strong>Discover</strong>
              <a href="#new">New & noteworthy</a>
              <a href="#categories">Categories</a>
              <a href="#featured">The collection</a>
            </div>

            <div className="footer-col">
              <strong>Your account</strong>
              <Link href="/login?role=buyer">Buyer account</Link>
              <Link href="/login?role=seller">Seller account</Link>
              <Link href="/seller">Seller portal</Link>
            </div>

            <div className="footer-col">
              <strong>Join the marketplace</strong>
              <p className="footer-copy">
                Bring your products to a place built for discovery.
              </p>
              <Link
                href="/login?role=seller"
                style={{ textDecoration: "underline", textUnderlineOffset: 5 }}
              >
                Become a seller <ArrowRight size={13} style={{ display: "inline", marginLeft: 6 }} />
              </Link>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              © 2026 ApexiveAI Marketplace. All rights
              reserved.
            </span>
            <span>Thoughtfully discovered. Beautifully considered.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}