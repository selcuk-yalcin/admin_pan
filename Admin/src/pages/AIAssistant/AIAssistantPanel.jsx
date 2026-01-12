import React, { useState, useRef, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Input,
  Button,
  Badge
} from "reactstrap";

const AIAssistantPanel = () => {
  document.title = "Mevzuat Asistanı | HSE AgenticAI";

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      text: "Merhaba! Ben HSE Mevzuat Asistanınızım. İş sağlığı ve güvenliği mevzuatı, risk değerlendirme, ÇSYS ve tüm İSG konularında size yardımcı olabilirim. Size nasıl yardımcı olabilirim?",
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sampleQuestions = [
    "Yüksekte çalışma talimatı",
    "6331 sayılı kanun ceza...",
    "Yüksekte çalışma korkulu...",
    "İş güvenliği uzmanı çalış...",
    "Patlamadan korunma dök..."
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: "assistant",
        text: "Bu soru için mevzuat veritabanımızı kontrol ediyorum. İş Sağlığı ve Güvenliği ile ilgili detaylı bilgi için lütfen bekleyiniz...\n\nYapay zeka entegrasyonu aktif olduğunda, bu sorunuza detaylı ve mevzuata uygun yanıt vereceğim.",
        timestamp: new Date(),
        references: [
          { title: "İSG Yönetmeliği Ek-4", icon: "bx-file-blank" },
          { title: "6331 Sayılı Kanun", icon: "bx-file-blank" }
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuestionClick = (question) => {
    const fullQuestions = [
      "Yüksekte çalışma talimatı nasıl hazırlanır?",
      "6331 sayılı kanun ceza hükümleri nelerdir?",
      "Yüksekte çalışma korkuluk yüksekliği ne olmalı?",
      "İş güvenliği uzmanı çalışma süreleri nedir?",
      "Patlamadan korunma dökümanı (ATEX) nasıl hazırlanır?"
    ];
    const index = sampleQuestions.findIndex(q => question.includes(q.split('...')[0]));
    setInputMessage(fullQuestions[index] || question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <React.Fragment>
      <div className="page-content" style={{ padding: 0, height: "100vh" }}>
        <Row style={{ margin: 0, height: "100%" }}>
          {/* Left Sidebar - Dark */}
          <Col 
            lg={3} 
            style={{ 
              background: "linear-gradient(180deg, #1a1d29 0%, #232738 100%)",
              padding: "24px",
              height: "100vh",
              overflowY: "auto",
              borderRight: "1px solid #2d3142"
            }}
          >
            {/* Logo/Header */}
            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <div 
                  className="rounded me-2"
                  style={{
                    background: "linear-gradient(135deg, #7b68ee 0%, #9b59b6 100%)",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "white"
                  }}
                >
                  M
                </div>
                <h4 className="mb-0 text-white">Mevzuat AI</h4>
              </div>
            </div>

            {/* Ana Menü */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: "11px", letterSpacing: "1px" }}>
                Ana Menü
              </h6>
              
              <div className="mb-2">
                <Button
                  color="primary"
                  block
                  className="text-start d-flex align-items-center"
                  style={{
                    background: "linear-gradient(135deg, #7b68ee 0%, #9b59b6 100%)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 16px"
                  }}
                  onClick={() => setActiveSection("chat")}
                >
                  <i className="bx bx-conversation me-2" style={{ fontSize: "20px" }}></i>
                  Mevzuat Sohbeti
                </Button>
              </div>

              <div className="mb-2">
                <Button
                  color="link"
                  block
                  className="text-start d-flex align-items-center text-white-50"
                  style={{
                    textDecoration: "none",
                    padding: "12px 16px",
                    borderRadius: "8px"
                  }}
                  onClick={() => setActiveSection("archive")}
                >
                  <i className="bx bx-file me-2" style={{ fontSize: "20px" }}></i>
                  Yönetmelik Arşivi
                </Button>
              </div>

              <div className="mb-2">
                <Button
                  color="link"
                  block
                  className="text-start d-flex align-items-center text-white-50"
                  style={{
                    textDecoration: "none",
                    padding: "12px 16px",
                    borderRadius: "8px"
                  }}
                >
                  <i className="bx bx-history me-2" style={{ fontSize: "20px" }}></i>
                  Son Değişiklikler
                  <Badge color="danger" pill className="ms-auto">Yeni</Badge>
                </Button>
              </div>
            </div>

            {/* Geçmiş Sorgular */}
            <div>
              <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: "11px", letterSpacing: "1px" }}>
                Geçmiş Sorgular
              </h6>
              
              {sampleQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  color="link"
                  block
                  className="text-start d-flex align-items-center text-white-50 mb-2"
                  style={{
                    textDecoration: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    transition: "all 0.2s"
                  }}
                  onClick={() => handleQuestionClick(question)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <i className="bx bx-time-five me-2"></i>
                  {question}
                </Button>
              ))}
            </div>
          </Col>

          {/* Right Chat Area */}
          <Col lg={9} style={{ padding: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
            {/* Header */}
            <div 
              className="d-flex justify-content-between align-items-center"
              style={{
                padding: "20px 32px",
                borderBottom: "1px solid #e9ecef",
                background: "white"
              }}
            >
              <div>
                <h4 className="mb-1">
                  Mevzuat Asistanı 
                  <Badge color="primary" className="ms-2" style={{ fontSize: "10px", padding: "4px 8px" }}>
                    BETA
                  </Badge>
                </h4>
                <p className="mb-0" style={{ fontSize: "13px" }}>
                  <i className="bx bx-book-content text-primary me-1"></i>
                  <span className="text-muted">Bot, </span>
                  <strong className="text-primary">Resmi Gazete ve İSG Mevzuatları</strong>
                  <span className="text-muted"> ile eğitilmiştir.</span>
                </p>
              </div>
              <div>
                <Button 
                  color="light" 
                  className="me-2"
                  style={{ 
                    borderRadius: "8px",
                    border: "1px solid #e9ecef"
                  }}
                >
                  <i className="bx bx-cog"></i>
                </Button>
                <span className="text-muted" style={{ fontSize: "13px" }}>
                  <i className="bx bx-time"></i> Sohbet Geçmişi
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              style={{ 
                flex: 1, 
                overflowY: "auto", 
                padding: messages.length === 1 ? "60px 80px" : "24px 32px",
                background: "#f8f9fa",
                display: "flex",
                flexDirection: "column",
                justifyContent: messages.length === 1 ? "center" : "flex-start"
              }}
            >
              {/* Welcome Screen */}
              {messages.length === 1 && (
                <div className="text-center mb-5">
                  <div 
                    className="mx-auto mb-4"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "linear-gradient(135deg, #e8e3fc 0%, #f3f0ff 100%)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <i className="bx bx-search" style={{ fontSize: "36px", color: "#7b68ee" }}></i>
                  </div>
                  <h3 className="mb-3" style={{ fontWeight: "600", color: "#1a1d29" }}>
                    Size Nasıl Yardımcı Olabilirim?
                  </h3>
                  <p className="text-muted mb-5" style={{ fontSize: "15px", maxWidth: "600px", margin: "0 auto" }}>
                    İSG kanunları, yönetmelikler, standartlar veya ceza puanları hakkında her şeyi sorabilirsiniz.
                  </p>

                  {/* Category Cards */}
                  <Row className="g-3">
                    <Col md={6}>
                      <Card 
                        className="border-0 h-100"
                        style={{ 
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                        }}
                        onClick={() => handleQuestionClick("Yüksekte çalışma talimatı")}
                      >
                        <CardBody className="p-4 text-start">
                          <div 
                            className="mb-3"
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #e8e3fc 0%, #f3f0ff 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="bx bx-circle" style={{ fontSize: "24px", color: "#7b68ee" }}></i>
                          </div>
                          <h5 className="mb-2" style={{ fontWeight: "600", color: "#1a1d29" }}>KKD Kullanımı</h5>
                          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                            Baret takma zorunluluğu hangi yönetmelikte?
                          </p>
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card 
                        className="border-0 h-100"
                        style={{ 
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                        }}
                        onClick={() => handleQuestionClick("6331 sayılı kanun ceza...")}
                      >
                        <CardBody className="p-4 text-start">
                          <div 
                            className="mb-3"
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #d4edff 0%, #e8f5ff 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="bx bx-group" style={{ fontSize: "24px", color: "#4A90E2" }}></i>
                          </div>
                          <h5 className="mb-2" style={{ fontWeight: "600", color: "#1a1d29" }}>Çalışan Temsilcisi</h5>
                          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                            Sayı belirleme kriterleri nelerdir?
                          </p>
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card 
                        className="border-0 h-100"
                        style={{ 
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                        }}
                        onClick={() => handleQuestionClick("Yüksekte çalışma korkulu...")}
                      >
                        <CardBody className="p-4 text-start">
                          <div 
                            className="mb-3"
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #ffe8e8 0%, #fff3f3 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="bx bx-error" style={{ fontSize: "24px", color: "#E74C3C" }}></i>
                          </div>
                          <h5 className="mb-2" style={{ fontWeight: "600", color: "#1a1d29" }}>Acil Durumlar</h5>
                          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                            Plan yenileme periyotları nedir?
                          </p>
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card 
                        className="border-0 h-100"
                        style={{ 
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                        }}
                        onClick={() => handleQuestionClick("Patlamadan korunma dök...")}
                      >
                        <CardBody className="p-4 text-start">
                          <div 
                            className="mb-3"
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #fff4e6 0%, #fff9f0 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="bx bx-flask" style={{ fontSize: "24px", color: "#F39C12" }}></i>
                          </div>
                          <h5 className="mb-2" style={{ fontWeight: "600", color: "#1a1d29" }}>Kimyasal Maddeler</h5>
                          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                            Maruziyet sınır değerleri hakkında bilgi.
                          </p>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Chat Messages */}
              {messages.length > 1 && messages.slice(1).map((message) => (
                <div
                  key={message.id}
                  className={`d-flex mb-4 ${message.type === "user" ? "justify-content-end" : "justify-content-start"}`}
                >
                  {message.type === "assistant" && (
                    <div className="me-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        }}
                      >
                        <i className="bx bx-bot text-white" style={{ fontSize: "20px" }}></i>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ maxWidth: "70%" }}>
                    <div
                      style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: message.type === "user" 
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "white",
                        color: message.type === "user" ? "white" : "#1a1d29",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                      }}
                    >
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6" }}>
                        {message.text}
                      </p>
                    </div>
                    
                    {message.references && (
                      <div className="mt-2">
                        <small className="text-muted fw-bold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                          REFERANS KAYNAKLAR
                        </small>
                        <div className="d-flex gap-2 mt-2">
                          {message.references.map((ref, idx) => (
                            <Button
                              key={idx}
                              color="light"
                              size="sm"
                              className="d-flex align-items-center"
                              style={{
                                borderRadius: "6px",
                                border: "1px solid #e9ecef",
                                fontSize: "12px"
                              }}
                            >
                              <i className={`bx ${ref.icon} me-1`}></i>
                              {ref.title}
                              <i className="bx bx-chevron-right ms-1"></i>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
                      {message.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>

                  {message.type === "user" && (
                    <div className="ms-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        }}
                      >
                        <span className="text-white fw-bold">AU</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="d-flex mb-4">
                  <div className="me-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      }}
                    >
                      <i className="bx bx-bot text-white" style={{ fontSize: "20px" }}></i>
                    </div>
                  </div>
                  <div 
                    style={{
                      background: "white",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}
                  >
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div 
              style={{
                padding: "24px 32px 20px 32px",
                borderTop: "1px solid #e9ecef",
                background: "white"
              }}
            >
              <div className="mb-3">
                <div 
                  className="d-flex align-items-end"
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "2px solid #e9ecef",
                    padding: "4px",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#7b68ee";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(123, 104, 238, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e9ecef";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Button 
                    color="light" 
                    className="me-2"
                    style={{
                      borderRadius: "12px",
                      border: "none",
                      background: "transparent"
                    }}
                  >
                    <i className="bx bx-paperclip" style={{ fontSize: "20px", color: "#6c757d" }}></i>
                  </Button>
                  
                  <Input
                    type="textarea"
                    rows="2"
                    placeholder="Yönetmelik sorusu sorun veya bir madde arayın..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ 
                      resize: "none",
                      border: "none",
                      fontSize: "15px",
                      padding: "12px 8px",
                      background: "transparent",
                      boxShadow: "none",
                      outline: "none"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.parentElement.style.borderColor = "#7b68ee";
                      e.currentTarget.parentElement.style.boxShadow = "0 0 0 3px rgba(123, 104, 238, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.parentElement.style.borderColor = "#e9ecef";
                      e.currentTarget.parentElement.style.boxShadow = "none";
                    }}
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    style={{ 
                      borderRadius: "12px",
                      background: inputMessage.trim() 
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "#e9ecef",
                      border: "none",
                      padding: "10px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "50px",
                      height: "48px"
                    }}
                  >
                    <i className="bx bx-send" style={{ fontSize: "20px" }}></i>
                  </Button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-start" style={{ fontSize: "12px" }}>
                <div className="text-muted" style={{ lineHeight: "1.6", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#6c757d" }}>
                    <i className="bx bx-error-circle me-1" style={{ color: "#f39c12" }}></i>
                    <strong>Önemli:</strong> Bot hata yapabilir. Lütfen bilgileri teyit etmenizi öneririz. Kritik kararlar için resmi mevzuatı kontrol ediniz.
                  </div>
                </div>
                <div className="text-end text-muted" style={{ whiteSpace: "nowrap", marginLeft: "16px" }}>
                  <i className="bx bx-circle text-success me-1" style={{ fontSize: "8px" }}></i>
                  <small>
                    Model: <strong>İSG-Pro v4.2</strong>
                  </small>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <style>{`
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #6c757d;
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
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </React.Fragment>
  );
};

export default AIAssistantPanel;
