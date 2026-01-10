"""
Ticker symbol detector for Vietnamese stock market.

Detects ticker symbols (VNM, HPG, etc.), macro indicators, and industry keywords
in news articles and maps to stocks from Supabase database.
"""
import logging
import re
from typing import List, Set, Dict, Any, Optional
from supabase import Client

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)

# Macro Indicators - Map keywords to indicator symbols
MACRO_INDICATORS = {
    # Interest Rate
    "lãi suất": "INTEREST_RATE",
    "interest rate": "INTEREST_RATE",
    "lãi suất ngân hàng": "INTEREST_RATE",
    "lãi suất cho vay": "INTEREST_RATE",
    "lãi suất huy động": "INTEREST_RATE",
    
    # Exchange Rate
    "tỷ giá": "USD_VND",
    "usd/vnd": "USD_VND",
    "tỷ giá đô la": "USD_VND",
    "tỷ giá hối đoái": "USD_VND",
    "tỷ giá ngoại tệ": "USD_VND",
    
    # Gold Price
    "giá vàng": "GOLD",
    "vàng sjc": "GOLD",
    "gold price": "GOLD",
    "vàng trong nước": "GOLD",
    
    # Oil Price
    "giá dầu": "OIL",
    "dầu thô": "OIL",
    "oil price": "OIL",
    "brent": "OIL",
    "wti": "OIL",
    "giá xăng": "OIL",
    
    # CPI / Inflation
    "cpi": "CPI",
    "lạm phát": "CPI",
    "chỉ số giá tiêu dùng": "CPI",
    "inflation": "CPI",
    
    # GDP
    "gdp": "GDP",
    "tăng trưởng kinh tế": "GDP",
    "tổng sản phẩm quốc nội": "GDP",
    
    # VN-Index
    "vn-index": "VNINDEX",
    "vnindex": "VNINDEX",
    "chỉ số vnindex": "VNINDEX",
    "chỉ số vn-index": "VNINDEX",
    
    # HNX-Index  
    "hnx-index": "HNXINDEX",
    "hnxindex": "HNXINDEX",
    "chỉ số hnx": "HNXINDEX",
    
    # Bonds
    "trái phiếu": "BOND",
    "lãi suất trái phiếu": "BOND",
    "bond yield": "BOND",
}

# Industry Keywords - Map keywords to industry names (matching market_data.industry)
INDUSTRY_KEYWORDS = {
    # Banks
    "ngân hàng": "Banks",
    "bank": "Banks",
    "tín dụng": "Banks",
    "cho vay": "Banks",
    "tiền gửi": "Banks",
    
    # Real Estate
    "bất động sản": "Real Estate Investment and Services",
    "nhà đất": "Real Estate Investment and Services",
    "real estate": "Real Estate Investment and Services",
    "địa ốc": "Real Estate Investment and Services",
    "căn hộ": "Real Estate Investment and Services",
    
    # Securities/Investment
    "chứng khoán": "Investment Banking and Brokerage Services",
    "môi giới": "Investment Banking and Brokerage Services",
    "công ty chứng khoán": "Investment Banking and Brokerage Services",
    
    # Construction
    "xây dựng": "Construction and Materials",
    "vật liệu xây dựng": "Construction and Materials",
    "xi măng": "Construction and Materials",
    "thép": "Construction and Materials",
    
    # Food Producers
    "thực phẩm": "Food Producers",
    "đồ uống": "Food Producers",
    "thủy sản": "Food Producers",
    "nông sản": "Food Producers",
    
    # Chemicals
    "hóa chất": "Chemicals",
    "phân bón": "Chemicals",
    "hóa dược": "Chemicals",
    
    # Insurance
    "bảo hiểm": "Non-life Insurance",
    "insurance": "Non-life Insurance",
    
    # Oil and Gas
    "dầu khí": "Oil and Gas Producers",
    "năng lượng": "Oil and Gas Producers",
    "điện lực": "Oil and Gas Producers",
    
    # Technology
    "công nghệ": "Software and Computer Services",
    "phần mềm": "Software and Computer Services",
    "technology": "Software and Computer Services",
}

