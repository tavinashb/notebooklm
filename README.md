# NotebookLM Clone - Multi-Agent AI Application

A full-stack AI application similar to Google NotebookLM, built with a multi-agent architecture for document ingestion, semantic search, and LLM-powered question-answering with citations.

## 🏗️ Architecture

### Multi-Agent System

1. **Parser Agent** - Handles document processing (PDF, DOCX, TXT, URLs)
2. **Embedding Agent** - Converts text chunks to vector embeddings
3. **Retriever Agent** - Performs semantic search over vector database
4. **RAG Prompting Agent** - Generates answers with LLM integration and citations
5. **Chat History Agent** - Manages conversation sessions and context

### Tech Stack

**Backend (FastAPI + Python)**
- FastAPI for REST API
- SQLAlchemy for database ORM
- ChromaDB for vector storage
- Sentence Transformers for embeddings
- OpenAI/Anthropic API integration
- JWT authentication

**Frontend (React + TypeScript)**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Query for state management
- Zustand for auth state
- React Router for navigation

**Database & Storage**
- SQLite/PostgreSQL for metadata
- ChromaDB for vector embeddings
- Local file storage for documents

## 🚀 Features

- **Document Upload**: Support for PDF, DOCX, TXT files and web URLs
- **Semantic Search**: AI-powered search across all documents
- **Question Answering**: Get answers with source citations
- **Chat Sessions**: Threaded conversations with context
- **Document Management**: Upload, view, and organize documents
- **User Authentication**: Secure login and user management

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd notebooklm-clone
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install:all
```

### 3. Environment Setup

Create environment files:
```bash
# Backend environment
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:
```env
# Required for LLM integration
OPENAI_API_KEY=your_openai_api_key_here

# Optional - for production
DATABASE_URL=postgresql://username:password@localhost:5432/notebooklm_db
SECRET_KEY=your_secret_key_here
```

### 4. Development Setup

**Option 1: Run both frontend and backend together**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
cd backend
python dev.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📚 API Documentation

Once the backend is running, visit:
- API Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## 🎯 Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Documents**: Add PDF, DOCX, TXT files or web URLs
3. **Ask Questions**: Use the chat interface to query your documents
4. **View Citations**: See source references for all answers
5. **Search**: Use semantic search to find relevant content
6. **Manage**: Organize documents and chat sessions

## 🔧 Configuration

### Backend Configuration

Key environment variables in `backend/.env`:

```env
# Database
DATABASE_URL=sqlite:///./notebooklm.db

# API Keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Security
SECRET_KEY=your_secret_key
JWT_EXPIRE_MINUTES=30

# Storage
CHROMA_PERSIST_DIRECTORY=./chroma_db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend Configuration

The frontend automatically proxies API requests to the backend during development.

## 🧪 Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python dev.py

# Run tests (when implemented)
pytest
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## 📁 Project Structure

```
notebooklm-clone/
├── backend/
│   ├── app/
│   │   ├── agents/          # Multi-agent system
│   │   ├── models/          # Database models
│   │   ├── routers/         # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── requirements.txt
│   └── dev.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── stores/          # State management
│   │   └── types/           # TypeScript types
│   └── package.json
└── package.json
```

## 🚀 Deployment

### Backend Deployment

1. Set production environment variables
2. Use a production WSGI server like Gunicorn:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment

1. Build the frontend:
```bash
cd frontend && npm run build
```

2. Serve the `dist` folder with a web server

### Docker Deployment (Optional)

Docker configurations can be added for containerized deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Roadmap

- [ ] Real-time collaborative Q&A sessions
- [ ] Advanced document processing (images, tables)
- [ ] Integration with more LLM providers
- [ ] Document version control
- [ ] Advanced analytics and insights
- [ ] Mobile app support
- [ ] API rate limiting and quotas
- [ ] Advanced search filters
- [ ] Document annotations and highlights

## 🐛 Known Issues

- Large file uploads may timeout (increase server timeout)
- Vector database rebuilds on restart with SQLite
- Limited file type support (expanding)

## 📞 Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details

---

**Built with ❤️ using modern AI and web technologies**
