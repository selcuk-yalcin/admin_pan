import React, { useState } from "react"
import {
  Card,
  CardBody,
  Col,
  Container,
  Form,
  Input,
  Label,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
  Button,
  Table,
  Spinner,
  Alert,
  Badge
} from "reactstrap"
import classnames from "classnames"

const HSG245WizardAI = () => {
  document.title = "HSG245 Smart Report | Agentic AI Integration";

  const [activeTab, setactiveTab] = useState(1)
  const [passedSteps, setPassedSteps] = useState([1])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // --- 1. CENTRAL FORM STATE ---
  const [formData, setFormData] = useState({
    // --- Part 1: Overview ---
    reportedBy: "",
    dateTime: "",
    eventCategory: "Incident", // Default for Dropdown
    briefDetails: "",
    forwardedTo: "",
    reportDate: "",
    reportTime: "",

    // --- Part 2: Assessment ---
    eventType: "Accident", // Default for Dropdown
    harmPotential: "Minor", // Default for Dropdown
    riddorReportable: "No",
    entryInAccidentBook: "Yes",
    investigationLevel: "Basic", // Default for Dropdown

    // --- Part 3: Info Gathering (Inputs for AI) ---
    location: "",
    injuredPerson: "",
    description: "", // CRITICAL: This is the main prompt for the AI
    activities: "",
    unusualConditions: "",
    proceduresFollowed: "",
    injuryDetails: "",

    // --- Part 4: Risk Control (Outputs from AI) ---
    immediateCauses: "",
    underlyingCauses: "",
    rootCauses: "",
    actionPlan: [
        { measure: "", date: "", person: "" },
        { measure: "", date: "", person: "" },
        { measure: "", date: "", person: "" }
    ]
  })

  // --- 2. HANDLERS ---

  // Handle Text/Select Changes
  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Handle Action Plan Table Changes (Dynamic Table)
  const handleActionPlanChange = (index, field, value) => {
      const updatedPlan = [...formData.actionPlan];
      updatedPlan[index][field] = value;
      setFormData(prev => ({ ...prev, actionPlan: updatedPlan }));
  }

  // Handle Tab Navigation
  function toggleTab(tab) {
    if (activeTab !== tab) {
      var modifiedSteps = [...passedSteps, tab]
      if (tab >= 1 && tab <= 4) {
        setactiveTab(tab)
        setPassedSteps(modifiedSteps)
      }
    }
  }

  // --- 3. AGENTIC AI INTEGRATION ---
  const handleAIAnalysis = async () => {
    // A. Validation: Ensure user entered a description
    if (!formData.description) {
        alert("Please provide a detailed description in 'Part 3' before analyzing.");
        return;
    }

    setIsAnalyzing(true);

    try {
        // B. API Configuration (CHANGE THIS URL)
        const API_URL = "https://api.your-backend-domain.com/analyze-accident"; 
        
        // C. Send Data to Backend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_TOKEN' // Uncomment if needed
            },
            body: JSON.stringify({
                // The Prompt inputs for the LLM/Agent
                incident_description: formData.description,
                incident_location: formData.location,
                injury_details: formData.injuryDetails,
                // Context for better accuracy
                meta_data: {
                    event_type: formData.eventType,
                    harm_potential: formData.harmPotential
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Connection Error: ${response.statusText}`);
        }

        const data = await response.json();

        // D. Map API Response to Form State
        // Expected JSON structure from backend: 
        // { immediate_causes: "...", root_causes: "...", recommended_actions: [{measure, date, person}] }
        setFormData(prev => ({
            ...prev,
            immediateCauses: data.immediate_causes || "Analysis could not determine immediate causes.",
            underlyingCauses: data.underlying_causes || "",
            rootCauses: data.root_causes || "Analysis could not determine root causes.",
            actionPlan: data.recommended_actions && data.recommended_actions.length > 0 
                ? data.recommended_actions 
                : prev.actionPlan
        }));

        // E. Success: Move to Part 4
        toggleTab(4);

    } catch (error) {
        console.error("Agentic AI Failed:", error);
        alert("Failed to generate analysis. Please check your backend connection or try again later.\n\nDetails: " + error.message);
    } finally {
        setIsAnalyzing(false);
    }
  }

  // --- 4. RENDER ---
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid={true}>
          <Row>
            <Col lg="12">
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="card-title mb-0">Adverse event report (HSG245)</h4>
                    <Badge color="primary" pill className="px-3 py-2">
                        <i className="bx bx-brain me-1"></i> AI Powered
                    </Badge>
                  </div>
                  
                  <div className="wizard clearfix">
                    
                    {/* --- WIZARD NAVIGATION HEADERS --- */}
                    <div className="steps clearfix">
                      <ul>
                        <NavItem className={classnames({ current: activeTab === 1 })}>
                          <NavLink onClick={() => { setactiveTab(1) }}>
                            <span className="number">1.</span> Part 1: Overview
                          </NavLink>
                        </NavItem>
                        <NavItem className={classnames({ current: activeTab === 2 })}>
                          <NavLink onClick={() => { setactiveTab(2) }}>
                            <span className="number">2.</span> Part 2: Assessment
                          </NavLink>
                        </NavItem>
                        <NavItem className={classnames({ current: activeTab === 3 })}>
                          <NavLink onClick={() => { setactiveTab(3) }}>
                            <span className="number">3.</span> Part 3: Info Gathering
                          </NavLink>
                        </NavItem>
                        <NavItem className={classnames({ current: activeTab === 4 })}>
                          <NavLink onClick={() => { setactiveTab(4) }}>
                            <span className="number">4.</span> Part 4: Risk Control
                          </NavLink>
                        </NavItem>
                      </ul>
                    </div>

                    <div className="content clearfix">
                      <TabContent activeTab={activeTab} className="body">
                        
                        {/* ==================================================
                            TAB 1: PART 1 OVERVIEW
                           ================================================== */}
                        <TabPane tabId={1}>
                          <Form>
                            <Row className="mb-3">
                              <Col lg="6">
                                <Label className="fw-bold">Reported by:</Label>
                                <Input type="text" name="reportedBy" className="form-control" onChange={handleInputChange} />
                              </Col>
                              <Col lg="6">
                                <Label className="fw-bold">Date/time of adverse event:</Label>
                                <Input type="datetime-local" name="dateTime" className="form-control" onChange={handleInputChange} />
                              </Col>
                            </Row>

                            [cite_start]{/* DROPDOWN: Event Category [cite: 16-19] */}
                            <Row className="mb-3">
                                <Col lg="12">
                                    <Label className="fw-bold">Event Category</Label>
                                    <Input 
                                        type="select" 
                                        name="eventCategory" 
                                        className="form-select" 
                                        value={formData.eventCategory}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Incident">Incident (Near-miss / Undesired circumstance)</option>
                                        <option value="Ill health">Ill health</option>
                                        <option value="Minor injury">Minor injury</option>
                                        <option value="Serious injury">Serious injury</option>
                                        <option value="Major injury">Major injury</option>
                                    </Input>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col lg="12">
                                    <Label className="fw-bold">Brief details (What, where, when, who and emergency measures taken)</Label>
                                    <Input 
                                        type="textarea" 
                                        rows="6" 
                                        name="briefDetails" 
                                        className="form-control" 
                                        style={{ resize: 'none' }} 
                                        onChange={handleInputChange} 
                                    />
                                </Col>
                            </Row>

                            <Row>
                                <Col lg="6"><Label>Forwarded to:</Label><Input type="text" name="forwardedTo" className="form-control" onChange={handleInputChange} /></Col>
                                <Col lg="3"><Label>Date</Label><Input type="date" name="reportDate" className="form-control" onChange={handleInputChange} /></Col>
                                <Col lg="3"><Label>Time</Label><Input type="time" name="reportTime" className="form-control" onChange={handleInputChange} /></Col>
                            </Row>
                          </Form>
                        </TabPane>

                        {/* ==================================================
                            TAB 2: PART 2 INITIAL ASSESSMENT
                           ================================================== */}
                        <TabPane tabId={2}>
                          <Form>
                            [cite_start]{/* Main Assessment Dropdowns [cite: 26-33] */}
                            <Row className="mb-4">
                                <Col lg="6">
                                    <div className="mb-3">
                                        <Label className="fw-bold">Type of event</Label>
                                        <Input 
                                            type="select" 
                                            name="eventType" 
                                            className="form-select" 
                                            value={formData.eventType}
                                            onChange={handleInputChange}
                                        >
                                            <option value="Accident">Accident</option>
                                            <option value="Ill health">Ill health</option>
                                            <option value="Near-miss">Near-miss</option>
                                            <option value="Undesired circumstance">Undesired circumstance</option>
                                        </Input>
                                    </div>
                                </Col>
                                <Col lg="6">
                                    <div className="mb-3">
                                        <Label className="fw-bold">Actual/potential for harm</Label>
                                        <Input 
                                            type="select" 
                                            name="harmPotential" 
                                            className="form-select" 
                                            value={formData.harmPotential}
                                            onChange={handleInputChange}
                                        >
                                            <option value="Minor">Minor</option>
                                            <option value="Serious">Serious</option>
                                            <option value="Fatal or major">Fatal or major</option>
                                            <option value="Damage only">Damage only</option>
                                        </Input>
                                    </div>
                                </Col>
                            </Row>

                            [cite_start]{/* RIDDOR & Accident Book Dropdowns [cite: 34-37] */}
                            <Row className="mb-4">
                                <Col lg="6">
                                    <div className="border p-3 rounded bg-light h-100">
                                        <Row>
                                            <Col lg="12" className="mb-2">
                                                <Label className="fw-bold">RIDDOR reportable?</Label>
                                                <Input 
                                                    type="select" 
                                                    name="riddorReportable" 
                                                    className="form-select"
                                                    value={formData.riddorReportable}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </Input>
                                            </Col>
                                            <Col lg="12">
                                                <Label>Date/time reported</Label>
                                                <Input type="datetime-local" className="form-control" />
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                                <Col lg="6">
                                    <div className="border p-3 rounded bg-light h-100">
                                        <Row>
                                            <Col lg="12" className="mb-2">
                                                <Label className="fw-bold">Entry in accident book</Label>
                                                <Input 
                                                    type="select" 
                                                    name="entryInAccidentBook" 
                                                    className="form-select"
                                                    value={formData.entryInAccidentBook}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="Yes">Yes</option>
                                                    <option value="No">No</option>
                                                </Input>
                                            </Col>
                                            <Col lg="12">
                                                <Label>Reference Number</Label>
                                                <Input type="text" className="form-control" placeholder="e.g. 123/03" />
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>

                            [cite_start]{/* Investigation Level Dropdown [cite: 38-40] */}
                            <Row>
                                <Col lg="12">
                                    <Label className="fw-bold text-primary">Investigation level</Label>
                                    <Alert color="light" className="border">
                                        <div className="d-flex align-items-center">
                                            <i className="bx bx-search-alt-2 fs-4 me-3 text-primary"></i>
                                            <div className="flex-grow-1">
                                                <Input 
                                                    type="select" 
                                                    name="investigationLevel" 
                                                    className="form-select fw-bold"
                                                    value={formData.investigationLevel}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="Basic">Basic (Minor injury/damage)</option>
                                                    <option value="Low level">Low level (Short investigation)</option>
                                                    <option value="Medium level">Medium level (More serious/complex)</option>
                                                    <option value="High level">High level (Major/Fatal/Complex)</option>
                                                </Input>
                                            </div>
                                        </div>
                                    </Alert>
                                </Col>
                            </Row>
                          </Form>
                        </TabPane>

                        {/* ==================================================
                            TAB 3: PART 3 INFO GATHERING (AI INPUT)
                           ================================================== */}
                        <TabPane tabId={3}>
                          <Form>
                            <h5 className="mb-3 text-primary">Part 3 Investigation information gathering</h5>
                            
                            <div className="mb-4">
                                <Label className="fw-bold">1 Where and when did the adverse event happen?</Label>
                                <Input type="text" name="location" className="form-control" onChange={handleInputChange} placeholder="Specific location and time" />
                            </div>

                            <div className="mb-4">
                                <Label className="fw-bold">2 Who was injured/suffered ill health or was otherwise involved?</Label>
                                <Input type="textarea" rows="2" name="injuredPerson" className="form-control" onChange={handleInputChange} />
                            </div>

                            {/* --- AI CRITICAL INPUT --- */}
                            <div className="mb-4 position-relative p-3 bg-light border border-primary rounded">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Label className="fw-bold mb-0">3 How did the adverse event happen? (Note any equipment involved).</Label>
                                    <Badge color="primary">AI Analysis Source</Badge>
                                </div>
                                <Alert color="info" className="py-2 px-3 mb-2 small">
                                    <i className="bx bx-info-circle me-1"></i>
                                    <strong>AI Tip:</strong> The quality of the Root Cause Analysis (Part 4) depends on the details you provide here. Mention sequences, equipment, and actions.
                                </Alert>
                                <Input 
                                    type="textarea" 
                                    rows="6" 
                                    name="description" 
                                    className="form-control border-secondary" 
                                    onChange={handleInputChange} 
                                    value={formData.description}
                                    placeholder="e.g. The operator opened the safety guard while the machine was running..." 
                                />
                            </div>
                            {/* ------------------------- */}

                            <div className="mb-4">
                                <Label className="fw-bold">4 What activities were being carried out at the time?</Label>
                                <Input type="textarea" rows="2" name="activities" className="form-control" onChange={handleInputChange} />
                            </div>

                            <div className="mb-4">
                                <Label className="fw-bold">5 Was there anything unusual or different about the working conditions?</Label>
                                <Input type="textarea" rows="2" name="unusualConditions" className="form-control" onChange={handleInputChange} />
                            </div>
                            
                            <div className="mb-4">
                                <Label className="fw-bold">6 Were there adequate safe working procedures and were they followed?</Label>
                                <Input type="textarea" rows="2" name="proceduresFollowed" className="form-control" onChange={handleInputChange} />
                            </div>

                            <div className="mb-4">
                                <Label className="fw-bold">7 What injuries or ill health effects, if any, were caused?</Label>
                                <Input type="textarea" rows="2" name="injuryDetails" className="form-control" onChange={handleInputChange} />
                            </div>
                          </Form>
                        </TabPane>

                        {/* ==================================================
                            TAB 4: PART 4 RISK CONTROL (AI OUTPUT)
                           ================================================== */}
                        <TabPane tabId={4}>
                          <Form>
                             <div className="d-flex justify-content-between align-items-center mb-3">
                                 <h5 className="mb-0 text-success">Part 4 The risk control action plan</h5>
                                 <Button size="sm" outline color="secondary" onClick={handleAIAnalysis} disabled={isAnalyzing}>
                                     <i className="bx bx-refresh"></i> Re-Analyze
                                 </Button>
                             </div>
                             
                             [cite_start]{/* AI Analysis Result Section [cite: 209-221] */}
                             <div className="mb-4 p-3 bg-light border rounded shadow-sm">
                                 <Label className="fw-bold text-primary mb-3 h6">
                                     <i className="bx bx-analyse"></i> AI Generated Analysis (Root Causes)
                                 </Label>
                                 
                                 <Row>
                                     <Col lg="12" className="mb-3">
                                         <Label className="fw-bold small text-muted">Immediate Causes</Label>
                                         <Input type="textarea" rows="2" 
                                            name="immediateCauses"
                                            value={formData.immediateCauses} 
                                            onChange={handleInputChange}
                                            className="form-control bg-white fw-bold" 
                                         />
                                     </Col>
                                     <Col lg="12" className="mb-3">
                                         <Label className="fw-bold small text-muted">Underlying Causes</Label>
                                         <Input type="textarea" rows="2" 
                                            name="underlyingCauses"
                                            value={formData.underlyingCauses} 
                                            onChange={handleInputChange}
                                            className="form-control bg-white" 
                                         />
                                     </Col>
                                     <Col lg="12">
                                         <Label className="fw-bold small text-muted">Root Causes</Label>
                                         <Input type="textarea" rows="2" 
                                            name="rootCauses"
                                            value={formData.rootCauses} 
                                            onChange={handleInputChange}
                                            className="form-control bg-white text-danger" 
                                         />
                                     </Col>
                                 </Row>
                             </div>

                             {/* Action Plan Table */}
                             <Label className="fw-bold">22 Which risk control measures should be implemented?</Label>
                             <Table bordered responsive className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{width: '50%'}}>Control measure (Suggested by AI)</th>
                                        <th style={{width: '20%'}}>Completion Date</th>
                                        <th style={{width: '30%'}}>Person responsible</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.actionPlan.map((action, index) => (
                                        <tr key={index}>
                                            <td className="p-1">
                                                <Input 
                                                    type="textarea" 
                                                    rows="2" 
                                                    className="border-0 bg-transparent" 
                                                    value={action.measure} 
                                                    onChange={(e) => handleActionPlanChange(index, 'measure', e.target.value)}
                                                    placeholder="Action item..."
                                                />
                                            </td>
                                            <td className="p-1">
                                                <Input 
                                                    type="date" 
                                                    className="border-0 bg-transparent" 
                                                    value={action.date} 
                                                    onChange={(e) => handleActionPlanChange(index, 'date', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-1">
                                                <Input 
                                                    type="text" 
                                                    className="border-0 bg-transparent" 
                                                    value={action.person} 
                                                    onChange={(e) => handleActionPlanChange(index, 'person', e.target.value)}
                                                    placeholder="Responsible person"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </Table>
                          </Form>
                        </TabPane>

                      </TabContent>
                    </div>

                    {/* --- ACTIONS FOOTER --- */}
                    <div className="actions clearfix mt-3">
                      <ul className="list-inline text-end">
                        <li className={activeTab === 1 ? "previous disabled list-inline-item" : "previous list-inline-item"}>
                          <Button color="secondary" onClick={() => { toggleTab(activeTab - 1) }}>Previous</Button>
                        </li>
                        
                        {/* TRIGGER AI BUTTON (Visible only on Step 3) */}
                        {activeTab === 3 ? (
                             <li className="next list-inline-item">
                                <Button 
                                    color="primary" 
                                    onClick={handleAIAnalysis} 
                                    disabled={isAnalyzing}
                                    style={{minWidth: '160px'}}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Spinner size="sm" className="me-2" /> Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            Analyze with AI <i className="bx bx-right-arrow-alt ms-1"></i>
                                        </>
                                    )}
                                </Button>
                             </li>
                        ) : activeTab === 4 ? (
                            <li className="next list-inline-item">
                                <Button color="success">
                                    <i className="bx bx-file me-1"></i> Generate PDF
                                </Button>
                            </li>
                        ) : (
                            <li className="next list-inline-item">
                                <Button color="primary" onClick={() => { toggleTab(activeTab + 1) }}>Next</Button>
                            </li>
                        )}
                        
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default HSG245WizardAI