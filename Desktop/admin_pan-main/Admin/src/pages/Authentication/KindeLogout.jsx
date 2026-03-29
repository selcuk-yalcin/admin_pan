import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const KINDE_DOMAIN = import.meta.env.VITE_KINDE_DOMAIN || "https://inferaworld.kinde.com";

const KindeLogout = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(2);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // İlk render'da storage'ı temizle
    localStorage.clear();
    sessionStorage.clear();

    // Geri sayım
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !showSuccess) {
      // Başarı mesajını göster
      setShowSuccess(true);
      
      // 1 saniye sonra Kinde oturumunu kapat ve login sayfasına yönlendir
      setTimeout(() => {
        // Kinde'nin logout endpoint'ini doğrudan kullan
        // redirect parametresi ile login sayfamıza dönmesini sağla
        const loginUrl = window.location.origin + "/login";
        const logoutUrl = `${KINDE_DOMAIN}/logout?redirect=${encodeURIComponent(loginUrl)}`;
        window.location.href = logoutUrl;
      }, 1000);
    }
  }, [countdown, showSuccess]);

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
            {showSuccess ? "✓ Başarılı!" : "Çıkış Yapılıyor"}
          </h1>
          <p style={styles.description}>
            {showSuccess 
              ? "Oturumunuz güvenli şekilde sonlandırıldı. Yönlendiriliyorsunuz..."
              : `Güvenli çıkış işleminiz ${countdown} saniye içinde tamamlanacak...`
            }
          </p>

          {/* Loading Animation */}
          <div style={styles.loadingContainer}>
            {!showSuccess ? (
              <>
                <div style={styles.spinner}></div>
                <div style={styles.countdownNumber}>{countdown}</div>
              </>
            ) : (
              <div style={styles.successIcon}>✓</div>
            )}
          </div>

          <div style={{...styles.featureBox, background: showSuccess ? '#d4edda' : '#f8f9fa'}}>
            <div style={styles.featureItem}>
              <div style={{...styles.iconCircle, background: showSuccess ? '#28a745' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                <span style={styles.checkIcon}>✓</span>
              </div>
              <span style={styles.featureText}>
                {showSuccess ? "Oturumunuz Sonlandırıldı" : "Oturumunuz Güvenli Şekilde Sonlandırılıyor"}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2026 Infera World. Powered by Kinde.
        </p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "2rem 3rem",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logoCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  brandName: {
    fontSize: "24px",
    fontWeight: "600",
    color: "white",
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  formContainer: {
    background: "white",
    borderRadius: "24px",
    padding: "3rem",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  heading: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: "0.5rem",
    textAlign: "center",
  },
  description: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "2rem",
    textAlign: "center",
    lineHeight: "1.6",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem 0",
    position: "relative",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  countdownNumber: {
    position: "absolute",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#667eea",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#28a745",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    color: "white",
    animation: "scaleIn 0.3s ease-out",
  },
  featureBox: {
    marginTop: "2rem",
    padding: "1.5rem",
    background: "#f8f9fa",
    borderRadius: "16px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  iconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkIcon: {
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
  },
  featureText: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  },
  footer: {
    padding: "2rem",
    textAlign: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "14px",
  },
};

// CSS Animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes scaleIn {
    0% { 
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% { 
      transform: scale(1);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default KindeLogout;
