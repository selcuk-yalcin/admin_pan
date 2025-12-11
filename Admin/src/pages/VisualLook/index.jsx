import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Label,
  Input,
  Button,
  FormGroup,
} from "reactstrap";
import classnames from "classnames";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const VisualLook = () => {
  document.title = "Visual Look | Skote - React Admin & Dashboard Template";

  const [activeTab, setActiveTab] = useState("general");
  const [agentName, setAgentName] = useState("Infera Bot");
  const [agentOpened, setAgentOpened] = useState(false);
  const [colorMode, setColorMode] = useState("Light Mode");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");

  const colors = [
    "#e5e7eb",
    "#ef4444",
    "#6b7280",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
  ];

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="AI Agent" breadcrumbItem="Visual Look" />

          <Row>
            <Col lg={7}>
              <Card>
                <CardBody>
                  <div className="mb-4">
                    <h5 className="card-title mb-2">Visual Look</h5>
                    <p className="text-muted mb-0">
                      Customize the appearance and design of your AI Agent.
                    </p>
                  </div>

                  <Nav tabs className="nav-tabs-custom nav-justified">
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({ active: activeTab === "general" })}
                        onClick={() => toggleTab("general")}
                      >
                        General
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({ active: activeTab === "input" })}
                        onClick={() => toggleTab("input")}
                      >
                        Input
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({ active: activeTab === "action-buttons" })}
                        onClick={() => toggleTab("action-buttons")}
                      >
                        Action Buttons
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({ active: activeTab === "messages" })}
                        onClick={() => toggleTab("messages")}
                      >
                        Messages
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({ active: activeTab === "human-form" })}
                        onClick={() => toggleTab("human-form")}
                      >
                        Human Form
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({ active: activeTab === "leads-form" })}
                        onClick={() => toggleTab("leads-form")}
                      >
                        Leads Form
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({ active: activeTab === "custom-brand" })}
                        onClick={() => toggleTab("custom-brand")}
                      >
                        Custom Brand
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <TabContent activeTab={activeTab} className="p-4">
                    <TabPane tabId="general">
                      <div>
                        <FormGroup className="mb-4">
                          <Label>AI Agent Display Name</Label>
                          <p className="text-muted small mb-2">
                            This name is seen by those who interact with your chat (e.g. customers)
                          </p>
                          <Input
                            type="text"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            placeholder="Enter agent name"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>AI Agent Profile Avatar</Label>
                          <p className="text-muted small mb-2">
                            Personalize your AI Agent with a custom profile picture (formats: .jpg, .png)
                          </p>
                          <div className="d-flex gap-2 align-items-center">
                            <Input
                              type="text"
                              placeholder="Choose File"
                              readOnly
                              className="flex-grow-1"
                            />
                            <Button color="light" outline>
                              Upload Photo
                            </Button>
                          </div>
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>AI Agent Opened</Label>
                          <p className="text-muted small mb-2">
                            When you turn on this feature, the AI Agent will open directly on your website.
                          </p>
                          <div className="form-check form-switch form-switch-lg">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="agentOpenedSwitch"
                              checked={agentOpened}
                              onChange={(e) => setAgentOpened(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="agentOpenedSwitch">
                              {agentOpened ? "Enabled" : "Disabled"}
                            </label>
                          </div>
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>AI Agent Colors</Label>
                          <p className="text-muted small mb-2">
                            Choose the message background color.
                          </p>
                          <div className="mb-3">
                            <Label className="small">Select Mode</Label>
                            <Input
                              type="select"
                              value={colorMode}
                              onChange={(e) => setColorMode(e.target.value)}
                            >
                              <option>Light Mode</option>
                              <option>Dark Mode</option>
                            </Input>
                          </div>
                          <div>
                            <Label className="small mb-3">Choose the message background color.</Label>
                            <div 
                              className="border rounded p-4 d-flex align-items-center justify-content-center mb-3"
                              style={{ 
                                backgroundColor: selectedColor,
                                height: "120px",
                                position: "relative"
                              }}
                            >
                              <span className="text-white fw-bold">{selectedColor}</span>
                            </div>
                            <div className="d-flex gap-2">
                              {colors.map((color) => (
                                <div
                                  key={color}
                                  className="rounded"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    backgroundColor: color,
                                    cursor: "pointer",
                                    border: selectedColor === color ? "3px solid #000" : "1px solid #ddd",
                                  }}
                                  onClick={() => setSelectedColor(color)}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </FormGroup>
                      </div>
                    </TabPane>

                    <TabPane tabId="input">
                      <div>
                        <FormGroup className="mb-4">
                          <Label>Placeholder Message</Label>
                          <p className="text-muted small mb-2">
                            Write the input placeholder message that your users will see in the send message input from AI Agent
                          </p>
                          <Input
                            type="text"
                            placeholder=""
                            className="form-control"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Request Message</Label>
                          <p className="text-muted small mb-2">
                            Write the input placeholder message that your users will see after they send the message in AI Agent
                          </p>
                          <Input
                            type="text"
                            placeholder=""
                            className="form-control"
                          />
                        </FormGroup>
                      </div>
                    </TabPane>

                    <TabPane tabId="action-buttons">
                      <div>
                        <FormGroup className="mb-4">
                          <Label>Human Button Message</Label>
                          <p className="text-muted small mb-2">
                            Write the message that your users will see on the human help button from AI Agent
                          </p>
                          <Input
                            type="text"
                            placeholder=""
                            className="form-control"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Finish Button Message</Label>
                          <p className="text-muted small mb-2">
                            Write the message that your users will see on the finish conversation button from AI Agent
                          </p>
                          <Input
                            type="text"
                            placeholder=""
                            className="form-control"
                          />
                        </FormGroup>

                        <div className="mb-4">
                          <p className="text-muted small mb-3">
                            Enable/Disable the action buttons for human help and finish conversation
                          </p>
                          
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <Label className="mb-0">Human Help</Label>
                            <div className="form-check form-switch">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="humanHelpSwitch"
                                defaultChecked
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <Label className="mb-0">Finish Conversation</Label>
                            <div className="form-check form-switch">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="finishConversationSwitch"
                                defaultChecked
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabPane>

                    <TabPane tabId="messages">
                      <div>
                        <FormGroup className="mb-4">
                          <Label>Bot Welcome Message</Label>
                          <p className="text-muted small mb-2">
                            Write the first message that your bot will send to users when they open the chat
                          </p>
                          <Input
                            type="textarea"
                            rows="3"
                            placeholder="Welcome! How can I assist you today?"
                            className="form-control"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Bot Response Delay</Label>
                          <p className="text-muted small mb-2">
                            Set the delay (in milliseconds) before the bot responds to messages
                          </p>
                          <Input
                            type="number"
                            placeholder="1000"
                            className="form-control"
                            style={{ maxWidth: "200px" }}
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Typing Indicator</Label>
                          <p className="text-muted small mb-2">
                            Show typing indicator while bot is preparing a response
                          </p>
                          <div className="form-check form-switch form-switch-lg">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="typingIndicatorSwitch"
                              defaultChecked
                            />
                            <label className="form-check-label" htmlFor="typingIndicatorSwitch">
                              Enabled
                            </label>
                          </div>
                        </FormGroup>
                      </div>
                    </TabPane>

                    <TabPane tabId="human-form">
                      <div>
                        <FormGroup className="mb-4">
                          <Label>Human Form Title</Label>
                          <p className="text-muted small mb-2">
                            Set the title that appears on the human handoff form
                          </p>
                          <Input
                            type="text"
                            placeholder="Contact Human Agent"
                            className="form-control"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Human Form Description</Label>
                          <p className="text-muted small mb-2">
                            Write a brief description for users before they request human help
                          </p>
                          <Input
                            type="textarea"
                            rows="3"
                            placeholder="Please provide your details and a human agent will assist you shortly."
                            className="form-control"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Required Fields</Label>
                          <p className="text-muted small mb-3">
                            Select which fields are required in the human handoff form
                          </p>
                          
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="mb-0 small">Name</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="nameRequired"
                                defaultChecked
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="mb-0 small">Email</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="emailRequired"
                                defaultChecked
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="mb-0 small">Phone</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="phoneRequired"
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <Label className="mb-0 small">Message</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="messageRequired"
                                defaultChecked
                              />
                            </div>
                          </div>
                        </FormGroup>
                      </div>
                    </TabPane>

                    <TabPane tabId="leads-form">
                      <div>
                        <FormGroup className="mb-4">
                          <Label>Lead Form Title</Label>
                          <p className="text-muted small mb-2">
                            Set the title that appears on the lead capture form
                          </p>
                          <Input
                            type="text"
                            placeholder="Get in Touch"
                            className="form-control"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Lead Form Description</Label>
                          <p className="text-muted small mb-2">
                            Write a brief description to encourage users to submit their information
                          </p>
                          <Input
                            type="textarea"
                            rows="3"
                            placeholder="Leave your details and we'll get back to you as soon as possible."
                            className="form-control"
                          />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Form Fields</Label>
                          <p className="text-muted small mb-3">
                            Configure which fields to collect from leads
                          </p>
                          
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="mb-0 small">Full Name</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="leadNameField"
                                defaultChecked
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="mb-0 small">Email Address</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="leadEmailField"
                                defaultChecked
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="mb-0 small">Phone Number</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="leadPhoneField"
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="mb-0 small">Company Name</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="leadCompanyField"
                              />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <Label className="mb-0 small">Additional Notes</Label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="leadNotesField"
                              />
                            </div>
                          </div>
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <Label>Submit Button Text</Label>
                          <p className="text-muted small mb-2">
                            Customize the text on the submit button
                          </p>
                          <Input
                            type="text"
                            placeholder="Submit"
                            className="form-control"
                            style={{ maxWidth: "200px" }}
                          />
                        </FormGroup>
                      </div>
                    </TabPane>

                    <TabPane tabId="custom-brand">
                      <div className="text-center py-5">
                        <i className="bx bx-palette display-4 text-muted mb-3"></i>
                        <h5 className="text-muted">Custom Brand</h5>
                        <p className="text-muted">Add your brand logo and colors</p>
                      </div>
                    </TabPane>
                  </TabContent>

                  <div className="mt-4">
                    <Button color="primary" className="me-2">
                      <i className="bx bx-save me-1"></i>
                      Save Changes
                    </Button>
                    <Button color="light" outline>
                      <i className="bx bx-reset me-1"></i>
                      Reset
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="position-sticky" style={{ top: "100px" }}>
                <CardBody>
                  <h5 className="card-title mb-4">Preview</h5>
                  
                  <div className="border rounded p-3" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="d-flex justify-content-end mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "50px",
                          height: "50px",
                          backgroundColor: selectedColor,
                          cursor: "pointer",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                      >
                        <span className="text-white fw-bold">
                          {agentName.charAt(0).toUpperCase()}
                        </span>
                        <i className="bx bx-chevron-down text-white position-absolute" style={{ bottom: "0", right: "0" }}></i>
                      </div>
                    </div>

                    <div className="bg-white rounded p-4 shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                        <div 
                          className="rounded-circle me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <span className="text-white fw-bold">
                            {agentName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0">{agentName}</h6>
                          <i className="bx bx-chevron-down"></i>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="bg-light rounded p-3 mb-2">
                          <p className="mb-1">How can we help you today?</p>
                          <small className="text-muted">22/02/2024, 5:10PM</small>
                        </div>
                      </div>

                      <div className="mb-3 text-end">
                        <div 
                          className="rounded p-3 d-inline-block"
                          style={{ backgroundColor: selectedColor }}
                        >
                          <p className="mb-1 text-white">How can I help you today?</p>
                          <small className="text-white-50">2/8/2024, 6:00:00 PM</small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="bg-light rounded p-3 mb-2">
                          <p className="mb-1">Description about analytics.</p>
                          <small className="text-muted">2/8/2024, 6:01:00 PM</small>
                        </div>
                      </div>

                      <div className="mb-3 text-end">
                        <div 
                          className="rounded p-3 d-inline-block"
                          style={{ backgroundColor: selectedColor }}
                        >
                          <p className="mb-1 text-white">Is there anything else I can help you with?</p>
                          <small className="text-white-50">2/8/2024, 6:02:00 PM</small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="bg-light rounded p-3 mb-2">
                          <p className="mb-1">Description about social media.</p>
                          <small className="text-muted">2/8/2024, 6:03:00 PM</small>
                        </div>
                      </div>

                      <div className="d-flex gap-2 mb-3">
                        <Button color="light" size="sm" outline className="rounded-pill">
                          Human Help
                        </Button>
                        <Button color="light" size="sm" outline className="rounded-pill">
                          Finish Conversation
                        </Button>
                      </div>

                      <div className="position-relative">
                        <Input
                          type="text"
                          placeholder="Ask me anything..."
                          className="rounded-pill"
                          style={{ paddingRight: "50px" }}
                        />
                        <Button
                          color="primary"
                          size="sm"
                          className="position-absolute rounded-circle"
                          style={{ 
                            right: "5px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "35px",
                            height: "35px",
                            padding: "0"
                          }}
                        >
                          <i className="bx bx-up-arrow-alt"></i>
                        </Button>
                      </div>

                      <div className="text-center mt-3">
                        <small className="text-muted">
                          Powered by <strong>Infera</strong>
                        </small>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default VisualLook;
