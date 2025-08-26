from fastapi import FastAPI
from fastapi.responses import JSONResponse
import os

app = FastAPI(title="Helios Agent Core", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

# 未来将在此添加核心API端点：
# @app.post("/api/chat")
# @app.post("/api/echo")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)