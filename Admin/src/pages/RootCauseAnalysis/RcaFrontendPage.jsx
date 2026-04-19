import React from "react";
import RcaFrontendHub from "../../rca-frontend/RcaFrontendHub";

const RcaFrontendPage = () => {
  document.title = "Kök Neden Araçları | Infera";

  return (
    <div className="page-content rca-tools-page">
      <RcaFrontendHub />
    </div>
  );
};

export default RcaFrontendPage;
