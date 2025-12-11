import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, Input, Button, Badge } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const AIAgentTest = () => {
  document.title = "Test Your AI Agent | Skote - React Admin & Dashboard Template";

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      sender: "bot",
      time: new Date().toLocaleTimeString("en-US", { 
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentName, setAgentName] = useState("Infera Bot");
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      time: new Date().toLocaleTimeString("en-US", { 
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      }),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: "bot",
        time: new Date().toLocaleTimeString("en-US", { 
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit", 
          minute: "2-digit",
          hour12: true 
        }),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check if message needs human intervention
    if (lowerMessage.includes("urgent") || lowerMessage.includes("complaint") || lowerMessage.includes("problem")) {
      return "Unfortunately, we cannot help now with this information; a human agent will get back to you.";
    }
    
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! How can I assist you today?";
    } else if (lowerMessage.includes("help")) {
      return "I'm here to help! You can ask me about:\n- Product information\n- Account issues\n- General questions\n- Technical support";
    } else if (lowerMessage.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with?";
    } else if (lowerMessage.includes("bye")) {
      return "Goodbye! Have a great day!";
    } else {
      const responses = [
        "I understand your question. How can I assist you further?",
        "Let me help you with that. Could you provide more details?",
        "I'm here to help! What specific information do you need?",
        "Thank you for reaching out. Let me address your concern.",
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! How can I help you today?",
        sender: "bot",
        time: new Date().toLocaleTimeString("en-US", { 
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit", 
          minute: "2-digit",
          hour12: true 
        }),
      },
    ]);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Agents" breadcrumbItem="View AI Agent" />

          <Row>
            <Col lg={6}>
              <Card>
                <CardBody>
                  <div className="mb-4">
                    <h5 className="card-title mb-3">Test Your AI Agent</h5>
                    <p className="text-muted mb-0">
                      Experience the appearance and functionality of your AI Agent by testing it with various questions.
                    </p>
                  </div>

                  <div className="border rounded p-3 mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="d-flex align-items-center mb-3">
                      <div className="flex-shrink-0 me-3">
                        <div className="avatar-sm">
                          <span className="avatar-title rounded-circle bg-primary text-white font-size-20">
                            <i className="bx bxs-bot"></i>
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{agentName}</h6>
                        <div className="d-flex align-items-center">
                          <i className={`mdi mdi-circle font-size-10 ${isOnline ? 'text-success' : 'text-danger'} me-1`}></i>
                          <small className="text-muted">
                            {isOnline ? 'Online' : 'Offline'}
                          </small>
                        </div>
                      </div>
                      <Button 
                        color="light" 
                        size="sm" 
                        className="dropdown-toggle"
                      >
                        <i className="mdi mdi-chevron-down"></i>
                      </Button>
                    </div>

                    <div
                      className="chat-conversation bg-white rounded p-3"
                      style={{
                        height: "450px",
                        overflowY: "auto",
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`mb-3 ${
                            message.sender === "user" ? "text-end" : ""
                          }`}
                        >
                          {message.sender === "bot" && (
                            <div className="d-flex align-items-start mb-2">
                              <div className="flex-shrink-0 me-2">
                                <div className="avatar-xs">
                                  <span className="avatar-title rounded-circle bg-primary text-white">
                                    <i className="bx bxs-bot font-size-12"></i>
                                  </span>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <div
                                  className="p-3 rounded bg-light"
                                  style={{
                                    maxWidth: "80%",
                                    display: "inline-block",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {message.text}
                                </div>
                                <div className="text-muted font-size-11 mt-1">
                                  {message.time}
                                </div>
                              </div>
                            </div>
                          )}
                          {message.sender === "user" && (
                            <div>
                              <div
                                className="p-3 rounded text-white d-inline-block"
                                style={{
                                  backgroundColor: "#556ee6",
                                  maxWidth: "80%",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {message.text}
                              </div>
                              <div className="text-muted font-size-11 mt-1">
                                {message.time}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="mb-3">
                          <div className="d-flex align-items-start">
                            <div className="flex-shrink-0 me-2">
                              <div className="avatar-xs">
                                <span className="avatar-title rounded-circle bg-primary text-white">
                                  <i className="bx bxs-bot font-size-12"></i>
                                </span>
                              </div>
                            </div>
                            <div className="p-3 rounded bg-light">
                              <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="mt-3">
                      <div className="position-relative">
                        <Input
                          type="text"
                          className="form-control"
                          placeholder="Ask me anything..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          style={{ paddingRight: "50px" }}
                        />
                        <Button
                          color="primary"
                          className="position-absolute top-0 end-0"
                          style={{ 
                            borderTopLeftRadius: 0, 
                            borderBottomLeftRadius: 0,
                            height: "100%"
                          }}
                          onClick={handleSendMessage}
                          disabled={inputMessage.trim() === ""}
                        >
                          <i className="bx bx-up-arrow-alt font-size-16"></i>
                        </Button>
                      </div>
                    </div>

                    <div className="text-center mt-3">
                      <small className="text-muted">
                        Powered by <strong>Infera</strong>
                      </small>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <Button color="light" outline className="flex-grow-1">
                      <i className="bx bx-link-alt me-1"></i>
                      Copy Link
                    </Button>
                    <Button color="primary" outline className="flex-grow-1">
                      <i className="bx bx-show me-1"></i>
                      View AI Agent
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col lg={6}>
              <Card>
                <CardBody>
                  <h5 className="card-title mb-4">Training Sources</h5>
                  <p className="text-muted mb-4">
                    Add training sources to improve the AI Agent's performance.
                  </p>

                  <Row className="mb-4">
                    <Col md={4}>
                      <div className="border rounded p-3 text-center">
                        <i className="bx bx-link-alt font-size-24 text-primary mb-2"></i>
                        <h6 className="mb-1">Links</h6>
                        <h4 className="mb-0">
                          <Badge color="primary" className="font-size-14">2</Badge>
                          <span className="text-muted font-size-14">/5</span>
                        </h4>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-3 text-center">
                        <i className="bx bx-file font-size-24 text-success mb-2"></i>
                        <h6 className="mb-1">Files</h6>
                        <h4 className="mb-0">
                          <Badge color="primary" className="font-size-14">0</Badge>
                          <span className="text-muted font-size-14">/20</span>
                        </h4>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-3 text-center">
                        <i className="bx bx-text font-size-24 text-info mb-2"></i>
                        <h6 className="mb-1">Characters</h6>
                        <h4 className="mb-0">
                          <Badge color="primary" className="font-size-14">36.8K</Badge>
                          <span className="text-muted font-size-14">/100K</span>
                        </h4>
                      </div>
                    </Col>
                  </Row>

                  <Button color="dark" className="w-100 mb-4">
                    <i className="bx bx-cog me-1"></i>
                    Manage Training Sources
                  </Button>

                  <hr />

                  <h5 className="card-title mt-4 mb-3">Script for Your Website</h5>
                  <p className="text-muted mb-3">
                    Use this script to add the AI Agent to your website. Insert it between{" "}
                    <code>&lt;head&gt;</code> and <code>&lt;/head&gt;</code> tags.
                  </p>

                  <div className="bg-light p-3 rounded mb-3" style={{ position: "relative" }}>
                    <pre className="mb-0" style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>
{`<script
  src="https://widget.infera.com/infera-embeded.min.js"
  chat-hash="io4pj2iwfiibnjfl05x3hs"
  defer>
</script>`}
                    </pre>
                  </div>

                  <div className="alert alert-info" role="alert">
                    <i className="mdi mdi-information-outline me-2"></i>
                    Your script will not change if you add more <strong>Training Sources</strong>.
                  </div>

                  <div className="d-flex gap-2">
                    <Button color="dark" className="flex-grow-1">
                      <i className="bx bx-copy me-1"></i>
                      Copy Script
                    </Button>
                    <Button color="light" outline className="flex-grow-1">
                      <i className="bx bx-envelope me-1"></i>
                      Send to Developer
                    </Button>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h5 className="card-title mb-3">Agent Settings</h5>
                  <div className="mb-3">
                    <label className="form-label">Agent Name</label>
                    <Input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Enter agent name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="agentStatus"
                        checked={isOnline}
                        onChange={(e) => setIsOnline(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="agentStatus">
                        {isOnline ? 'Online' : 'Offline'}
                      </label>
                    </div>
                  </div>
                  <Button color="danger" outline className="w-100" onClick={handleReset}>
                    <i className="bx bx-reset me-1"></i>
                    Reset Conversation
                  </Button>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <style>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #556ee6;
          animation: typing 1.4s infinite;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .chat-conversation::-webkit-scrollbar {
          width: 6px;
        }

        .chat-conversation::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .chat-conversation::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .chat-conversation::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </React.Fragment>
  );
};

export default AIAgentTest;
