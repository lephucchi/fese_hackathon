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

### Dashboard Components

#### Market Tab (Phân tích Vĩ mô)
Display macro economic news with impact analysis for investor decision-making:
- Impact badges with dynamic levels (High/Medium/Low)
- Color-coded impact indicators (Red/Yellow/Green)
- Macro analysis summary with AI-generated insights
- Smart keywords detection for impact level determination
- Enhanced tags showing top 3 with "+X more" indicator

#### Personal Tab (Danh mục của bạn)
Connect portfolio management with macro news impact:
- Portfolio overview with edit functionality
- Macro impact alert cards for immediate attention
- AI synthesis reports for daily insights

#### Academy Tab (Học viện Vĩ mô)
Provide macro economics education:
- Structured learning paths
- Progress tracking
- Content categorization (Personalized, Theory, Events)
- Newsletter signup for weekly updates

### Design System

#### Color Scheme
- **Primary Accent**: `#00D97E` (Neon Green) - Consistent with homepage
- **Dark Background**: `#0A0E12` / `#151A20`
- **Card Background**: `#1C2127`
- **Border Color**: `#2A3340`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#8B97A8`
- **Status Colors**:
  - High Impact: `#FF4757` (Red)
  - Medium Impact: `#FFC107` (Yellow)
  - Positive: `#00D97E` (Green)

#### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Headers**: Bold (700), sized proportionally
- **Body Text**: Regular (400), clear hierarchy

#### Effects
- Glassmorphism backgrounds
- Gradient buttons with neon green accents
- Smooth animations (0.2-0.3s transitions)
- Custom scrollbars
- Hover effects with slight lift (translateY) + border glow

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
## 🛠️ Development Guide

### Common Issues & Solutions

#### Issue: npm command not recognized
**Solution**: Install Node.js LTS from https://nodejs.org/
1. Download and install Node.js LTS version
2. Restart PowerShell after installation
3. Verify installation: `node --version` and `npm --version`

#### Issue: TypeScript errors in editor
**Solution**: Install dependencies first
```bash
npm install
```
This will install all required packages including React, TypeScript, and type definitions.

#### Issue: Script execution disabled
**Solution**: Enable PowerShell scripts
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Quick Install Script
Use the provided PowerShell script for automated setup:
```powershell
.\install-dependencies.ps1
```
## 📄 License

Part of the UEL Final Report 2024.
