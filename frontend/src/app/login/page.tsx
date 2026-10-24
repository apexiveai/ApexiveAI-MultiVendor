"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const COMMUNITY_API = (
  process.env.NEXT_PUBLIC_COMMUNITY_API_URL ||
  "https://commu-api.apexiveai.com/api"
).replace(/\/$/, "");

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole] = useState<"BUYER" | "SELLER">(
    params.get("role")?.toUpperCase() === "SELLER" ? "SELLER" : "BUYER",
  );

  const [mode, setMode] = useState<"login" | "request">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${COMMUNITY_API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.message ||
            "Unable to sign in. Check your credentials.",
        );
      }

      const actualRole = String(
        result.user?.role || result.role || "",
      ).toUpperCase();

      if (actualRole !== role) {
        throw new Error(
          `This account is ${actualRole || "not recognized"}. Choose the matching account type.`,
        );
      }

      const accessToken = result.access_token || result.token;

      if (!accessToken) {
        throw new Error(
          "The identity service did not return an access token.",
        );
      }

      localStorage.setItem("apexive_token", accessToken);
      localStorage.setItem(
        "apexive_user",
        JSON.stringify(result.user || { username, role }),
      );

      router.push(role === "SELLER" ? "/seller" : "/");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Sign-in failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  function submitAccountRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const subject = `${role === "SELLER" ? "Seller" : "Buyer"} Account Request`;

    const body = [
      subject,
      "",
      `Name: ${displayName}`,
      `Email: ${email}`,
      `Account type: ${role}`,
      ...(role === "SELLER" ? [`Shop name: ${shopName}`] : []),
      "",
      "Please review this request and create the appropriate account in ApexiveAI Community.",
    ].join("\n");

    const mailto =
      `mailto:support@apexiveai.com` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    setMessage(
      "Your email application should open with your request prepared. Account access requires administrator approval.",
    );
  }

  return (
    <main>
      <div className="announcement">
        Welcome to a more considered marketplace
      </div>

      <header className="site-header">
        <div className="container-wide header-top">
          <Link href="/" className="brand">
            APEXIVEAI
            <small>MARKETPLACE</small>
          </Link>

          <Link href="/" className="icon-link">
            <ArrowLeft size={15} />
            <span className="text-action">Back to collection</span>
          </Link>
        </div>
      </header>

      <div className="form-shell">
        <aside className="form-art">
          <div className="form-art-copy">
            <span className="eyebrow">A place for exceptional finds</span>
            <h2 className="serif">
              Discover more.
              <br />
              Make it yours.
            </h2>
            <p style={{ fontSize: 12, lineHeight: 1.8, maxWidth: 300 }}>
              Your next favourite find — or the perfect place to share what
              you make.
            </p>
          </div>
        </aside>

        <section className="form-panel">
          <div className="form-inner">
            <span className="eyebrow">
              {mode === "login"
                ? "Your marketplace account"
                : "Join our community"}
            </span>

            <h1 className="serif">
              {mode === "login" ? "Welcome back." : "Let's get started."}
            </h1>

            <p className="sub">
              {mode === "login"
                ? "Sign in to continue your marketplace journey."
                : "Request a Buyer or Seller account for ApexiveAI Marketplace."}
            </p>

            <div className="role-switch">
              <button
                type="button"
                className={role === "BUYER" ? "active" : ""}
                onClick={() => {
                  setRole("BUYER");
                  setError("");
                  setMessage("");
                }}
              >
                Buyer account
              </button>

              <button
                type="button"
                className={role === "SELLER" ? "active" : ""}
                onClick={() => {
                  setRole("SELLER");
                  setError("");
                  setMessage("");
                }}
              >
                Seller account
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={submitLogin}>
                <div className="field">
                  <label htmlFor="username">Username or email</label>
                  <input
                    id="username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username or email"
                  />
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <div className="notice error-notice">{error}</div>
                )}

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={busy}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? "Signing in…" : `Sign in as ${role.toLowerCase()}`}
                  <ArrowRight size={14} style={{ marginLeft: 12 }} />
                </button>

                <p className="sub" style={{ marginTop: 22, marginBottom: 0 }}>
                  New to the marketplace?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("request");
                      setError("");
                      setMessage("");
                    }}
                    style={{
                      background: "none",
                      border: 0,
                      padding: 0,
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "var(--ink)",
                    }}
                  >
                    Request an account
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={submitAccountRequest}>
                <div className="field">
                  <label htmlFor="displayName">Full name</label>
                  <input
                    id="displayName"
                    required
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                {role === "SELLER" && (
                  <div className="field">
                    <label htmlFor="shopName">Shop / business name</label>
                    <input
                      id="shopName"
                      required
                      value={shopName}
                      onChange={(event) => setShopName(event.target.value)}
                      placeholder="Your shop name"
                    />
                  </div>
                )}

                {error && (
                  <div className="notice error-notice">{error}</div>
                )}

                {message && (
                  <div className="notice">
                    <CheckCircle2
                      size={14}
                      style={{ display: "inline", marginRight: 7 }}
                    />
                    {message}
                  </div>
                )}

                <button
                  className="btn-primary"
                  type="submit"
                  style={{ width: "100%", marginTop: 10 }}
                >
                  Prepare account request
                  <ArrowRight size={14} style={{ marginLeft: 12 }} />
                </button>

                <p className="sub" style={{ marginTop: 22, marginBottom: 0 }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setMessage("");
                    }}
                    style={{
                      background: "none",
                      border: 0,
                      padding: 0,
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "var(--ink)",
                    }}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            <p
              style={{
                fontSize: 10,
                color: "var(--muted)",
                lineHeight: 1.7,
                marginTop: 28,
              }}
            >
              Identity, tenant access and account permissions are managed
              through ApexiveAI Community.
            </p>
          </div>
        </section>
      </div>

      <footer
        style={{
          padding: 22,
          textAlign: "center",
          fontSize: 10,
          color: "var(--muted)",
        }}
      >
        © 2026 ApexiveAI Marketplace
      </footer>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 60, textAlign: "center" }}>
          Loading account…
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}