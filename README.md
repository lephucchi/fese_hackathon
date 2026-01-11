<p align="center">
  <img src="frontend/public/logo_new-removebg-preview-nobg.svg" alt="MacroInsight Logo" width="120" height="120">
</p>

<h1 align="center">🧠 MacroInsight</h1>

<p align="center">
  <strong>Nền tảng trí tuệ nhân tạo cho tài chính & pháp lý Việt Nam</strong>
</p>

<p align="center">
  <a href="#features">Tính năng</a> •
  <a href="#architecture">Kiến trúc</a> •
  <a href="#quick-start">Bắt đầu</a> •
  <a href="#tech-stack">Công nghệ</a> •
  <a href="#api">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/LangGraph-0.2+-00C805?style=for-the-badge" alt="LangGraph">
  <img src="https://img.shields.io/badge/Supabase-pgvector-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Routing_Accuracy-100%25-success?style=flat-square" alt="Accuracy">
  <img src="https://img.shields.io/badge/Documents-1.5M+-blue?style=flat-square" alt="Documents">
  <img src="https://img.shields.io/badge/Latency-<500ms-green?style=flat-square" alt="Latency">
  <img src="https://img.shields.io/badge/License-UEL_Final_Report-orange?style=flat-square" alt="License">
</p>

---

## 📋 Tổng quan

**MacroInsight** là nền tảng RAG (Retrieval-Augmented Generation) đa chỉ mục được thiết kế cho lĩnh vực tài chính và pháp luật Việt Nam. Hệ thống kết hợp định tuyến ngữ nghĩa thông minh, truy xuất song song từ nhiều nguồn dữ liệu chuyên biệt, và sinh câu trả lời có trích dẫn nguồn.

### Điểm nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| 🎯 **Định tuyến 100%** | Hybrid semantic + rule-based routing với độ chính xác tuyệt đối |
| 📚 **4 Chỉ mục chuyên biệt** | Legal, News, Financial, Glossary với 1.5M+ documents |
| ⚡ **Phản hồi nhanh** | ~5ms routing, <500ms end-to-end |
| 📝 **Trích dẫn nguồn** | Mọi thông tin đều liên kết đến tài liệu gốc |
| 🔄 **Phân rã câu hỏi** | Tự động phân tích câu hỏi phức tạp |
| 🌐 **Fallback thông minh** | Tự động tìm kiếm web khi cần thông tin mới |

---

## ✨ Tính năng chính <a id="features"></a>

### 🤖 AI Chat với Streaming

Chatbot AI thông minh với hiển thị quá trình suy nghĩ real-time:
- Streaming response với thinking steps
- Context cá nhân hóa từ danh mục đầu tư
- Lịch sử hội thoại đa phiên
- Trích dẫn nguồn inline

### 📰 Swipe News Discovery

Khám phá tin tức theo phong cách Tinder:
- Swipe phải để lưu tin quan tâm
- Swipe trái để bỏ qua
- Tin đã lưu trở thành context cho AI Chat
- Phân tích sentiment tự động

### 📊 Portfolio Tracking

Quản lý danh mục đầu tư cá nhân:
- Thêm/xóa mã cổ phiếu
- Biểu đồ phân bổ tài sản
- Tin tức liên quan đến danh mục
- Đồng bộ context với AI Chat

### 🔐 Xác thực & Bảo mật

- OAuth 2.0 với Google/GitHub
- JWT + Refresh Token rotation
- Rate limiting & Query Guard
- HTTPS với SSL certificates

---

