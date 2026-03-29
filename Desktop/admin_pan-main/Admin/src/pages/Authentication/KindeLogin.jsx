import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useNavigate } from "react-router-dom";

const KindeLogin = () => {
  const { login, register, isAuthenticated, isLoading } = useKindeAuth();
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>IW</span>
          </div>
          <span style={styles.brandName}>Infera World</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.formContainer}>
          <h1 style={styles.heading}>
            {isRegisterMode ? "Hesap Oluştur" : "Hoş Geldiniz"}
          </h1>
          <p style={styles.description}>
            {isRegisterMode 
              ? "İSG Admin Paneline katılın ve güvenli çalışma ortamınızı yönetin."
              : "İSG Admin Paneline giriş yapın ve güvenlik yönetiminize devam edin."}
          </p>

          <div style={styles.buttonGroup}>
            <button
              style={{
                ...styles.primaryButton,
                ...(isRegisterMode ? styles.secondaryButton : {}),
              }}
              onClick={() => {
                if (isRegisterMode) {
                  register();
                } else {
                  login();
                }
              }}
              onMouseEnter={(e) => {
                if (!isRegisterMode) {
                  e.currentTarget.style.background = "linear-gradient(135deg, #5a54d8 0%, #6b46c1 100%)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isRegisterMode) {
                  e.currentTarget.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                }
              }}
            >
              <i className={`mdi ${isRegisterMode ? 'mdi-account-plus' : 'mdi-login'} me-2`}></i>
              {isRegisterMode ? "Kayıt Ol" : "Giriş Yap"}
            </button>

            <div style={styles.divider}>
              <span style={styles.dividerText}>veya</span>
            </div>

            <button
              style={styles.linkButton}
              onClick={() => setIsRegisterMode(!isRegisterMode)}
            >
              {isRegisterMode 
                ? "Zaten hesabınız var mı? Giriş yapın" 
                : "Hesabınız yok mu? Kayıt olun"}
            </button>
          </div>

          {/* Features */}
          <div style={styles.features}>
            <div style={styles.feature}>
              <i className="mdi mdi-shield-check" style={styles.featureIcon}></i>
              <span style={styles.featureText}>Güvenli Giriş</span>
            </div>
            <div style={styles.feature}>
              <i className="mdi mdi-clock-fast" style={styles.featureIcon}></i>
              <span style={styles.featureText}>Hızlı Erişim</span>
            </div>
            <div style={styles.feature}>
              <i className="mdi mdi-lock" style={styles.featureIcon}></i>
              <span style={styles.featureText}>Veri Koruması</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <a href="#" style={styles.footerLink}>Kullanım Koşulları</a>
          <span style={styles.footerDivider}>•</span>
          <a href="#" style={styles.footerLink}>Gizlilik Politikası</a>
          <span style={styles.footerDivider}>•</span>
          <a href="#" style={styles.footerLink}>Destek</a>
        </div>
        <p style={styles.copyright}>
          © {new Date().getFullYear()} Infera World. Powered by Kinde.
        </p>
      </footer>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    position: "relative",
    overflow: "hidden",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "white",
    marginTop: "20px",
    fontSize: "16px",
  },
  header: {
    padding: "30px 40px",
    zIndex: 10,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  logoCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(255, 255, 255, 0.3)",
  },
  logoText: {
    color: "white",
    fontSize: "20px",
    fontWeight: "700",
  },
  brandName: {
    color: "white",
    fontSize: "24px",
    fontWeight: "600",
    letterSpacing: "-0.5px",
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  formContainer: {
    width: "100%",
    maxWidth: "480px",
    background: "white",
    borderRadius: "24px",
    padding: "48px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  heading: {
    fontSize: "32px",
    fontWeight: "600",
    color: "#1a1d29",
    marginBottom: "12px",
    textAlign: "center",
    letterSpacing: "-0.5px",
  },
  description: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "40px",
    textAlign: "center",
    lineHeight: "1.6",
  },
  buttonGroup: {
    marginBottom: "32px",
  },
  primaryButton: {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
  },
  secondaryButton: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    boxShadow: "0 4px 12px rgba(240, 147, 251, 0.4)",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    margin: "24px 0",
  },
  dividerText: {
    width: "100%",
    color: "#9ca3af",
    fontSize: "14px",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "1px",
      background: "#e5e7eb",
    },
  },
  linkButton: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#667eea",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginTop: "32px",
    paddingTop: "32px",
    borderTop: "1px solid #e5e7eb",
  },
  feature: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  featureIcon: {
    fontSize: "24px",
    color: "#667eea",
  },
  featureText: {
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center",
  },
  footer: {
    padding: "30px 40px",
    textAlign: "center",
    zIndex: 10,
  },
  footerLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  footerLink: {
    color: "rgba(255, 255, 255, 0.9)",
    textDecoration: "none",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  footerDivider: {
    color: "rgba(255, 255, 255, 0.5)",
  },
  copyright: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "14px",
    margin: 0,
  },
};

export default KindeLogin;
