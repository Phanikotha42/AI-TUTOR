# 🎓 AI Tutor — Intelligent Learning Platform

A full-stack AI Tutor application with hybrid RAG retrieval, local LLM (Ollama), exam system, and analytics.

## 🏗️ Architecture

```
User → React Frontend → FastAPI Backend → Hybrid RAG
                                        ├── ChromaDB (vector search)
                                        ├── PDF Documents (semantic search)
                                        ├── Wikipedia API
                                        ├── Arxiv papers
                                        └── DuckDuckGo web search
                                              ↓
                                          Ollama (llama3/mistral)
                                              ↓
                                        Structured AI Response
```

## 🚀 Quick Start

### Ports (important)

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | React UI |
| **Backend** | http://localhost:8000 | FastAPI API |
| **Ollama** | http://localhost:11434 | Local LLM (used by backend only) |

Ollama and the backend use **different ports**. The frontend talks to the backend on **8000**; the backend talks to Ollama on **11434**.

### 1. Ollama Setup
```bash
# Install Ollama: https://ollama.ai
# On Windows, Ollama usually runs automatically after install.
ollama pull llama3        # Primary model
ollama pull mistral       # Optional alternative
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows — or: cp .env.example .env
python app.py
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Windows (from project root):** `.\start-backend.ps1`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:5173
```

**Windows (from project root):** `.\start-frontend.ps1`

### Troubleshooting

- **Blank / broken frontend:** Run `npm run build` in `frontend/` — a missing Lucide icon breaks the dev bundle.
- **Backend exits on startup (Windows):** Fixed in `app.py` (UTF-8 console + ASCII startup logs).
- **"Ollama is not running":** Start Ollama, then `ollama pull llama3`. Confirm http://localhost:11434/api/tags returns JSON.
- **Re-installing deps every time:** Use the existing `backend\venv` and `frontend\node_modules`; only re-run `pip install` / `npm install` after pulling dependency changes.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/` | Chat with hybrid RAG |
| GET | `/chat/stream` | Streaming chat (SSE) |
| GET | `/chat/history` | Get chat history |
| DELETE | `/chat/history` | Clear chat history |
| POST | `/upload/` | Upload PDF |
| GET | `/upload/documents` | List documents |
| DELETE | `/upload/documents/{id}` | Delete document |
| GET | `/exam/topics` | Get exam topics |
| POST | `/exam/generate` | Generate MCQ exam |
| POST | `/exam/submit` | Submit & evaluate exam |
| GET | `/analytics/` | Get analytics data |
| POST | `/web-search/` | Search web sources |

## ✨ Features

- **AI Chat** — Ask questions about AI/ML topics with structured responses
- **Hybrid RAG** — Retrieves from PDFs, Wikipedia, Arxiv, and web simultaneously
- **PDF Upload** — Upload lecture notes, textbooks, papers for semantic search
- **Exam Mode** — AI-generated MCQs with timer, scoring, and weak area analysis
- **Analytics** — Learning progress dashboard with charts
- **Offline Mode** — Works without internet using PDFs + Ollama

## 🧠 Supported Topics
Machine Learning, Deep Learning, NLP, CNNs, RNNs, LSTMs, Transformers, 
Generative AI, Computer Vision, Reinforcement Learning, AI Ethics, Python for ML, 
AI Agents, Robotics, LLMs, and all AI-related subjects.

## 🔧 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI, Python 3.10+
- **AI**: Ollama (llama3/mistral), sentence-transformers
- **Vector DB**: ChromaDB
- **PDF**: pypdf
- **Web**: DuckDuckGo, Wikipedia API, Arxiv API, BeautifulSoup
- **Database**: SQLite + SQLAlchemy async
