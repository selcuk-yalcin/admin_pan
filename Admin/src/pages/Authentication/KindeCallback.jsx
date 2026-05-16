import React, { useEffect } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useNavigate } from "react-router-dom";
import { Container } from "reactstrap";
import { APP_HOME_PATH } from "../../config/appHome";

const KindeCallback = () => {
  const { isAuthenticated, isLoading, user } = useKindeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Kullanıcı bilgilerini localStorage'a kaydet
      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user));
      }
      navigate(APP_HOME_PATH, { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="account-pages my-5 pt-sm-5">
      <Container>
        <div className="text-center">
          <div className="mb-4">
            <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="sr-only">Yükleniyor...</span>
            </div>
          </div>
          <h5 className="mb-3">Giriş yapılıyor...</h5>
          <p className="text-muted">Lütfen bekleyin, hesabınız doğrulanıyor.</p>
        </div>
      </Container>
    </div>
  );
};

export default KindeCallback;