## 🏗️ Kiến trúc hệ thống <a id="architecture"></a>

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 15)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  AI Chat    │  │ Swipe News  │  │  Portfolio  │  │    Dashboard        │ │
│  │  Streaming  │  │  Discovery  │  │   Tracker   │  │    Analytics        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │ REST API / Server-Sent Events
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (FastAPI + LangGraph)                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         RAG Pipeline (LangGraph)                        ││
│  │                                                                         ││
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐ ││
│  │   │ Semantic │ → │  Query   │ → │ Parallel │ → │ CAF Generation   │ ││
│  │   │  Router  │    │Decomposer│    │Retriever │    │   + Citations    │ ││
│  │   └──────────┘    └──────────┘    └────┬─────┘    └──────────────────┘ ││
│  │        │                               │                                ││
│  │        │ 100% accuracy                 │ Multi-index                    ││
│  │        ▼                               ▼                                ││
│  │   ┌──────────────────────────────────────────────────────────────────┐ ││
│  │   │                    Coverage Check (Confidence < 0.4)             │ ││
│  │   └───────────────────────────────┬──────────────────────────────────┘ ││
│  │                                   │                                     ││
│  │              ┌────────────────────┴────────────────────┐                ││
│  │              │ LOW COVERAGE                             │ HIGH          ││
│  │              ▼                                          ▼               ││
│  │   ┌──────────────────────┐                    ┌─────────────────────┐  ││
│  │   │   External Search    │                    │   Direct Answer     │  ││
│  │   │  ┌────────┐ ┌──────┐ │                    │   from RAG Cache    │  ││
│  │   │  │ Google │ │Tavily│ │                    │                     │  ││
│  │   │  └────────┘ └──────┘ │                    └─────────────────────┘  ││
│  │   └──────────────────────┘                                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐│
│  │  Auth Service │  │ Chat Service  │  │Market Service │  │Portfolio Svc  ││
│  │  JWT + OAuth  │  │  3-Tier Cache │  │ News + Swipe  │  │  CRUD + Sync  ││
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           Security Layer                                ││
│  │   QueryGuard (Prompt Injection) • Rate Limiter • CORS • SSL/TLS        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└───────────────────┬─────────────────────────────────────────┬───────────────┘
                    │                                         │
     ┌──────────────▼──────────────┐           ┌──────────────▼──────────────┐
     │      DATA LAYER             │           │       AI/ML LAYER           │
     │                             │           │                             │
     │  ┌────────────────────────┐ │           │  ┌────────────────────────┐ │
     │  │   Supabase + pgvector  │ │           │  │    Gemini 2.0 Flash    │ │
     │  │  ┌──────┐ ┌──────────┐ │ │           │  │    (Primary LLM)       │ │
     │  │  │Legal │ │Financial │ │ │           │  └────────────────────────┘ │
     │  │  │ 15K  │ │   1M     │ │ │           │  ┌────────────────────────┐ │
     │  │  └──────┘ └──────────┘ │ │           │  │     BAAI/bge-m3        │ │
     │  │  ┌──────┐ ┌──────────┐ │ │           │  │   (Embeddings)         │ │
     │  │  │ News │ │ Glossary │ │ │           │  └────────────────────────┘ │
     │  │  │ 500K │ │   3K     │ │ │           │  ┌────────────────────────┐ │
     │  │  └──────┘ └──────────┘ │ │           │  │   OpenAI GPT-4o        │ │
     │  └────────────────────────┘ │           │  │    (Fallback LLM)      │ │
     │                             │           │  └────────────────────────┘ │
     │  ┌────────────────────────┐ │           └─────────────────────────────┘
     │  │    Redis 7.4           │ │
     │  │   Session + RAG Cache  │ │
     │  └────────────────────────┘ │
     └─────────────────────────────┘
