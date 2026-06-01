"""
SQLite Database setup using SQLAlchemy async
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./database/tutor.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    topic = Column(String(100), nullable=True)
    sources = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ExamResult(Base):
    __tablename__ = "exam_results"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, default=10)
    correct_answers = Column(Integer, nullable=False)
    weak_areas = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    chunk_count = Column(Integer, default=0)
    topics = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    """Create all tables."""
    os.makedirs("./database", exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency to get DB session."""
    async with AsyncSessionLocal() as session:
        yield session
