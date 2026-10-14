import { createRoot } from "react-dom/client";
import { Component, ErrorInfo, ReactNode } from "react";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource-variable/inter";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
// No localStorage sync needed - all services read/write directly from Supabase

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW(true);
  },
  onOfflineReady() {
    console.info("Serenades PWA is ready for offline use.");
  },
});

if (typeof window !== "undefined") {
  let hasReloadedForUpdate = false;

  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (hasReloadedForUpdate) return;
    hasReloadedForUpdate = true;
    window.location.reload();
  });

  const refreshServiceWorker = () => {
    void updateSW();
  };

  window.addEventListener("focus", refreshServiceWorker);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshServiceWorker();
    }
  });

  window.setInterval(refreshServiceWorker, 60 * 1000);
}

// Error Boundary to catch rendering errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0b09",
          color: "#fff",
          padding: "20px",
          textAlign: "center"
        }}>
          <h1 style={{ color: "#C8A96A", marginBottom: "16px" }}>Something went wrong</h1>
          <p style={{ color: "#888", marginBottom: "16px", maxWidth: "500px" }}>
            An error occurred while rendering this page.
          </p>
          <pre style={{
            background: "#1a1a1a",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "12px",
            maxWidth: "90%",
            overflow: "auto",
            color: "#ff6b6b",
            marginBottom: "16px"
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#C8A96A",
              color: "#000",
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
