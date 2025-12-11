import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, Input, Button } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const Chatbot = () => {
  document.title = "Chatbot | Skote - React Admin & Dashboard Template";

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Merhaba! Size nasıl yardımcı olabilirim?",
      sender: "bot",
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    },
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

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
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
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("merhaba") || lowerMessage.includes("selam")) {
      return "Merhaba! Size nasıl yardımcı olabilirim?";
    } else if (lowerMessage.includes("nasılsın") || lowerMessage.includes("nasılsınız")) {
      return "İyiyim, teşekkür ederim! Size nasıl yardımcı olabilirim?";
    } else if (lowerMessage.includes("yardım") || lowerMessage.includes("help")) {
      return "Tabii ki! Size şu konularda yardımcı olabilirim:\n- Genel sorular\n- Teknik destek\n- Ürün bilgileri\n- Diğer konular";
    } else if (lowerMessage.includes("teşekkür") || lowerMessage.includes("sağol")) {
      return "Rica ederim! Başka bir konuda yardımcı olabilir miyim?";
    } else if (lowerMessage.includes("bye") || lowerMessage.includes("güle güle")) {
      return "Hoşça kalın! İyi günler dilerim.";
    } else {
      const responses = [
        "Anlıyorum. Size bu konuda nasıl yardımcı olabilirim?",
        "İlginç bir soru. Daha fazla detay verebilir misiniz?",
        "Bu konuda size yardımcı olmaya çalışayım.",
        "Anladım. Başka ne öğrenmek istersiniz?",
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

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Apps" breadcrumbItem="Chatbot" />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div className="d-flex align-items-center mb-4">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar-sm">
                        <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-24">
                          <i className="bx bx-bot"></i>
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="font-size-16 mb-1">AI Chatbot</h5>
                      <p className="text-muted mb-0">
                        <i className="mdi mdi-circle text-success align-middle me-1"></i>
                        Çevrimiçi
                      </p>
                    </div>
                    <div>
                      <Button color="primary" size="sm" className="me-2">
                        <i className="bx bx-reset me-1"></i>
                        Yeni Sohbet
                      </Button>
                    </div>
                  </div>

                  <div
                    className="chat-conversation"
                    style={{
                      height: "500px",
                      overflowY: "auto",
                      padding: "20px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                    }}
                  >
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`d-flex mb-3 ${
                          message.sender === "user" ? "justify-content-end" : ""
                        }`}
                      >
                        {message.sender === "bot" && (
                          <div className="flex-shrink-0 me-2">
                            <div className="avatar-xs">
                              <span className="avatar-title rounded-circle bg-primary text-white">
                                <i className="bx bx-bot"></i>
                              </span>
                            </div>
                          </div>
                        )}
                        <div
                          className={`flex-grow-1 ${
                            message.sender === "user" ? "text-end" : ""
                          }`}
                          style={{ maxWidth: "70%" }}
                        >
                          <div
                            className={`p-3 rounded ${
                              message.sender === "user"
                                ? "bg-primary text-white"
                                : "bg-white"
                            }`}
                            style={{
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {message.text}
                          </div>
                          <p className="text-muted font-size-11 mt-1 mb-0">
                            {message.time}
                          </p>
                        </div>
                        {message.sender === "user" && (
                          <div className="flex-shrink-0 ms-2">
                            <div className="avatar-xs">
                              <span className="avatar-title rounded-circle bg-success text-white">
                                <i className="bx bx-user"></i>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="d-flex mb-3">
                        <div className="flex-shrink-0 me-2">
                          <div className="avatar-xs">
                            <span className="avatar-title rounded-circle bg-primary text-white">
                              <i className="bx bx-bot"></i>
                            </span>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="p-3 rounded bg-white" style={{ maxWidth: "70%" }}>
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
                    <Row>
                      <Col>
                        <div className="position-relative">
                          <Input
                            type="text"
                            className="form-control chat-input"
                            placeholder="Mesajınızı yazın..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                          />
                        </div>
                      </Col>
                      <Col xs="auto">
                        <Button
                          color="primary"
                          onClick={handleSendMessage}
                          disabled={inputMessage.trim() === ""}
                        >
                          <i className="bx bx-send font-size-16 align-middle"></i>
                        </Button>
                      </Col>
                    </Row>
                  </div>
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

        .chat-input {
          padding-right: 50px;
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

export default Chatbot;
