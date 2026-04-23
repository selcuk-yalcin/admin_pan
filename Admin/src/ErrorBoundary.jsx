import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            maxWidth: 640,
            margin: "48px auto",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Panel yüklenemedi</h1>
          <p style={{ color: "#444", marginBottom: 16 }}>
            Tarayıcı konsolundaki hata ile birlikte destek ekibine bildirin (Safari Gizli Gezinme veya çerez
            engeli bazen oturum depolamasını kapatır).
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              background: "#f6f6f6",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {msg}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
