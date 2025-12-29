# FastAPI Admin Panel Server

Bu sunucu React admin panelini serve eder.

## Kurulum

```bash
# Virtual environment oluştur (opsiyonel ama önerilen)
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# veya Windows'ta: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt
```

## Çalıştırma

### Geliştirme (Local)
```bash
python main.py
```

Tarayıcıda: http://localhost:8000

### Production (VPS/Hostinger)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## VPS'e Deploy

1. **Dosyaları VPS'e yükle:**
```bash
scp -r FastAPI-Server root@your-vps-ip:/var/www/
scp -r Admin/dist root@your-vps-ip:/var/www/Admin/
```

2. **VPS'te çalıştır:**
```bash
cd /var/www/FastAPI-Server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

3. **Nginx ile reverse proxy (Opsiyonel):**
```nginx
server {
    listen 80;
    server_name admin.inferaworld.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Systemd ile Otomatik Başlatma

`/etc/systemd/system/admin-panel.service` dosyası oluştur:

```ini
[Unit]
Description=Admin Panel FastAPI
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/FastAPI-Server
ExecStart=/usr/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Aktif et:
```bash
sudo systemctl enable admin-panel
sudo systemctl start admin-panel
```
