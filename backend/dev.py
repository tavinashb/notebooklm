#!/usr/bin/env python3
"""
Development server for NotebookLM Clone backend
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Set default environment variables for development
    os.environ.setdefault("DATABASE_URL", "sqlite:///./notebooklm.db")
    os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production")
    os.environ.setdefault("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
    os.environ.setdefault("UPLOAD_DIR", "./uploads")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
        log_level="info"
    )