# Common Vietnamese Company Name to Ticker mappings
# For companies frequently mentioned in financial news
COMPANY_NAME_MAPPINGS = {
    # VN30 major companies
    "vinamilk": "VNM",
    "sữa vinamilk": "VNM",
    "vietcombank": "VCB",
    "ngân hàng ngoại thương": "VCB",
    "fpt": "FPT",
    "tập đoàn fpt": "FPT",
    "hòa phát": "HPG",
    "thép hòa phát": "HPG",
    "vinhomes": "VHM",
    "vingroup": "VIC",
    "tập đoàn vingroup": "VIC",
    "masan": "MSN", 
    "tập đoàn masan": "MSN",
    "thế giới di động": "MWG",
    "mobile world": "MWG",
    "techcombank": "TCB",
    "ngân hàng kỹ thương": "TCB",
    "vpbank": "VPB",
    "ngân hàng việt nam thịnh vượng": "VPB",
    "mb bank": "MBB",
    "ngân hàng quân đội": "MBB",
    "vietinbank": "CTG",
    "ngân hàng công thương": "CTG",
    "bidv": "BID",
    "ngân hàng đầu tư": "BID",
    "acb": "ACB",
    "ngân hàng á châu": "ACB",
    "sabeco": "SAB",
    "bia sài gòn": "SAB",
    "vincom retail": "VRE",
    "petrolimex": "PLX",
    "xăng dầu": "PLX",
    "pv gas": "GAS",
    "khí việt nam": "GAS",
    "vietjet air": "VJC",
    "vietjet": "VJC",
    "vietnam airlines": "HVN",
    "novaland": "NVL",
    "pnj": "PNJ",
    "vàng bạc phú nhuận": "PNJ",
    "ree": "REE",
    "điện lạnh ree": "REE",
    "gemadept": "GMD",
    "hoa sen": "HSG",
    "thép hoa sen": "HSG",
    # Real estate
    "đất xanh": "DXG",
    "khang điền": "KDH",
    "nam long": "NLG",
    # Securities
    "ssi": "SSI",
    "vndirect": "VND",
    "hsc": "HCM",
    # Banks
    "sacombank": "STB",
    "eximbank": "EIB",
    "hdbank": "HDB",
    "tpbank": "TPB",
    "vib": "VIB",
    "lpbank": "LPB",
    "ocb": "OCB",
    # Others
    "vinfast": "VFS",
    "dược hậu giang": "DHG",
    "traphaco": "TRA",
}


