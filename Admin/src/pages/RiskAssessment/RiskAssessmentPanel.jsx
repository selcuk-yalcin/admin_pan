import React, { useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Button } from "reactstrap";
import { Link } from "react-router-dom";

const RiskAssessmentPanel = () => {
  document.title = "Risk Assessment | HSE AgenticAI";

  const [assessments] = useState([
    {
      id: 1,
      documentNo: "ISG-FR-01",
      company: "TAAHHÜT SAN. TİC. A.Ş.",
      department: "Genel Şantiye Sahası",
      date: "15.01.2024",
      revision: "00",
      page: "1 / 8",
      status: "Active"
    },
    {
      id: 2,
      documentNo: "ISG-FR-02",
      company: "ABC İNŞAAT A.Ş.",
      department: "Üretim Sahası",
      date: "20.01.2024",
      revision: "01",
      page: "1 / 5",
      status: "Active"
    }
  ]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Breadcrumb */}
          <div className="page-title-box">
            <Row className="align-items-center">
              <Col md={8}>
                <h6 className="page-title">Risk Assessment Forms</h6>
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item">
                    <Link to="/dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Risk Assessment</li>
                </ol>
              </Col>
              <Col md={4} className="text-end">
                <Link to="/risk-assessment-form">
                  <Button color="primary" className="btn-rounded">
                    <i className="mdi mdi-plus me-1"></i> New Assessment
                  </Button>
                </Link>
              </Col>
            </Row>
          </div>

          {/* Assessment Cards */}
          <Row>
            {assessments.map((assessment) => (
              <Col xl={6} key={assessment.id}>
                <Card>
                  <CardBody>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <CardTitle className="h4 mb-0">
                        {assessment.documentNo}
                      </CardTitle>
                      <span className="badge bg-success">{assessment.status}</span>
                    </div>
                    
                    <div className="table-responsive">
                      <table className="table table-sm table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td className="fw-medium" width="40%">Company:</td>
                            <td>{assessment.company}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Department:</td>
                            <td>{assessment.department}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Date:</td>
                            <td>{assessment.date}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Revision:</td>
                            <td>{assessment.revision}</td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Pages:</td>
                            <td>{assessment.page}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 d-flex gap-2">
                      <Link to={`/risk-assessment-form/${assessment.id}`} className="btn btn-primary btn-sm">
                        <i className="mdi mdi-eye me-1"></i> View
                      </Link>
                      <Link to={`/risk-assessment-form/${assessment.id}`} className="btn btn-info btn-sm">
                        <i className="mdi mdi-pencil me-1"></i> Edit
                      </Link>
                      <Button color="danger" size="sm" outline>
                        <i className="mdi mdi-delete me-1"></i> Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default RiskAssessmentPanel;
