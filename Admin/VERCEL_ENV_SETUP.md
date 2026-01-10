# VERCEL ENVIRONMENT VARIABLES KURULUMU

## ⚠️ ŞU AN SORUN: Boş gradient ekran
**NEDEN:** Clerk environment variable'ları Vercel'de yok, ClerkProvider çalışamıyor

## ✅ ÇÖZÜM: 6 Environment Variable Ekleyin

### Adım 1: Vercel Dashboard'a Gidin
https://vercel.com/dashboard

### Adım 2: Projenizi Seçin
- "admin-pan" veya benzeri proje adı

### Adım 3: Settings → Environment Variables
Sol menüden **Settings** → **Environment Variables** sekmesi

### Adım 4: Her Bir Variable'ı Ekleyin

**Add New** butonuna basarak şunları ekleyin:

#### 1. VITE_CLERK_PUBLISHABLE_KEY
```
Name: VITE_CLERK_PUBLISHABLE_KEY
Value: pk_test_dW5pcXVlLWxpb25lc3MtNjYuY2xlcmsuYWNjb3VudHMuZGV2JA
Environment: Production, Preview, Development (ÜÇÜ DE İŞARETLİ)
```

#### 2. CLERK_SECRET_KEY
```
Name: CLERK_SECRET_KEY
Value: sk_test_Eu7i3ZxfbSNkWOd0B2fgg1qlLynz4bDz6TrgJTE3FP
Environment: Production, Preview, Development (ÜÇÜ DE İŞARETLİ)
```

#### 3. VITE_CLERK_SIGN_IN_URL
```
Name: VITE_CLERK_SIGN_IN_URL
Value: /sign-in
Environment: Production, Preview, Development (ÜÇÜ DE İŞARETLİ)
```

#### 4. VITE_CLERK_SIGN_UP_URL
```
Name: VITE_CLERK_SIGN_UP_URL
Value: /sign-up
Environment: Production, Preview, Development (ÜÇÜ DE İŞARETLİ)
```

#### 5. VITE_CLERK_AFTER_SIGN_IN_URL
```
Name: VITE_CLERK_AFTER_SIGN_IN_URL
Value: /dashboard
Environment: Production, Preview, Development (ÜÇÜ DE İŞARETLİ)
```

#### 6. VITE_CLERK_AFTER_SIGN_UP_URL
```
Name: VITE_CLERK_AFTER_SIGN_UP_URL
Value: /dashboard
Environment: Production, Preview, Development (ÜÇÜ DE İŞARETLİ)
```

### Adım 5: MANUEL REDEPLOY (ÖNEMLİ!)

Variable'ları ekledikten sonra:

1. **Deployments** sekmesine gidin
2. En üstteki (son) deployment'a tıklayın
3. Sağ üstte **...** (üç nokta) menüsüne basın
4. **Redeploy** seçin
5. ⚠️ **"Use existing Build Cache"** kutusunu **KALDIRIN** (unchecked olmalı)
6. **Redeploy** butonuna basın

### Adım 6: Build Bekleyin
2-3 dakika sonra https://cpanel.inferaworld.com'da Clerk UI görünecek

---

## 🔍 Kontrol: Variable'lar Doğru Eklendi mi?

Vercel Dashboard → Settings → Environment Variables sayfasında:

✅ 6 değişken görünmeli
✅ Her birinin yanında "Production, Preview, Development" yazmali
✅ VITE_CLERK_PUBLISHABLE_KEY "pk_test_..." ile başlamalı
✅ CLERK_SECRET_KEY "sk_test_..." ile başlamalı

---

## ❌ Şu Anda Neden Çalışmıyor?

```javascript
// main.jsx içinde:
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
// ↑ Bu undefined oluyor çünkü Vercel'de variable yok

<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
// ↑ undefined publishableKey ile ClerkProvider başlatılamaz
// ↑ SignIn componenti render edilemiyor
// ↑ Sadece gradient background görünüyor
```

**Çözüm:** Variable'ları ekleyin + Cache kapalı redeploy yapın!
