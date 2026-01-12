import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Input,
  Label,
  Table,
  Badge
} from "reactstrap";
import { Link } from "react-router-dom";

const RiskAssessmentForm = () => {
  document.title = "Risk Assessment Form | HSE AgenticAI";

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(8);

  const [formData, setFormData] = useState({
    documentNo: "ISG-FR-01",
    date: "15.01.2024",
    revision: "00",
    company: "TAAHHÜT SAN. TİC. A.Ş.",
    department: "Genel Şantiye Sahası",
    hazardClass: "Çok Tehlikeli",
    analyst: "İşveren Vekili, İSG Uzmanı, İşyeri Hekimi, Çalışan Temsilcisi",
    approver: "Proje Müdürü"
  });

  const [risks, setRisks] = useState([
    {
      id: 1,
      hazardSource: "Pano Bakımı",
      riskEvent: "Elektrik çarpması",
      o: 2,
      s: 5,
      r: 10,
      level: "ORTA",
      controls: "LOTO (Etiketle-Kilitle) sistemi uygulanacak.",
      responsible: "Tekniker",
      deadline: "11/01/2026"
    },
    {
      id: 2,
      hazardSource: "Kablolama",
      riskEvent: "İzolasyon hatası, yangın",
      o: 2,
      s: 4,
      r: 8,
      level: "ORTA",
      controls: "Kaçak akım rölesi (30mA) kontrolü.",
      responsible: "Elektrikçi",
      deadline: "11/01/2026"
    },
    {
      id: 3,
      hazardSource: "Ekranlı Araçlar",
      riskEvent: "Göz yorgunluğu",
      o: 4,
      s: 1,
      r: 4,
      level: "DÜŞÜK",
      controls: "Ergonomik düzenleme, dinlenme molaları.",
      responsible: "İdari İşler",
      deadline: "11/01/2026"
    },
    {
      id: 4,
      hazardSource: "Zemin",
      riskEvent: "Kayma ve düşme",
      o: 3,
      s: 2,
      r: 6,
      level: "DÜŞÜK",
      controls: "Kaymaz paspas, uyarı levhaları.",
      responsible: "Temizlik",
      deadline: "11/01/2026"
    },
    {
      id: 5,
      hazardSource: "Pano Bakımı",
      riskEvent: "Elektrik çarpması",
      o: 3,
      s: 5,
      r: 15,
      level: "YÜKSEK",
      controls: "LOTO (Etiketle-Kilitle) sistemi uygulanacak.",
      responsible: "Tekniker",
      deadline: "11/01/2026"
    },
    {
      id: 6,
      hazardSource: "Kablolama",
      riskEvent: "İzolasyon hatası, yangın",
      o: 2,
      s: 4,
      r: 8,
      level: "ORTA",
      controls: "Kaçak akım rölesi (30mA) kontrolü.",
      responsible: "Elektrikçi",
      deadline: "11/01/2026"
    },
    {
      id: 7,
      hazardSource: "Yüksekte Çalışma",
      riskEvent: "Düşme, ölümcül yaralanma",
      o: 4,
      s: 5,
      r: 20,
      level: "YÜKSEK",
      controls: "Paraşüt tipi emniyet kemeri, yaşam hattı, korkuluk.",
      responsible: "Saha Şefi",
      deadline: "11/01/2026"
    },
    {
      id: 8,
      hazardSource: "Kazı İşleri",
      riskEvent: "Toprak kayması, göçük",
      o: 3,
      s: 5,
      r: 15,
      level: "YÜKSEK",
      controls: "İksa sistemleri, şevlendirme (45 derece).",
      responsible: "Mühendis",
      deadline: "11/01/2026"
    }
  ]);

  const getRiskColor = (level) => {
    switch (level) {
      case "YÜKSEK":
        return "danger";
      case "ORTA":
        return "warning";
      case "DÜŞÜK":
        return "success";
      default:
        return "secondary";
    }
  };

  const addNewPage = () => {
    setCurrentPage(currentPage + 1);
    // Yeni sayfa için boş risk satırları eklenebilir
  };

  const addNewRisk = () => {
    const newRisk = {
      id: risks.length + 1,
      hazardSource: "",
      riskEvent: "",
      o: 0,
      s: 0,
      r: 0,
      level: "",
      controls: "",
      responsible: "",
      deadline: ""
    };
    setRisks([...risks, newRisk]);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Breadcrumb */}
          <div className="page-title-box">
            <Row className="align-items-center">
              <Col md={8}>
                <h6 className="page-title">Risk Assessment Form</h6>
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item">
                    <Link to="/dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/risk-assessment">Risk Assessment</Link>
                  </li>
                  <li className="breadcrumb-item active">Form</li>
                </ol>
              </Col>
              <Col md={4} className="text-end">
                <Button color="success" className="me-2">
                  <i className="mdi mdi-content-save me-1"></i> Save
                </Button>
                <Button color="primary">
                  <i className="mdi mdi-download me-1"></i> Export PDF
                </Button>
              </Col>
            </Row>
          </div>

          <Card>
            <CardBody>
              {/* Header Section */}
              <div className="border p-3 mb-4">
                <Row>
                  <Col md={3}>
                    <div className="border-end pe-3">
                      <h5 className="text-center">Firma Logosu</h5>
                      <div style={{ height: "100px", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="mdi mdi-image" style={{ fontSize: "48px", color: "#ccc" }}></i>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="text-center">
                      <h3 className="mb-2">RİSK DEĞERLENDİRME FORMU</h3>
                      <p className="text-muted mb-0">İŞ SAĞLIĞI VE GÜVENLİĞİ RİSK ANALİZİ (5X5 MATRİSİ)</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <Table bordered size="sm" className="mb-0">
                      <tbody>
                        <tr>
                          <td className="fw-bold" style={{ width: "45%" }}>DOKÜMAN NO</td>
                          <td>{formData.documentNo}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">YAYIN TARİHİ</td>
                          <td>{formData.date}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">REVİZYON NO</td>
                          <td>{formData.revision}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">SAYFA NO</td>
                          <td>{currentPage} / {totalPages}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </div>

              {/* Form Info Section */}
              <Row className="mb-4">
                <Col md={4}>
                  <Label className="fw-bold">İŞYERİ UNVANI</Label>
                  <Input type="text" value={formData.company} readOnly />
                </Col>
                <Col md={4}>
                  <Label className="fw-bold">BÖLÜM / SAHA</Label>
                  <Input type="text" value={formData.department} readOnly />
                </Col>
                <Col md={2}>
                  <Label className="fw-bold">TEHLİKE SINIFI</Label>
                  <Input type="select" value={formData.hazardClass}>
                    <option>Çok Tehlikeli</option>
                    <option>Tehlikeli</option>
                    <option>Az Tehlikeli</option>
                  </Input>
                </Col>
                <Col md={2}>
                  <Label className="fw-bold">ANALİZ TARİHİ</Label>
                  <Input type="text" value="11/01/2026" readOnly />
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={8}>
                  <Label className="fw-bold">DEĞERLENDİRME EKİBİ:</Label>
                  <Input type="text" value={formData.analyst} readOnly />
                </Col>
                <Col md={4}>
                  <Label className="fw-bold">ONAYLAYAN:</Label>
                  <Input type="text" value={formData.approver} readOnly />
                </Col>
              </Row>

              {/* Risk Table */}
              <div className="table-responsive">
                <Table bordered hover className="table-sm">
                  <thead className="table-light">
                    <tr className="text-center">
                      <th style={{ width: "3%" }}>NO</th>
                      <th style={{ width: "12%" }}>TEHLİKE KAYNAĞI</th>
                      <th style={{ width: "15%" }}>RİSK VE OLASI SONUÇLAR</th>
                      <th style={{ width: "4%" }}>O</th>
                      <th style={{ width: "4%" }}>Ş</th>
                      <th style={{ width: "4%" }}>R</th>
                      <th style={{ width: "8%" }}>RİSK SEVİYESİ</th>
                      <th style={{ width: "25%" }}>DÜZELTİCİ VE ÖNLEYİCİ FAALİYETLER (DÖF)</th>
                      <th style={{ width: "10%" }}>SORUMLU</th>
                      <th style={{ width: "10%" }}>TERMİN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((risk, index) => (
                      <tr key={risk.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>{risk.hazardSource}</td>
                        <td>{risk.riskEvent}</td>
                        <td className="text-center fw-bold">{risk.o}</td>
                        <td className="text-center fw-bold">{risk.s}</td>
                        <td className="text-center fw-bold">{risk.r}</td>
                        <td className="text-center">
                          <Badge color={getRiskColor(risk.level)} className="w-100">
                            {risk.level}
                          </Badge>
                        </td>
                        <td>{risk.controls}</td>
                        <td>{risk.responsible}</td>
                        <td className="text-center">{risk.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Signature Section */}
              <Row className="mt-4 border-top pt-3">
                <Col md={2} className="text-center">
                  <div className="border-end">
                    <p className="fw-bold mb-2">İŞVEREN / VEKİLİ</p>
                    <div style={{ height: "60px" }}></div>
                    <p className="small text-muted">İmza</p>
                  </div>
                </Col>
                <Col md={2} className="text-center">
                  <div className="border-end">
                    <p className="fw-bold mb-2">İŞ GÜVENLİĞİ UZMANI</p>
                    <div style={{ height: "60px" }}></div>
                    <p className="small text-muted">İmza</p>
                  </div>
                </Col>
                <Col md={2} className="text-center">
                  <div className="border-end">
                    <p className="fw-bold mb-2">İŞYERİ HEKİMİ</p>
                    <div style={{ height: "60px" }}></div>
                    <p className="small text-muted">İmza</p>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="border-end">
                    <p className="fw-bold mb-2">ÇALIŞAN TEMSİLCİSİ</p>
                    <div style={{ height: "60px" }}></div>
                    <p className="small text-muted">İmza</p>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <p className="fw-bold mb-2">DESTEK ELEMANI</p>
                  <div style={{ height: "60px" }}></div>
                  <p className="small text-muted">İmza</p>
                </Col>
              </Row>

              {/* Action Buttons */}
              <div className="mt-4 d-flex justify-content-between">
                <div>
                  <Button color="info" outline onClick={addNewRisk}>
                    <i className="mdi mdi-plus me-1"></i> Add Risk Row
                  </Button>
                </div>
                <div>
                  <Button color="secondary" outline className="me-2" onClick={addNewPage}>
                    <i className="mdi mdi-plus-circle me-1"></i> Add Page
                  </Button>
                  <span className="text-muted">Page {currentPage} of {totalPages}</span>
                  <Button color="secondary" outline className="ms-2" disabled={currentPage === 1}>
                    <i className="mdi mdi-chevron-left"></i>
                  </Button>
                  <Button color="secondary" outline className="ms-1" disabled={currentPage === totalPages}>
                    <i className="mdi mdi-chevron-right"></i>
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default RiskAssessmentForm;
