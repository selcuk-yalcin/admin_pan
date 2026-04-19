import React from "react";
import { Container } from "reactstrap";
import RcaFrontendHub from "../../rca-frontend/RcaFrontendHub";

const RcaFrontendPage = () => {
  document.title = "Kök Neden Araçları | Infera";

  return (
    <div className="page-content">
      <Container fluid className="p-0">
        <RcaFrontendHub />
      </Container>
    </div>
  );
};

export default RcaFrontendPage;
