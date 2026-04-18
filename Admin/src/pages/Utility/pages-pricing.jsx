import React, { useState } from "react"
import { Container, Row, Col } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb"

const PagesPricing = () => {
  document.title = "Fiyatlandırma | Infera World - İSG Admin Paneli";
  const [billingCycle] = useState("monthly");

  const plans = [
    {
      id: "free",
      title: "Beta Free",
      badge: "BETA",
      badgeColor: "#10b981",
      description: "Mevzuat Asistanı'nı ücretsiz deneyin",
      price: "0",
      originalPrice: null,
      duration: billingCycle === "monthly" ? "Ay" : "Yıl",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      active: true,
      recommended: false,
      buttonText: "Şu An Aktif",
      buttonStyle: "active",
      features: [
        { title: "Mevzuat Asistanı (Chatbot)", included: true, highlight: true },
        { title: "Aylık 50 Soru Hakkı", included: true },
        { title: "Kaynak Gösterimi", included: true },
        { title: "Sohbet Geçmişi", included: true },
        { title: "Risk Değerlendirmesi", included: false, coming: true },
        { title: "Kök Neden Analizi", included: false, coming: true },
        { title: "Dosya Yöneticisi", included: false },
        { title: "Öncelikli Destek", included: false },
      ],
    },
    {
      id: "pro",
      title: "Profesyonel",
      badge: null,
      description: "Tam kapsamlı İSG yönetim araçları",
      price: "---",
      originalPrice: "---",
      duration: billingCycle === "monthly" ? "Ay" : "Yıl",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      active: false,
      recommended: true,
      buttonText: "Çok Yakında",
      buttonStyle: "coming",
      features: [
        { title: "Mevzuat Asistanı (Chatbot)", included: true, highlight: true },
        { title: "Aylık 250 Soru Hakkı", included: true, highlight: true },
        { title: "Kaynak Gösterimi", included: true },
        { title: "Sohbet Geçmişi", included: true },
        { title: "Risk Değerlendirmesi", included: true, highlight: true, badge: "AI" },
        { title: "Kök Neden Analizi", included: true, highlight: true, badge: "AI" },
        { title: "Dosya Yöneticisi", included: true },
        { title: "Öncelikli Destek", included: true },
      ],
    },
    {
      id: "enterprise",
      title: "Kurumsal",
      badge: null,
      description: "Büyük ölçekli firmalar için özel çözümler",
      price: "İletişime Geçin",
      originalPrice: null,
      duration: "",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
      active: false,
      recommended: false,
      buttonText: "Çok Yakında",
      buttonStyle: "coming",
      features: [
        { title: "Profesyonel'deki her şey", included: true },
        { title: "Sınırsız Soru Hakkı", included: true, highlight: true },
        { title: "Çoklu Kullanıcı Desteği", included: true },
        { title: "API Erişimi", included: true },
        { title: "Özel Mevzuat Eğitimi", included: true },
        { title: "Kurumsal SLA & Destek", included: true },
        { title: "On-Premise Kurulum", included: true },
        { title: "Özel Entegrasyonlar", included: true },
      ],
    },
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Utility" breadcrumbItem="Fiyatlandırma" />

          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center mb-5">
                <div style={{
                  display:'inline-flex',alignItems:'center',gap:8,
                  background:'linear-gradient(135deg,#ecfdf5,#d1fae5)',
                  padding:'6px 16px',borderRadius:20,marginBottom:16,
                  border:'1px solid #a7f3d0'
                }}>
                  <span style={{fontSize:12,fontWeight:700,color:'#059669',letterSpacing:'.5px'}}>BETA PROGRAMI AKTİF</span>
                </div>
                <h4 style={{fontWeight:700,color:'#0f172a',fontSize:24}}>İSG Yönetim Planınızı Seçin</h4>
                <p className="text-muted" style={{maxWidth:500,margin:'8px auto 0',lineHeight:1.7}}>
                  Beta sürecinde Mevzuat Asistanı'nı <strong>ücretsiz</strong> kullanın. 
                  Yapay zeka destekli İSG araçlarımız yakında aktif olacak.
                </p>
              </div>
            </Col>
          </Row>

          <Row className="justify-content-center" style={{gap:0}}>
            {plans.map((plan) => (
              <Col xl={4} md={6} key={plan.id} style={{marginBottom:24}}>
                <div style={{
                  background: plan.recommended ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : '#fff',
                  borderRadius: 20,
                  border: plan.active ? '2px solid #10b981' : plan.recommended ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  padding: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: plan.buttonStyle === 'coming' ? 0.75 : 1,
                  transition: 'all .3s',
                  boxShadow: plan.active ? '0 8px 30px rgba(16,185,129,.15)' : plan.recommended ? '0 8px 30px rgba(99,102,241,.15)' : '0 2px 12px rgba(0,0,0,.04)',
                }}>
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <div style={{
                      position:'absolute',top:16,right:16,
                      background:'linear-gradient(135deg,#6366f1,#4f46e5)',
                      color:'#fff',fontSize:10,fontWeight:700,
                      padding:'4px 12px',borderRadius:20,letterSpacing:'.5px',
                    }}>ÖNERİLEN</div>
                  )}

                  <div style={{padding:'28px 28px 0'}}>
                    {/* Header */}
                    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
                      <div style={{
                        width:52,height:52,borderRadius:14,
                        background: plan.active ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)' : plan.recommended ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : '#f8fafc',
                        display:'flex',alignItems:'center',justifyContent:'center',
                      }}>
                        {plan.icon}
                      </div>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <h5 style={{margin:0,fontWeight:700,color:'#0f172a',fontSize:18}}>{plan.title}</h5>
                          {plan.badge && (
                            <span style={{
                              background: plan.badgeColor || '#6366f1',
                              color:'#fff',fontSize:9,fontWeight:800,
                              padding:'2px 8px',borderRadius:6,letterSpacing:'.8px',
                            }}>{plan.badge}</span>
                          )}
                        </div>
                        <p style={{margin:0,fontSize:12.5,color:'#64748b',marginTop:2}}>{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{padding:'20px 0',borderTop:'1px solid rgba(0,0,0,.06)',borderBottom:'1px solid rgba(0,0,0,.06)'}}>
                      {typeof plan.price === 'string' && plan.price.includes('İletişim') ? (
                        <h2 style={{margin:0,fontWeight:800,color:'#0f172a',fontSize:22}}>{plan.price}</h2>
                      ) : (
                        <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                          {plan.originalPrice && (
                            <span style={{fontSize:16,color:'#94a3b8',textDecoration:'line-through',marginRight:4}}>₺{plan.originalPrice}</span>
                          )}
                          <span style={{fontSize:14,fontWeight:600,color:'#64748b'}}>₺</span>
                          <h2 style={{margin:0,fontWeight:800,color:'#0f172a',fontSize:36,lineHeight:1}}>{plan.price}</h2>
                          {plan.duration && <span style={{fontSize:13,color:'#64748b',marginLeft:2}}>/ {plan.duration}</span>}
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div style={{padding:'20px 0'}}>
                      <button style={{
                        width:'100%',padding:'12px',borderRadius:12,border:'none',
                        fontSize:14,fontWeight:700,cursor: plan.buttonStyle === 'coming' ? 'default' : 'pointer',
                        background: plan.active ? '#10b981' : plan.buttonStyle === 'coming' ? '#e2e8f0' : '#6366f1',
                        color: plan.buttonStyle === 'coming' ? '#94a3b8' : '#fff',
                        transition:'all .2s',
                        ...(plan.buttonStyle === 'coming' ? {} : {boxShadow:'0 4px 14px rgba(0,0,0,.1)'}),
                      }}>
                        {plan.active && <span style={{marginRight:6}}>✓</span>}
                        {plan.buttonText}
                      </button>
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{padding:'0 28px 28px'}}>
                    <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'.5px',marginBottom:14,textTransform:'uppercase'}}>Özellikler</p>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                          {f.included ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={f.highlight ? '#10b981' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : f.coming ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          )}
                          <span style={{
                            fontSize:13.5,
                            color: f.included ? '#334155' : f.coming ? '#92400e' : '#94a3b8',
                            fontWeight: f.highlight ? 600 : 400,
                            textDecoration: !f.included && !f.coming ? 'line-through' : 'none',
                          }}>
                            {f.title}
                          </span>
                          {f.badge && (
                            <span style={{
                              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                              color:'#fff',fontSize:9,fontWeight:800,
                              padding:'1px 6px',borderRadius:4,letterSpacing:'.5px',
                            }}>{f.badge}</span>
                          )}
                          {f.coming && (
                            <span style={{
                              background:'#fef3c7',color:'#92400e',fontSize:9,
                              fontWeight:700,padding:'2px 6px',borderRadius:4,
                            }}>YAKINDA</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Bottom note */}
          <Row className="justify-content-center mt-2 mb-4">
            <Col lg={8}>
              <div style={{
                textAlign:'center',padding:'20px 24px',
                background:'#f8fafc',borderRadius:16,
                border:'1px solid #e2e8f0',
              }}>
                <p style={{margin:0,fontSize:13,color:'#64748b',lineHeight:1.7}}>
                  <strong>Beta Programı:</strong> Şu anda beta sürecindeyiz. Mevzuat Asistanı ücretsiz olarak kullanılabilir.
                  Risk Değerlendirmesi ve Kök Neden Analizi modülleri yapay zeka entegrasyonu ile yakında aktif olacaktır.
                </p>
              </div>
            </Col>
          </Row>

        </Container>
      </div>
    </React.Fragment>
  );
};

export default PagesPricing;
