# NewsAnalyst Engine

## Overview

Hệ thống NewsAnalyst là một engine tự động hóa để:
1. **Thu thập** (Scrape) tin tức tài chính từ các nguồn uy tín (CafeF, VNExpress, VietStock, v.v.)
2. **Phân tích** cảm xúc (sentiment analysis) với FinBERT (English) và PhoBERT (Vietnamese)
3. **Nhận diện** mã chứng khoán (ticker symbols) liên quan
4. **Lưu trữ** vào Supabase database với embeddings

## Architecture

```
NewsAnalyst/
├── config.py              # Configuration & environment variables
├── main.py                # Entry point (CLI)
├── pipeline.py            # Main orchestrator
├── scraper/               # News scraping
│   ├── google_searcher.py # Google Custom Search API
│   └── __init__.py
├── analyzer/              # Analysis modules
│   ├── finbert_analyzer.py   # English sentiment (FinBERT)
│   ├── phobert_analyzer.py   # Vietnamese sentiment (PhoBERT)
│   ├── ticker_detector.py    # Stock ticker detection
│   └── __init__.py
├── writer/                # Database operations
│   ├── news_writer.py     # Write to Supabase
│   └── __init__.py
└── scheduler/             # APScheduler integration
    ├── jobs.py            # Job definitions
    ├── runner.py          # Scheduler runner
    └── __init__.py
```

## Features

### 1. Multi-Source News Scraping
- Google Custom Search API integration
- Configurable sources (CafeF, VNExpress, VietStock, etc.)
- **Enhanced Extraction**: Uses `trafilatura` for robust content extraction (full text)
- Date range filtering
- Concurrent scraping with asyncio

### 2. Dual-Language Sentiment Analysis
- **FinBERT** (`ProsusAI/finbert`) for English financial text
- **PhoBERT** (`vinai/phobert-base-v2`) for Vietnamese text
- Automatic language detection
- Batch processing support
- Returns: sentiment, confidence, scores

### 3. Advanced Ticker Detection
- **Multi-Strategy Detection**:
  - **Regex**: 3-letter codes (e.g., VNM, HPG)
  - **Company Names**: Maps "Vinamilk" → "VNM" using static dictionary (`COMPANY_NAME_MAPPINGS`)
  - **Database Lookup**: Dynamic company mapping from DB
- **Validation**: Strict verification against `market_data` table (Foreign Key compliance)
- **Context Scoring**: Boosts confidence based on nearby keywords
- **Market vs Macro**: Prioritizes stock tickers over macro indicators (e.g., GAP, GDP)

### 4. Optimized Pipeline
- **Early Deduplication**: Filters URLs against DB *before* content extraction to save resources
- **Batch Processing**: Efficient batch handling for analysis and insertion
- **Transaction Management**: Atomic database operations

### 5. Automated Scheduling
- APScheduler with AsyncIO support
- Configurable intervals (4h, 6h, custom)
- Job persistence with SQLAlchemy
- Manual trigger support

### 6. Database Integration
- Supabase table: `news`, `news_stock_mapping`, `news_index`
- Deduplication by URL and content hash
- Bulk insert optimization
- Transaction management

## Configuration

### Environment Variables (`.env`)

```bash
# Google Custom Search
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key

# Models
FINBERT_MODEL_NAME=ProsusAI/finbert
PHOBERT_MODEL_NAME=vinai/phobert-base-v2

# Scraping
SCRAPE_INTERVAL_HOURS=4
MAX_RESULTS_PER_SOURCE=10
SEARCH_LOOKBACK_DAYS=7

# Scheduler
ENABLE_SCHEDULER=true
SCHEDULER_TIMEZONE=Asia/Ho_Chi_Minh

# Features
ENABLE_DEDUPLICATION=true
TICKER_MIN_CONFIDENCE=0.7
```

### NewsAnalystConfig

```python
from src.functions.NewsAnalyst.config import NewsAnalystConfig

config = NewsAnalystConfig()
config.validate()
```

## Usage

### 1. One-Time Execution

Run pipeline once manually:

```bash
cd src/functions/NewsAnalyst
python main.py --mode once
```

### 2. Scheduled Execution (Daemon)

Run as background service with APScheduler:

```bash
python main.py --mode scheduled
```

### 3. Programmatic Usage

```python
import asyncio
from src.functions.NewsAnalyst.config import NewsAnalystConfig
from src.functions.NewsAnalyst.pipeline import NewsAnalystPipeline

async def main():
    config = NewsAnalystConfig()
    pipeline = NewsAnalystPipeline(config)
    
    stats = await pipeline.run()
    print(f"Statistics: {stats}")

asyncio.run(main())
```

### 4. FastAPI Integration

```python
from fastapi import BackgroundTasks
from src.functions.NewsAnalyst.pipeline import NewsAnalystPipeline

pipeline = NewsAnalystPipeline()

@app.post("/trigger-news-analyst")
async def trigger_analysis(background_tasks: BackgroundTasks):
    background_tasks.add_task(pipeline.run)
    return {"status": "triggered"}
```

## Pipeline Workflow

