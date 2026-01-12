import React, { useState, useRef, useEffect } from "react";
import {
  Container,
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sampleQuestions = [
    "Yapı işlerinde baret takma zorunluluğu hangi yönetmelikte geçer?",
    "6331 sayılı kanun ceza hükümleri nelerdir?",
    "Yüksekte çalışma talimatı nasıl hazırlanır?",
    "İş güvenliği uzmanı çalışma süreleri nedir?",
    "Patlamadan korunma dökümanı (ATEX) nasıl hazırlanır?"
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
    setInputMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1">
                    Mevzuat Asistanı 
                    <Badge color="primary" className="ms-2">BETA</Badge>
                  </h4>
                  <p className="text-muted mb-0">Resmi Gazete ve İSG Yönetmelikleri ile eğitilmiştir.</p>
                </div>
                <div>
                  <Button color="light" className="me-2">
                    <i className="bx bx-cog"></i>
                  </Button>
                  <Button color="light">
                    <i className="bx bx-time"></i> Sohbet Geçmişi
                  </Button>
                </div>
              </div>

              {/* Chat Container */}
              <Card style={{ height: "calc(100vh - 280px)", display: "flex", flexDirection: "column" }}>
                <CardBody style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  {/* Messages */}
                  <div style={{ flex: 1 }}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`d-flex mb-4 ${message.type === "user" ? "justify-content-end" : "justify-content-start"}`}
                      >
                        {message.type === "assistant" && (
                          <div className="me-3">
                            <div
                              className="avatar-sm rounded-circle bg-primary d-flex align-items-center justify-content-center"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i className="bx bx-bot text-white" style={{ fontSize: "20px" }}></i>
                            </div>
                          </div>
                        )}
                        
                        <div style={{ maxWidth: "70%" }}>
                          <div
                            className={`p-3 rounded ${
                              message.type === "user"
                                ? "bg-primary text-white"
                                : "bg-light text-dark"
                            }`}
                          >
                            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
                          </div>
                          
                          {message.references && (
                            <div className="mt-2">
                              <small className="text-muted">REFERANS KAYNAKLAR</small>
                              <div className="d-flex gap-2 mt-1">
                                {message.references.map((ref, idx) => (
                                  <Button
                                    key={idx}
                                    color="light"
                                    size="sm"
                                    className="d-flex align-items-center"
                                  >
                                    <i className={`bx ${ref.icon} me-1`}></i>
                                    {ref.title}
                                    <i className="bx bx-chevron-right ms-1"></i>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <small className="text-muted">
                            {message.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>

                        {message.type === "user" && (
                          <div className="ms-3">
                            <div
                              className="avatar-sm rounded-circle bg-info d-flex align-items-center justify-content-center"
                              style={{ width: "40px", height: "40px" }}
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
                            className="avatar-sm rounded-circle bg-primary d-flex align-items-center justify-content-center"
                            style={{ width: "40px", height: "40px" }}
                          >
                            <i className="bx bx-bot text-white" style={{ fontSize: "20px" }}></i>
                          </div>
                        </div>
                        <div className="bg-light p-3 rounded">
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

                  {/* Sample Questions */}
                  {messages.length === 1 && (
                    <div className="mt-4">
                      <h6 className="mb-3">Geçmiş Sorgular</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {sampleQuestions.map((question, idx) => (
                          <Button
                            key={idx}
                            color="light"
                            size="sm"
                            className="text-start"
                            onClick={() => handleQuestionClick(question)}
                            style={{ maxWidth: "300px" }}
                          >
                            <i className="bx bx-time-five me-1"></i>
                            {question.substring(0, 50)}...
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>

                {/* Input Area */}
                <div className="border-top p-3 bg-light">
                  <div className="d-flex align-items-center">
                    <Button color="light" className="me-2">
                      <i className="bx bx-paperclip"></i>
                    </Button>
                    
                    <Input
                      type="textarea"
                      rows="1"
                      placeholder="Yönetmelik sorusu sorun veya bir madde arayın..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      style={{ resize: "none" }}
                    />
                    
                    <Button
                      color="primary"
                      className="ms-2"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      style={{ minWidth: "100px" }}
                    >
                      <i className="bx bx-send me-1"></i>
                      Gönder
                    </Button>
                  </div>
                  <small className="text-muted mt-2 d-block">
                    Yapay zeka mevzuatı yanlış yorumlayabilir. Lütfen kritik kararlarda Resmi Gazete'yi kontrol ediniz.
                  </small>
                </div>
              </Card>

              {/* AI Model Info */}
              <div className="mt-3 d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bx bx-circle text-success me-1"></i>
                  AI Model: <strong>ISG-Pro v4.2</strong>
                </small>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <style jsx>{`
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
