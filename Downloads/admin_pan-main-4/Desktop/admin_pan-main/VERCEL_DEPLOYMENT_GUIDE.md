# Vercel Deployment Configuration Guide

## 🔧 Root Directory Sorunu - ÇÖZÜLDÜ

### Problem
```
The specified Root Directory "Admin" does not exist
```

### Çözüm

#### Adım 1: Vercel Dashboard'da

1. **Project Settings** → **General** sayfasına gidin
2. **Root Directory** bölümünde:
   - Eğer "Admin" yazılıysa, **boş bırakın** (kaldırın)
   - Veya `.` (nokta) yazın

#### Adım 2: Build & Output Settings

- **Build Command**: `cd Admin && npm run build`
- **Output Directory**: `Admin/dist`
- **Install Command**: `npm install && cd Admin && npm install`

#### Adım 3: Environment Variables (varsa)

Tüm gerekli environment variables'ları kopyalayın ve ekleyin.

### Vercel.json Configuration

Root dizinde `vercel.json` dosyası:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "Admin/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "Admin/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### GitHub'da Push Edildi

- ✅ `vercel.json` oluşturuldu
- ✅ Root `package.json` oluşturuldu
- ✅ GitHub'a commit ve push edildi

### Sonra Yapılacaklar

1. Vercel Dashboard'da **Redeploy** butonuna tıklayın
2. Build loglarını kontrol edin
3. Eğer API hataları varsa, backend URL'ini ayarlayın

---

**Ek Bilgi:**
- Admin klasörü `dist/` olarak build edilir
- Vercel bunu serve eder

