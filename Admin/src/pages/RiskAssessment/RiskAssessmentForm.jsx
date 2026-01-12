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
  Badge,
  FormGroup
} from "reactstrap";
import { Link } from "react-router-dom";

const RiskAssessmentForm = () => {
  document.title = "Risk Assessment Form | HSE AgenticAI";

  const [aiPrompt, setAiPrompt] = useState("");
  const [sectorTemplate, setSectorTemplate] = useState("");

  const [formData, setFormData] = useState({
    documentNo: "ISG-FR-01",
    date: "2024-01-15",
    revision: "00",
    company: "TAAHHÜT SAN. TİC. A.Ş.",
    department: "Genel Şantiye Sahası",
    hazardClass: "Çok Tehlikeli"
  });

  const [signatures, setSignatures] = useState({
    employer: "",
    safetyExpert: "",
    doctor: "",
    representative: "",
    support: ""
  });

  // Initialize with 5 empty risks
  const initialRisks = Array(5).fill(null).map((_, index) => ({
    id: index + 1,
    hazardSource: "",
    riskEvent: "",
    o: "1",
    s: "1",
    r: "1",
    level: "DÜŞÜK",
    controls: "",
    responsible: "",
    deadline: ""
  }));

  const [pages, setPages] = useState([
    {
      id: 1,
      risks: initialRisks
    }
  ]);

  const getRiskColor = (level) => {
    if (level === "YÜKSEK") return "danger";
    if (level === "ORTA") return "warning";
    return "success";
  };

  const addNewPage = () => {
    const newPage = { 
      id: Date.now(), 
      risks: Array(5).fill(null).map((_, index) => ({
        id: Date.now() + index,
        hazardSource: "",
        riskEvent: "",
        o: "1",
        s: "1",
        r: "1",
        level: "DÜŞÜK",
        controls: "",
        responsible: "",
        deadline: ""
      }))
    };
    setPages([...pages, newPage]);
  };

  const addNewRisk = (pageId) => {
    const updatedPages = pages.map(page => {
      if (page.id === pageId) {
        const newRisk = {
          id: Date.now(),
          hazardSource: "",
          riskEvent: "",
          o: "1",
          s: "1",
          r: "1",
          level: "DÜŞÜK",
          controls: "",
          responsible: "",
          deadline: ""
        };
        return { ...page, risks: [...page.risks, newRisk] };
      }
      return page;
    });
    setPages(updatedPages);
  };

  const updateRisk = (pageId, riskId, field, value) => {
    const updatedPages = pages.map(page => {
      if (page.id === pageId) {
        const updatedRisks = page.risks.map(risk => {
          if (risk.id === riskId) {
            const updated = { ...risk, [field]: value };
            if (field === "o" || field === "s") {
              const o = field === "o" ? parseInt(value) : parseInt(risk.o);
              const s = field === "s" ? parseInt(value) : parseInt(risk.s);
              const r = o * s;
              updated.r = r.toString();
              if (r >= 1 && r <= 6) {
                updated.level = "DÜŞÜK";
              } else if (r >= 8 && r <= 12) {
                updated.level = "ORTA";
              } else {
                updated.level = "YÜKSEK";
              }
            }
            return updated;
          }
          return risk;
        });
        return { ...page, risks: updatedRisks };
      }
      return page;
    });
    setPages(updatedPages);
  };

  const generateWithAI = () => {
    alert("AI ile form oluşturuluyor...\nSektör: " + sectorTemplate + "\nTalimat: " + aiPrompt);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row className="mb-3">
            <Col lg={12}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">Risk Değerlendirme Formu</h4>
                </div>
                <div>
                  <Link to="/risk-assessment">
                    <Button color="secondary" className="me-2">
                      <i className="bx bx-arrow-back me-1"></i>
                      Geri
                    </Button>
                  </Link>
                  <Button color="success">
                    <i className="bx bx-save me-1"></i>
                    Kaydet
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {pages.map((page, pageIndex) => (
            <div key={page.id} className="mb-4">
              <Card>
                <CardBody>
                  {/* AI Generator - At top of each page */}
                  <div className="mb-3 p-3 bg-light border rounded">
                    <Row className="align-items-center">
                      <Col md={3}>
                        <Input type="select" size="sm" value={sectorTemplate} onChange={(e) => setSectorTemplate(e.target.value)}>
                          <option value="">Sektör Seçiniz</option>
                          <option value="insaat">İnşaat</option>
                          <option value="imalat">İmalat</option>
                          <option value="enerji">Enerji</option>
                          <option value="madencilik">Madencilik</option>
                        </Input>
                      </Col>
                      <Col md={7}>
                        <Input
                          type="text"
                          size="sm"
                          placeholder="Örn: Yüksekte çalışma risklerini ekle..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Button color="primary" size="sm" block onClick={generateWithAI}>
                          <i className="bx bx-brain me-1"></i>
                          AI
                        </Button>
                      </Col>
                    </Row>
                  </div>

                  {/* Compact Header */}
                  <Row className="mb-3">
                    <Col md={2} className="text-center">
                      <div className="border d-flex align-items-center justify-content-center" style={{ height: "60px", backgroundColor: "#f8f9fa" }}>
                        <span className="text-muted small">LOGO</span>
                      </div>
                    </Col>
                    <Col md={8} className="d-flex align-items-center justify-content-center">
                      <h5 className="mb-0 text-center">RİSK DEĞERLENDİRME FORMU</h5>
                    </Col>
                    <Col md={2}>
                      <table className="table table-bordered table-sm mb-0" style={{ fontSize: "0.75rem" }}>
                        <tbody>
                          <tr>
                            <td className="fw-bold p-1">Dok. No</td>
                            <td className="p-1"><Input type="text" bsSize="sm" value={formData.documentNo} onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })} style={{ fontSize: "0.75rem" }} /></td>
                          </tr>
                          <tr>
                            <td className="fw-bold p-1">Tarih</td>
                            <td className="p-1"><Input type="date" bsSize="sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ fontSize: "0.75rem" }} /></td>
                          </tr>
                          <tr>
                            <td className="fw-bold p-1">Rev.</td>
                            <td className="p-1"><Input type="text" bsSize="sm" value={formData.revision} onChange={(e) => setFormData({ ...formData, revision: e.target.value })} style={{ fontSize: "0.75rem" }} /></td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                  </Row>

                  {/* Compact Form Info */}
                  <Row className="mb-3">
                    <Col md={4}>
                      <FormGroup className="mb-2">
                        <Label className="fw-bold mb-1" style={{ fontSize: "0.85rem" }}>İşletme/Şirket Adı</Label>
                        <Input type="text" size="sm" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup className="mb-2">
                        <Label className="fw-bold mb-1" style={{ fontSize: "0.85rem" }}>Bölüm/Süreç/Faaliyet</Label>
                        <Input type="text" size="sm" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup className="mb-2">
                        <Label className="fw-bold mb-1" style={{ fontSize: "0.85rem" }}>Tehlike Sınıfı</Label>
                        <Input type="select" size="sm" value={formData.hazardClass} onChange={(e) => setFormData({ ...formData, hazardClass: e.target.value })}>
                          <option>Az Tehlikeli</option>
                          <option>Tehlikeli</option>
                          <option>Çok Tehlikeli</option>
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Risk Table */}
                  <div className="table-responsive mb-3">
                    <Table bordered hover size="sm" className="mb-0">
                      <thead className="table-light">
                        <tr style={{ fontSize: "0.85rem" }}>
                          <th style={{ width: "15%" }}>Tehlike Kaynağı</th>
                          <th style={{ width: "20%" }}>Risk</th>
                          <th style={{ width: "5%" }}>O</th>
                          <th style={{ width: "5%" }}>Ş</th>
                          <th style={{ width: "5%" }}>R</th>
                          <th style={{ width: "10%" }}>Risk Düzeyi</th>
                          <th style={{ width: "20%" }}>Alınacak Önlemler</th>
                          <th style={{ width: "10%" }}>Sorumlu</th>
                          <th style={{ width: "10%" }}>Termin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.risks.map((risk) => (
                          <tr key={risk.id}>
                            <td><Input type="textarea" rows="2" bsSize="sm" value={risk.hazardSource} onChange={(e) => updateRisk(page.id, risk.id, "hazardSource", e.target.value)} /></td>
                            <td><Input type="textarea" rows="2" bsSize="sm" value={risk.riskEvent} onChange={(e) => updateRisk(page.id, risk.id, "riskEvent", e.target.value)} /></td>
                            <td>
                              <Input type="select" bsSize="sm" value={risk.o} onChange={(e) => updateRisk(page.id, risk.id, "o", e.target.value)}>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                              </Input>
                            </td>
                            <td>
                              <Input type="select" bsSize="sm" value={risk.s} onChange={(e) => updateRisk(page.id, risk.id, "s", e.target.value)}>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                              </Input>
                            </td>
                            <td className="text-center align-middle"><strong>{risk.r}</strong></td>
                            <td className="text-center align-middle">
                              <Badge color={getRiskColor(risk.level)} className="w-100">{risk.level}</Badge>
                            </td>
                            <td><Input type="textarea" rows="2" bsSize="sm" value={risk.controls} onChange={(e) => updateRisk(page.id, risk.id, "controls", e.target.value)} /></td>
                            <td><Input type="text" bsSize="sm" value={risk.responsible} onChange={(e) => updateRisk(page.id, risk.id, "responsible", e.target.value)} /></td>
                            <td><Input type="date" bsSize="sm" value={risk.deadline} onChange={(e) => updateRisk(page.id, risk.id, "deadline", e.target.value)} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  <div className="mb-3">
                    <Button color="primary" size="sm" onClick={() => addNewRisk(page.id)}>
                      <i className="bx bx-plus me-1"></i>
                      Risk Satırı Ekle
                    </Button>
                  </div>

                  {/* Signature Section - On every page bottom */}
                  <div className="mt-4 pt-3 border-top">
                    <Row>
                      <Col>
                        <div className="text-center border p-2" style={{ minHeight: "80px" }}>
                          <div className="mb-2 text-muted small">İmza</div>
                          <div className="mt-auto">
                            <Label className="fw-bold mb-1" style={{ fontSize: "0.75rem" }}>İşveren / Vekili</Label>
                            <Input type="text" bsSize="sm" placeholder="Ad Soyad" value={signatures.employer} onChange={(e) => setSignatures({ ...signatures, employer: e.target.value })} />
                          </div>
                        </div>
                      </Col>
                      <Col>
                        <div className="text-center border p-2" style={{ minHeight: "80px" }}>
                          <div className="mb-2 text-muted small">İmza</div>
                          <div className="mt-auto">
                            <Label className="fw-bold mb-1" style={{ fontSize: "0.75rem" }}>İSG Uzmanı</Label>
                            <Input type="text" bsSize="sm" placeholder="Ad Soyad" value={signatures.safetyExpert} onChange={(e) => setSignatures({ ...signatures, safetyExpert: e.target.value })} />
                          </div>
                        </div>
                      </Col>
                      <Col>
                        <div className="text-center border p-2" style={{ minHeight: "80px" }}>
                          <div className="mb-2 text-muted small">İmza</div>
                          <div className="mt-auto">
                            <Label className="fw-bold mb-1" style={{ fontSize: "0.75rem" }}>İşyeri Hekimi</Label>
                            <Input type="text" bsSize="sm" placeholder="Ad Soyad" value={signatures.doctor} onChange={(e) => setSignatures({ ...signatures, doctor: e.target.value })} />
                          </div>
                        </div>
                      </Col>
                      <Col>
                        <div className="text-center border p-2" style={{ minHeight: "80px" }}>
                          <div className="mb-2 text-muted small">İmza</div>
                          <div className="mt-auto">
                            <Label className="fw-bold mb-1" style={{ fontSize: "0.75rem" }}>Çalışan Temsilcisi</Label>
                            <Input type="text" bsSize="sm" placeholder="Ad Soyad" value={signatures.representative} onChange={(e) => setSignatures({ ...signatures, representative: e.target.value })} />
                          </div>
                        </div>
                      </Col>
                      <Col>
                        <div className="text-center border p-2" style={{ minHeight: "80px" }}>
                          <div className="mb-2 text-muted small">İmza</div>
                          <div className="mt-auto">
                            <Label className="fw-bold mb-1" style={{ fontSize: "0.75rem" }}>Destek Elemanı</Label>
                            <Input type="text" bsSize="sm" placeholder="Ad Soyad" value={signatures.support} onChange={(e) => setSignatures({ ...signatures, support: e.target.value })} />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div className="text-center mt-2">
                    <small className="text-muted">Sayfa {pageIndex + 1} / {pages.length}</small>
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}

          <Row className="mb-4">
            <Col lg={12} className="text-center">
              <Button color="success" size="lg" onClick={addNewPage}>
                <i className="bx bx-plus-circle me-2"></i>
                Yeni Sayfa Ekle
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default RiskAssessmentForm;
// Force update