```

### Vector Indices

| Index | Documents | Mô tả |
|-------|-----------|-------|
| **Legal** | 15,000 | Văn bản luật, nghị định, thông tư |
| **Financial** | 1,000,000 | Báo cáo tài chính, dữ liệu công ty |
| **News** | 500,000 | Tin tức thị trường, phân tích |
| **Glossary** | 3,000 | Thuật ngữ tài chính - pháp lý |

---

## 🛠️ Tech Stack <a id="tech-stack"></a>

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| **API Framework** | FastAPI | 0.100+ |
| **Pipeline Orchestration** | LangGraph | 0.2+ |
| **Vector Database** | Supabase + pgvector | Latest |
| **Cache** | Redis | 7.4 |
| **Auth** | JWT + OAuth 2.0 | - |
| **Embeddings** | BAAI/bge-m3 | 1024-dim |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Next.js | 15.x |
| **Language** | TypeScript | 5.x |
| **Styling** | CSS Variables | - |
| **Animation** | Framer Motion | 11.x |
| **Charts** | Recharts | 2.x |

### AI/ML
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Primary LLM** | Gemini 2.0 Flash | Generation |
| **Fallback LLM** | OpenAI GPT-4o | Complex queries |
| **Embeddings** | BAAI/bge-m3 | Semantic search |
| **Web Search** | Google Search API | Real-time info |

### Infrastructure
| Component | Technology |
|-----------|------------|
| **Containerization** | Docker + Docker Compose |
| **Reverse Proxy** | Nginx |
| **SSL** | Let's Encrypt |
| **Hosting** | VPS / Cloud |

---

## 🚀 Bắt đầu nhanh <a id="quick-start"></a>

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Supabase account
- Google AI API key

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/macroinsight.git
cd macroinsight

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Edit .env with your credentials
```

### Development

```bash
# Option 1: Docker (Recommended)
docker compose up -d

# Option 2: Manual
# Backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

### Access

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📡 API Reference <a id="api"></a>

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | GET | Google OAuth login |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout & clear session |

### Market/Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market/chat/stream` | POST | Streaming AI chat |
| `/api/market/stack` | GET | Get news stack for swipe |
| `/api/market/analytics` | GET | Market analytics data |

### Portfolio
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio` | GET | Get user portfolio |
| `/api/portfolio` | POST | Add position |
| `/api/portfolio/{id}` | DELETE | Remove position |

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Semantic Router Accuracy | **100%** |
| Router Latency (p95) | ~5ms |
| Vector Search (p95) | ~100ms |
| End-to-end (p95) | <500ms |
| Total Documents | **1,518,000+** |

---

## 📁 Project Structure

```
macroinsight/
├── src/                          # Backend source
│   ├── api/                      # FastAPI routes & services
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   ├── repositories/         # Data access
│   │   └── middleware/           # Auth, CORS
│   ├── core/                     # RAG components
│   │   ├── router/               # Semantic router
│   │   ├── decomposition/        # Query decomposer
│   │   ├── retrieval/            # Parallel retriever
│   │   ├── generator/            # Answer generator
│   │   ├── fallback/             # Web search fallback
│   │   └── security/             # QueryGuard
│   ├── pipeline/                 # LangGraph pipeline
│   │   ├── graph.py              # StateGraph definition
│   │   ├── nodes.py              # Node functions
│   │   └── state.py              # RAGState TypedDict
│   └── config/                   # Configuration
│
├── frontend/                     # Next.js frontend
│   ├── src/
│   │   ├── app/                  # App router pages
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API clients
│   │   └── contexts/             # React contexts
│   └── public/                   # Static assets
│
├── supabase/                     # Database schemas
├── nginx/                        # Nginx config
├── docker-compose.yml            # Docker setup
├── deploy.sh                     # Deployment script
└── README.md
```

---

## 🔒 Security Features

- **QueryGuard**: Phát hiện và chặn prompt injection
- **Rate Limiting**: Giới hạn request theo IP/User
- **JWT Rotation**: Refresh token tự động
- **HTTPS**: SSL/TLS encryption
- **CORS**: Cross-origin protection
- **Input Validation**: Pydantic schemas

---

## 🗺️ Roadmap

- [x] Multi-Index RAG Pipeline
- [x] Semantic Router (100% accuracy)
- [x] Query Decomposition
- [x] Canonical Answer Framework (CAF)
- [x] External Search Fallback
- [x] Streaming Response
- [x] Portfolio Integration
- [x] Swipe News Discovery
- [ ] Portfolio AI Analysis
- [ ] Mobile App (React Native)
- [ ] Real-time Stock Prices

---

## 👥 Team

**MacroInsight Team** - UEL Final Report Project

---

## 📄 License

This project is part of the UEL Final Report.

---

<p align="center">
  <strong>MacroInsight</strong> - Hiểu thị trường Việt Nam như chuyên gia! 🇻🇳
</p>
