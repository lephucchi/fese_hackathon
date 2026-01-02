# Multi-Index RAG Frontend

Modern, responsive chat interface for the Multi-Index RAG system built with Next.js 16.

## ✨ Features

- 🎨 **Modern UI Design** - Smooth animations, professional styling
- 🌐 **Bilingual Support** - Vietnamese and English interface
- 📱 **Fully Responsive** - Sidebar layout adapts to screen size
- ⚡ **Real-time Chat** - Instant query processing with loading states
- 📚 **Citation Support** - Interactive source references with previews
- 🎯 **Route Indicators** - Visual badges for query routing (glossary, legal, financial, news)
- ⌨️ **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line
- 🔌 **Backend Integration** - Real-time API status monitoring
- 🌓 **Dark Mode** - Full theme support with CSS variables

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- FastAPI backend running on `http://localhost:8000` (see main [README](../README.md))

### Installation

```bash
cd frontend
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Configuration

Edit `.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# App Configuration (optional)
NEXT_PUBLIC_APP_NAME=Multi-Index RAG
NEXT_PUBLIC_APP_VERSION=1.0.0
```

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Main chat page
│   │   └── globals.css        # Design system & animations
│   ├── components/
│   │   ├── ChatInterface.tsx  # Main chat container
│   │   ├── MessageBubble.tsx  # Message display with citations
│   │   ├── MessageInput.tsx   # Auto-resize input field
│   │   ├── Citation.tsx       # Citation badges & list
│   │   └── LoadingIndicators.tsx
│   ├── hooks/
│   │   └── useChatAPI.ts      # API communication hook
│   └── types/
│       └── index.ts           # TypeScript definitions
├── public/                    # Static assets
├── .env.local                 # Environment config (create this)
└── package.json
```

## 🎨 Design System

### Color Palette

- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#8b5cf6` (Purple)
- **Accent**: `#ec4899` (Pink)

### Typography

- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Effects

- Glassmorphism backgrounds
- Gradient buttons
- Smooth animations
- Custom scrollbars

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the frontend root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### API Endpoints

The frontend expects these backend endpoints:

- `POST /api/query` - Process RAGquery
- `GET /api/health` - Health check

## 📱 UI Components

### ChatInterface
Main chat container with header, messages area, and input field.

### MessageBubble
Displays user and assistant messages with different styling. Assistant messages include:
- Parsed citations with clickable badges
- Route indicators (📖 Thuật ngữ, ⚖️ Pháp lý, etc.)
- Processing time
- Source references

### MessageInput
Auto-resizing textarea with:
- Glassmorphism styling
- Gradient send button
- Keyboard shortcuts
- Character limit feedback

### Citation Components
- `CitationBadge` - Inline citation number badges
- `CitationList` - Expandable source list with previews

## 🌐 Internationalization

All UI text is in Vietnamese:
- Input placeholder: "Nhập câu hỏi của bạn..."
- Loading: "Đang phân tích..."
- Error: "Xin lỗi, đã có lỗi xảy ra..."
- Route labels: Thuật ngữ, Pháp lý, Tài chính, Tin tức

## 🚀 Performance

- Code splitting with Next.js App Router
- Optimized re-renders with React hooks
- Lazy loading for heavy components
- Smooth 60fps animations

## 📄 License

Part of the UEL Final Report 2024.