class TickerDetector:
    """
    Detect and extract Vietnamese stock ticker symbols from text.
    
    Uses pattern matching and database lookup to identify tickers.
    Supports:
    - Direct ticker symbol detection (VNM, HPG, etc.)
    - Company name to ticker mapping
    - Industry keyword to ticker mapping
    - Macro indicator detection
    """
    
    def __init__(self, config: NewsAnalystConfig, supabase: Client):
        """
        Initialize ticker detector.
        
        Args:
            config: NewsAnalystConfig instance
            supabase: Supabase client for ticker lookup
        """
        self.config = config
        self.supabase = supabase
        
        # Data structures for ticker detection
        self.known_tickers: Set[str] = set()
        self.ticker_data: Dict[str, Dict[str, Any]] = {}  # ticker -> {company_name, industry, exchange}
        self.company_to_ticker: Dict[str, str] = {}  # company_name (lowercase) -> ticker
        self.industry_tickers: Dict[str, List[str]] = {}  # industry -> [tickers]
        
        # Keywords from finance_index for improved matching
        self.short_info_keywords: Dict[str, str] = {}  # keyword (lowercase) -> ticker
        
        # Load tickers from database
        self._load_tickers()
        self._load_finance_index_keywords()
        
        logger.info(f"TickerDetector initialized with {len(self.known_tickers)} tickers, "
                    f"{len(self.short_info_keywords)} keywords from finance_index")
    
    def _load_tickers(self):
        """Load ticker symbols and related data from market_data table."""
        try:
            # Load all columns from market_data
            response = self.supabase.table("market_data").select(
                "ticker, company_name, industry, exchange"
            ).execute()
            
            if response.data:
                for row in response.data:
                    ticker = row.get("ticker")
                    if not ticker:
                        continue
                    
                    # Store ticker data
                    self.known_tickers.add(ticker)
                    self.ticker_data[ticker] = {
                        "company_name": row.get("company_name", ""),
                        "industry": row.get("industry", ""),
                        "exchange": row.get("exchange", "")
                    }
                    
                    # Map company name to ticker (lowercase for matching)
                    company_name = row.get("company_name", "")
                    if company_name:
                        self.company_to_ticker[company_name.lower()] = ticker
                    
                    # Group tickers by industry
                    industry = row.get("industry", "")
                    if industry:
                        if industry not in self.industry_tickers:
                            self.industry_tickers[industry] = []
                        self.industry_tickers[industry].append(ticker)
                
                logger.info(f"Loaded {len(self.known_tickers)} tickers from database")
                logger.info(f"Industries found: {list(self.industry_tickers.keys())}")
            else:
                logger.warning("No tickers found in market_data table")
                self._load_fallback_tickers()
                
        except Exception as e:
            logger.error(f"Error loading tickers: {e}")
            self._load_fallback_tickers()
    
    def _load_finance_index_keywords(self):
        """
        Load keywords from finance_index table for improved ticker matching.
        
        Extracts significant words from short_info to create keyword->ticker mapping.
        Note: This is optional - if finance_index table doesn't exist or lacks short_info,
        the system will still work with tickers from market_data.
        """
        try:
            # Try to load finance_index data - this table may not exist yet
            response = self.supabase.table("finance_index").select(
                "ticker, short_info"
            ).execute()
            
            if not response.data:
                logger.info("No data found in finance_index table - skipping keyword extraction")
                return
            
            # Process each ticker's short_info
            processed_tickers = set()
            for row in response.data:
                ticker = row.get("ticker", "")
                short_info = row.get("short_info", "")
                
                if not ticker or not short_info:
                    continue
                
                # Skip if already processed this ticker
                if ticker in processed_tickers:
                    continue
                processed_tickers.add(ticker)
                
                # Extract keywords from short_info
                keywords = self._extract_keywords_from_text(short_info)
                
                for keyword in keywords:
                    # Only add if keyword is not already mapped to another ticker
                    # Or if current ticker is in known_tickers (priority)
                    if keyword not in self.short_info_keywords:
                        self.short_info_keywords[keyword] = ticker
            
            logger.info(f"Loaded {len(self.short_info_keywords)} keywords from finance_index")
            
        except Exception as e:
            # Log as info instead of error since this is optional functionality
            logger.info(f"finance_index table not available or missing columns - continuing without keyword enhancement: {e}")
    
    def _extract_keywords_from_text(self, text: str) -> List[str]:
        """
        Extract significant keywords from text for matching.
        
        Args:
            text: Text to extract keywords from
            
        Returns:
            List of lowercase keywords (minimum 4 characters)
        """
        import re
        
        # Clean and split text
        text_lower = text.lower()
        
        # Remove special characters, keep Vietnamese
        words = re.findall(r'[\w\u00C0-\u024F\u1E00-\u1EFF]+', text_lower)
        
        # Filter words: minimum 4 chars, not purely numeric
        keywords = []
        stopwords = {'công', 'ty', 'cổ', 'phần', 'việt', 'nam', 'group', 'company', 
                     'joint', 'stock', 'corporation', 'limited', 'trách', 'nhiệm',
                     'hữu', 'hạn', 'tnhh', 'tổng', 'ctcp'}
        
        for word in words:
            if len(word) >= 4 and not word.isdigit() and word not in stopwords:
                keywords.append(word)
        
        return keywords
    
    def detect_tickers(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect ticker symbols in text using hybrid approach.
        
        Methods:
        1. Direct ticker pattern matching (VNM, HPG, etc.)
        2. Company name matching (Vinamilk -> VNM, etc.)
        3. Macro indicator detection (lãi suất, GDP, etc.)
        4. Keyword matching from finance_index (company descriptions)
        
        Args:
            text: Text to analyze
            
        Returns:
            List of detected tickers with confidence scores and type
        """
        detected = []
        
        # Method 1: Direct ticker pattern matching (VNM, HPG, etc.)
        # This only detects tickers explicitly written in the text
        detected.extend(self._detect_by_pattern(text))
        
        # Method 2: Company name matching (Vinamilk -> VNM, FPT -> FPT)
        # Crucial for Vietnamese news which often uses company names
        detected.extend(self._detect_by_company_name(text))
        
        # Method 3: Macro indicator detection (lãi suất, GDP, etc.)
        # These are important economic indicators mentioned in news
        detected.extend(self._detect_macro_indicators(text))
        
        # Method 4: Keyword matching from finance_index
        # Match keywords from company descriptions to find related tickers
        detected.extend(self._detect_by_finance_index(text))
        
        # Deduplicate while preserving highest confidence
        unique_detected = self._deduplicate_tickers(detected)
        
        logger.debug(f"Detected {len(unique_detected)} tickers in text")
        return unique_detected
    
    def _detect_by_finance_index(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect tickers by matching keywords from finance_index short_info.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of detected tickers with confidence scores
        """
        detected = []
        text_lower = text.lower()
        found_tickers = set()
        
        # Extract keywords from input text
        text_keywords = self._extract_keywords_from_text(text)
        
        # Match against finance_index keywords
        for keyword in text_keywords:
            if keyword in self.short_info_keywords:
                ticker = self.short_info_keywords[keyword]
                
                # Skip if already found this ticker
                if ticker in found_tickers:
                    continue
                found_tickers.add(ticker)
                
                # Only add if ticker is known
                if ticker in self.known_tickers:
                    detected.append({
                        "ticker": ticker,
                        "confidence": 0.75,  # Lower confidence than direct match
                        "method": "finance_index_keyword",
                        "type": "stock",
                        "matched_keyword": keyword
                    })
        
        return detected
    
    def _detect_by_pattern(self, text: str) -> List[Dict[str, Any]]:
        """Detect tickers by pattern matching (3-letter uppercase codes)."""
        detected = []
        
        # Pattern: 3-letter uppercase codes
        pattern = r'\b([A-Z]{3})\b'
        matches = re.findall(pattern, text)
        
        for ticker in matches:
            if ticker in self.known_tickers:
                confidence = self._calculate_confidence(text, ticker)
                
                if confidence >= self.config.ticker_min_confidence:
                    detected.append({
                        "ticker": ticker,
                        "confidence": confidence,
                        "method": "pattern_match",
                        "type": "stock"
                    })
        
        return detected
    
    def _detect_by_company_name(self, text: str) -> List[Dict[str, Any]]:
        """Detect tickers by matching company names in text."""
        detected = []
        text_lower = text.lower()
        found_tickers = set()
        
        # First, check static COMPANY_NAME_MAPPINGS (common Vietnamese companies)
        for company_name, ticker in COMPANY_NAME_MAPPINGS.items():
            if company_name in text_lower and ticker not in found_tickers:
                # Verify ticker exists in market_data
                if ticker in self.known_tickers:
                    found_tickers.add(ticker)
                    detected.append({
                        "ticker": ticker,
                        "confidence": 0.90,  # Higher confidence for known mappings
                        "method": "company_name_static",
                        "type": "stock",
                        "matched_text": company_name
                    })
        
        # Then check dynamic company_to_ticker from database
        for company_name, ticker in self.company_to_ticker.items():
            if ticker in found_tickers:
                continue  # Skip if already found
            # Check if company name appears in text
            if len(company_name) >= 5 and company_name in text_lower:
                found_tickers.add(ticker)
                detected.append({
                    "ticker": ticker,
                    "confidence": 0.85,
                    "method": "company_name",
                    "type": "stock",
                    "matched_text": company_name
                })
        
        return detected
    
    def _detect_by_industry_keyword(self, text: str) -> List[Dict[str, Any]]:
        """Detect tickers by matching industry keywords."""
        detected = []
        text_lower = text.lower()
        matched_industries = set()
        
        # Find matching industries
        for keyword, industry in INDUSTRY_KEYWORDS.items():
            if keyword in text_lower:
                matched_industries.add(industry)
        
        # Add tickers from matched industries
        for industry in matched_industries:
            if industry in self.industry_tickers:
                tickers = self.industry_tickers[industry]
                # Limit to top 5 tickers per industry to avoid flooding
                for ticker in tickers[:5]:
                    detected.append({
                        "ticker": ticker,
                        "confidence": 0.6,
                        "method": "industry_keyword",
                        "type": "stock",
                        "industry": industry
                    })
        
        return detected
    
    def _detect_macro_indicators(self, text: str) -> List[Dict[str, Any]]:
        """Detect macro indicators in text."""
        detected = []
        text_lower = text.lower()
        found_indicators = set()
        
        for keyword, indicator in MACRO_INDICATORS.items():
            if keyword in text_lower and indicator not in found_indicators:
                found_indicators.add(indicator)
                detected.append({
                    "ticker": indicator,
                    "confidence": 0.9,
                    "method": "macro_indicator",
                    "type": "macro",
                    "matched_keyword": keyword
                })
        
        return detected
    
    def _calculate_confidence(self, text: str, ticker: str) -> float:
        """
        Calculate confidence score for ticker detection.
        
        Args:
            text: Original text
            ticker: Detected ticker
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        confidence = 0.7  # Base confidence
        
        # Boost confidence if ticker appears with context keywords
        context_keywords = [
            "cổ phiếu", "mã", "chứng khoán", "ticker",
            "công ty", "doanh nghiệp", "niêm yết"
        ]
        
        text_lower = text.lower()
        
        # Check if ticker appears near context keywords
        for keyword in context_keywords:
            if keyword in text_lower:
                # Check proximity (within 50 characters)
                ticker_pos = text.find(ticker)
                keyword_pos = text_lower.find(keyword)
                
                if ticker_pos >= 0 and keyword_pos >= 0:
                    distance = abs(ticker_pos - keyword_pos)
                    if distance < 50:
                        confidence = min(1.0, confidence + 0.2)
                        break
        
        # Boost if ticker appears multiple times
        count = text.count(ticker)
        if count > 1:
            confidence = min(1.0, confidence + 0.1 * min(count - 1, 3))
        elif count == 1:
            confidence *= 0.9
        
        return confidence
    
    def _deduplicate_tickers(self, detected: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate tickers, keeping the highest confidence."""
        ticker_map = {}
        
        for item in detected:
            ticker = item["ticker"]
            if ticker not in ticker_map or item["confidence"] > ticker_map[ticker]["confidence"]:
                ticker_map[ticker] = item
        
        return list(ticker_map.values())
    
    def get_ticker_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get ticker information from cached data or database.
        
        Args:
            ticker: Ticker symbol
            
        Returns:
            Dictionary with ticker info or None
        """
        # First check cached data
        if ticker in self.ticker_data:
            return {
                "ticker": ticker,
                **self.ticker_data[ticker]
            }
        
        # For macro indicators, return indicator info
        if ticker in set(MACRO_INDICATORS.values()):
            return {
                "ticker": ticker,
                "type": "macro",
                "description": f"Macro indicator: {ticker}"
            }
        
        # Fallback to database query
        try:
            response = self.supabase.table("market_data")\
                .select("*")\
                .eq("ticker", ticker)\
                .execute()
            
            if response.data:
                return response.data[0]
            
        except Exception as e:
            logger.error(f"Error fetching ticker info for {ticker}: {e}")
        
        return None
    
    def get_tickers_by_industry(self, industry: str) -> List[str]:
        """Get all tickers for a given industry."""
        return self.industry_tickers.get(industry, [])
    
    def get_all_industries(self) -> List[str]:
        """Get list of all available industries."""
        return list(self.industry_tickers.keys())
