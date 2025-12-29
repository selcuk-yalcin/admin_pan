from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

# Admin panelin build çıktısını (dist) serve et
admin_dist_path = os.path.join(os.path.dirname(__file__), "../Admin/dist")

# Static dosyalar (CSS, JS, resimler)
app.mount("/assets", StaticFiles(directory=os.path.join(admin_dist_path, "assets")), name="assets")

# Tüm route'lar için index.html döndür (SPA için gerekli)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # Eğer dosya varsa onu döndür
    file_path = os.path.join(admin_dist_path, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Yoksa index.html döndür (React Router için)
    return FileResponse(os.path.join(admin_dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
