# 🚀 Legislation Chatbot - Hızlı Başlangıç

## ✅ Tamamlanan Kurulum

### Backend (Railway)
- ✅ API Çalışıyor: https://legislationrag-production.up.railway.app
- ✅ 96 PDF yüklü (KANUN, YÖNETMELİK, TEBLİĞ)
- ✅ Health Check: `{"status":"healthy"}`

### Frontend (Admin Panel)
- ✅ Environment Variable: `VITE_LEGISLATION_API_URL`
- ✅ Route: `/legislation-chatbot`
- ✅ Menu: Chatbot → Mevzuat Chatbot (96 PDF badge)
- ✅ API Service: `src/services/legislationApi.js`
- ✅ Component: `src/pages/Chatbot/LegislationChatbot.jsx`

---

## 🎯 Kullanım

### 1. Development Server'ı Başlatın

```bash
cd /Users/selcuk/Desktop/admin_pan/Admin
npm run dev
```

### 2. Tarayıcıda Açın

```
http://localhost:5173
```

### 3. Legislation Chatbot'a Gidin

**Sol Menü:**
```
Chatbot → Mevzuat Chatbot (96 PDF)
```

Veya **Direkt URL:**
```
http://localhost:5173/legislation-chatbot
```

---

## 🧪 Test Senaryoları

### Test 1: API Bağlantısı
Sayfa yüklendiğinde:
- ✅ Sağ üstte yeşil "API Bağlı" göstergesi görünmeli
- ✅ Bot'tan hoş geldin mesajı gelmeli

### Test 2: Basit Soru
**Soru:** "İşveren nedir?"

**Beklenen:**
- Kanun tanımı
- Madde referansı
- Kaynak listesi

### Test 3: Karmaşık Soru
**Soru:** "İş güvenliği uzmanının görev ve sorumlulukları nelerdir?"

**Beklenen:**
- Detaylı açıklama
- Multiple madde referansları
- Kaynak PDF dosyaları

### Test 4: Kapsam Dışı Soru
**Soru:** "Bugün hava nasıl?"

**Beklenen:**
- "Bu soru İSG mevzuatı ile ilgili değildir" uyarısı

---

## 📊 Mimari

```
┌──────────────┐
│   Browser    │
│ localhost:   │
│   5173       │
└──────┬───────┘
       │
       │ Vite Dev Server
       │
┌──────▼───────┐
│ React Admin  │
│   Panel      │
└──────┬───────┘
       │
       │ HTTPS API Calls
       │
┌──────▼────────────────────────┐
│ Railway Backend               │
│ legislationrag-production...  │
│                               │
│ - Flask API                   │
│ - 96 PDFs                     │
│ - ChromaDB Vector Store       │
│ - OpenRouter LLM              │
└───────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Sorun: API Bağlanamıyor

**Kontrol:**
```bash
curl https://legislationrag-production.up.railway.app/health
```

**Çözüm:**
1. Railway servisinin çalıştığını kontrol edin
2. `.env` dosyasında `VITE_LEGISLATION_API_URL` doğru mu?
3. Browser console'da CORS hatası var mı?

### Sorun: Menüde Göremiyorum

**Kontrol:**
- `src/components/VerticalLayout/SidebarContent.jsx` → "Mevzuat Chatbot" var mı?
- `src/routes/index.jsx` → `/legislation-chatbot` route var mı?

**Çözüm:**
```bash
git pull origin main
npm run dev
```

### Sorun: Cevap Gelmiyor

**Kontrol:**
1. Network tab'de `/api/ask` request'i gidiyor mu?
2. Response status code nedir? (200 OK olmalı)
3. Browser console'da hata var mı?

**Railway Logs:**
- Railway Dashboard → Deployments → Latest → Logs

---

## 📁 Önemli Dosyalar

### Frontend
```
Admin/
├── .env                                    # Environment variables
├── src/
│   ├── routes/index.jsx                   # Route tanımları
│   ├── components/
│   │   └── VerticalLayout/
│   │       └── SidebarContent.jsx         # Sol menu
│   ├── pages/
│   │   └── Chatbot/
│   │       └── LegislationChatbot.jsx     # Ana component
│   └── services/
│       └── legislationApi.js              # API servisi
```

### Backend (Railway)
```
Legislation_RAG/
├── app.py                    # Flask API
├── document_loader.py        # PDF loader
├── rag_pipeline.py          # RAG logic
├── requirements.txt         # Dependencies
└── data/
    ├── KANUN VE YÖNETMELİKLER/
    └── TEBLİĞ/
```

---

## 🎨 UI Özelleştirme

### Renk Değiştirme
`src/pages/Chatbot/LegislationChatbot.css`:
```css
.user-message .message-content {
  background: #556ee6;  /* Değiştir */
  color: white;
}
```

### Badge Değiştirme
`src/components/VerticalLayout/SidebarContent.jsx`:
```jsx
<span className="badge rounded-pill bg-warning ms-2">96 PDF</span>
```

---

## 📞 Destek

- **Backend Issues:** Railway Dashboard → Logs
- **Frontend Issues:** Browser Console (F12)
- **API Issues:** Network Tab → XHR/Fetch

---

**✨ Kurulum Tamamlandı! Chatbot hazır!**

Son Test:
```bash
# Terminal 1
cd Admin && npm run dev

# Terminal 2
open http://localhost:5173/legislation-chatbot
```
