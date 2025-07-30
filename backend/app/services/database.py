from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

from app.models.base import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./notebooklm.db")

# For SQLite, we need to handle it differently
if DATABASE_URL.startswith("sqlite"):
    # Sync engine for SQLite
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    async def init_db():
        Base.metadata.create_all(bind=engine)
else:
    # Async engine for PostgreSQL
    async_engine = create_async_engine(DATABASE_URL)
    AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)
    
    async def get_db():
        async with AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
    
    async def init_db():
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)