```
1. SCRAPING
   ├─ Query Google Custom Search API
   ├─ Filter by date range
   ├─ Parse results (title, snippet, url, date)
   └─ Return raw articles

2. ANALYSIS
   ├─ Language detection (Vietnamese vs English)
   ├─ Sentiment analysis
   │  ├─ Vietnamese → PhoBERT
   │  └─ English → FinBERT
   ├─ Ticker detection
   │  ├─ Pattern matching (3-letter codes)
   │  ├─ Database validation
   │  └─ Confidence scoring
   └─ Return analyzed articles

3. WRITING
   ├─ Deduplication check (URL + content hash)
   ├─ Insert into news table
   ├─ Insert ticker mappings (news_stock_mapping)
   ├─ Generate embeddings (TODO)
   └─ Insert into news_index (TODO)

4. STATISTICS
   └─ Return: scraped, analyzed, inserted, duplicates, errors
```

## Data Flow

```
Google Search → Articles → Sentiment + Tickers → Supabase
     ↓             ↓              ↓                  ↓
   API         Raw JSON    {sentiment, tickers}   Tables:
  Results                                        - news
                                                 - news_stock_mapping
                                                 - news_index
```

## Database Schema

### `news` Table
```sql
- news_id (uuid, PK)
- title (text)
- content (text)
- source_url (text, unique)
- published_at (timestamp)
- sentiment (text: positive/negative/neutral)
- created_at (timestamp)
```

### `news_stock_mapping` Table
```sql
- mapping_id (uuid, PK)
- news_id (uuid, FK → news)
- ticker (text, FK → market_data)
```

### `news_index` Table
```sql
- index_id (uuid, PK)
- news_id (uuid, FK → news)
- embedding (vector)
- metadata (jsonb)
```

## Models

### FinBERT (English)
- **Model**: `ProsusAI/finbert`
- **Task**: Financial sentiment analysis
- **Labels**: positive, negative, neutral
- **Input**: English financial text
- **Output**: 
  ```python
  {
    "sentiment": "positive",
    "confidence": 0.95,
    "scores": {"positive": 0.95, "negative": 0.03, "neutral": 0.02}
  }
  ```

### PhoBERT (Vietnamese)
- **Model**: `vinai/phobert-base-v2`
- **Task**: Text classification (sentiment)
- **Architecture**: PhobertModel (encoder) + Linear (classifier)
- **Labels**: positive, negative, neutral
- **Input**: Vietnamese text
- **Output**: Same as FinBERT

## Ticker Detection

### Pattern Matching
- Regex: `\b([A-Z]{3})\b` (3-letter uppercase)
- Validation: Check against `market_data.ticker`

### Confidence Scoring
```python
Base: 0.7
+ Context keywords nearby (+0.2):
  - "cổ phiếu", "mã", "chứng khoán"
  - "công ty", "doanh nghiệp", "niêm yết"
- Single occurrence only (-10%)
```

## Scheduler

### Triggers

**4-hour interval** (recommended):
```
00:00, 04:00, 08:00, 12:00, 16:00, 20:00
```

**6-hour interval**:
```
00:00, 06:00, 12:00, 18:00
```

### Configuration

```python
from src.functions.NewsAnalyst.scheduler import NewsAnalystScheduler

scheduler = NewsAnalystScheduler(config, pipeline)
scheduler.start()  # Start background scheduler
scheduler.run_now()  # Manual trigger
scheduler.stop()  # Graceful shutdown
```

## Logging

Logs are written to `logs/news_analyst.log` with format:
```
2024-01-15 10:00:00 - NewsAnalyst - INFO - Starting pipeline execution...
2024-01-15 10:00:05 - Scraper - INFO - Scraped 45 articles
2024-01-15 10:01:20 - Analyzer - INFO - Analyzed 45 articles
2024-01-15 10:02:30 - Writer - INFO - Inserted 38 articles (7 duplicates)
```

## Statistics Output

```python
{
  "scraped": 45,       # Total articles scraped
  "analyzed": 45,      # Articles analyzed
  "inserted": 38,      # New articles inserted
  "duplicates": 7,     # Duplicates skipped
  "errors": 0          # Errors encountered
}
```

## Error Handling

- **Scraping errors**: Logged, pipeline continues
- **Analysis errors**: Article skipped, logged
- **Database errors**: Transaction rolled back, logged
- **Scheduler errors**: Job rescheduled, alert sent (TODO)

## Dependencies

```
apscheduler>=3.10.0
supabase>=2.0.0
httpx>=0.24.0
torch>=2.0.0
transformers>=4.30.0
python-dotenv>=1.0.0
trafilatura>=1.8.0
feedparser>=6.0.0
lxml_html_clean>=0.1.0
sqlalchemy>=2.0.0
```

## TODO / Future Enhancements

- [ ] Add embedding generation (OpenAI/Google)
- [x] Implement content extraction (full article) -> Done via Trafilatura
- [x] Add more news sources (RSS feeds) -> Configurable
- [ ] Implement notification system (email/Slack)
- [ ] Add metrics dashboard
- [ ] Implement retry logic for failed jobs
- [x] Add company name → ticker mapping -> Done
- [x] Optimize batch processing -> Deduplication batching added
- [ ] Add unit tests
- [ ] Add Docker support

## Troubleshooting

### No articles scraped
- Check Google API key and engine ID
- Verify search queries match news sources
- Check date range (`SEARCH_LOOKBACK_DAYS`)

### Low ticker detection
- Increase `TICKER_MIN_CONFIDENCE`
- Verify tickers exist in `market_data` table
- Check context keywords

### Sentiment analysis errors
- Verify model downloads completed
- Check CUDA availability (GPU)
- Reduce batch size if OOM

### Scheduler not running
- Check `ENABLE_SCHEDULER=true`
- Verify timezone setting
- Check logs for errors

## Support

For questions or issues, contact the development team or file an issue on GitHub.

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Author**: Hakathon Team