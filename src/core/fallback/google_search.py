"""
Google Search Grounding Node.

Uses Gemini with Google Search tool binding to retrieve
real-time information from the web.

Follows Single Responsibility Principle - only handles web search.
"""
import logging
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from src.config.fallback_config import get_fallback_config, FallbackConfig

logger = logging.getLogger(__name__)


@dataclass
class WebContext:
    """
    A piece of context retrieved from web search.
    
    Attributes:
        content: The text content
        url: Source URL (if available)
        title: Source title (if available)
        source_type: Always "web" for web contexts
        similarity: Confidence score (default high for direct search)
    """
    content: str
    url: Optional[str] = None
    title: Optional[str] = None
    source_type: str = "web"
    similarity: float = 0.85
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for state storage."""
        return {
            "content": self.content,
            "url": self.url,
            "title": self.title,
            "source": self.source_type,
            "similarity": self.similarity,
            "metadata": {
                "source": "web_search",
                "url": self.url,
                "title": self.title,
            }
        }


class GoogleSearchGrounding:
    """
    Executes grounded web search using Gemini + Google Search tool.
    
    This class uses the langchain-google-genai package to bind
    the google_search tool to Gemini, enabling real-time web search
    with grounded citations.
    
    Follows Dependency Inversion - depends on abstractions (config).
    """
    
    def __init__(self, config: Optional[FallbackConfig] = None):
        """
        Initialize the Google Search grounding service.
        
        Args:
            config: Optional custom configuration
        """
        self.config = config or get_fallback_config()
        self._llm = None
    
    def _get_llm(self):
        """Lazy load the LLM with Google Search tool."""
        if self._llm is None:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                
                self._llm = ChatGoogleGenerativeAI(
                    model=self.config.search_model,
                    temperature=self.config.search_temperature,
                )
                logger.info(f"Initialized GoogleSearchGrounding with model: {self.config.search_model}")
            except ImportError:
                logger.error("langchain-google-genai not installed")
                raise ImportError(
                    "langchain-google-genai is required for Google Search fallback. "
                    "Install with: pip install langchain-google-genai"
                )
        return self._llm
    
    def search(self, query: str, sub_queries: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Execute grounded web search for the query.
        
        Args:
            query: Main query to search for
            sub_queries: Optional list of sub-queries for comprehensive search
            
        Returns:
            Dict containing:
                - web_contexts: List of WebContext dicts
                - fallback_used: True
                - fallback_response: Synthesized response
                - fallback_error: Error message if failed
        """
        try:
            from langchain_core.messages import HumanMessage
            
            llm = self._get_llm()
            
            # Bind Google Search tool
            llm_with_search = llm.bind_tools([{"google_search": {}}])
            
            # Construct search prompt
            search_prompt = self._build_search_prompt(query, sub_queries)
            
            # Execute search
            logger.info(f"Executing Google Search for: {query[:50]}...")
            response = llm_with_search.invoke([HumanMessage(content=search_prompt)])
            
            # Parse response
            web_contexts = self._parse_response(response)
            
            logger.info(f"Google Search returned {len(web_contexts)} contexts")
            
            return {
                "web_contexts": [ctx.to_dict() for ctx in web_contexts],
                "fallback_used": True,
                "fallback_response": response.content if hasattr(response, 'content') else str(response),
                "fallback_error": None,
            }
            
        except Exception as e:
            logger.error(f"Google Search Grounding failed: {e}")
            return {
                "web_contexts": [],
                "fallback_used": True,
                "fallback_response": None,
                "fallback_error": str(e),
            }

    async def asearch(self, query: str, sub_queries: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Async version of search using thread executor.
        
        Args:
            query: Main query to search for
            sub_queries: Optional list of sub-queries
            
        Returns:
            Dict containing web contexts and response
        """
        import asyncio
        loop = asyncio.get_running_loop()
        
        return await loop.run_in_executor(
            None, 
            lambda: self.search(query, sub_queries)
        )
    
    def _build_search_prompt(self, query: str, sub_queries: Optional[List[str]] = None) -> str:
        """Build the search prompt for Gemini."""
        queries_to_search = [query]
        if sub_queries:
            queries_to_search.extend(sub_queries[:3])  # Limit sub-queries
        
        queries_text = "\n".join(f"- {q}" for q in queries_to_search)
        
        return f"""Bạn là trợ lý nghiên cứu tài chính và pháp lý Việt Nam.
Hãy tìm kiếm thông tin mới nhất về các câu hỏi sau:

{queries_text}

Yêu cầu:
1. Sử dụng Google Search để tìm thông tin chính xác, cập nhật
2. Ưu tiên nguồn uy tín: báo tài chính (CafeF, VnExpress), trang chính phủ, công ty chứng khoán
3. Trích dẫn URL nguồn cho mỗi thông tin quan trọng
4. Tập trung vào dữ liệu số liệu cụ thể nếu có
5. Trả lời bằng tiếng Việt

Trả về kết quả dưới dạng JSON:
{{
    "findings": [
        {{
            "fact": "Thông tin tìm được",
            "source_url": "https://...",
            "source_title": "Tên nguồn"
        }}
    ],
    "summary": "Tóm tắt ngắn gọn các thông tin tìm được"
}}"""
    
    def _parse_response(self, response) -> List[WebContext]:
        """Parse LLM response to extract web contexts."""
        web_contexts = []
        
        # Try to parse grounding metadata if available
        if hasattr(response, 'additional_kwargs'):
            grounding_metadata = response.additional_kwargs.get('grounding_metadata', {})
            grounding_chunks = grounding_metadata.get('grounding_chunks', [])
            
            for chunk in grounding_chunks:
                if 'web' in chunk:
                    web_data = chunk['web']
                    web_contexts.append(WebContext(
                        content=web_data.get('title', ''),
                        url=web_data.get('uri', ''),
                        title=web_data.get('title', ''),
                        similarity=0.9  # High confidence for direct search
                    ))
        
        # Try to parse JSON from response content
        if hasattr(response, 'content') and response.content:
            try:
                # Extract JSON from response
                # Handle both string and list content
                content = response.content
                if isinstance(content, list):
                    content = str(content)
                    
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = content[json_start:json_end]
                    parsed = json.loads(json_str)
                    
                    # Extract findings
                    findings = parsed.get('findings', [])
                    
                    # If we found structured findings, use them
                    if findings:
                        for finding in findings[:self.config.max_search_results]:
                            fact_text = finding.get('fact', '')
                            # Add Finding as WebContext
                            web_contexts.append(WebContext(
                                content=fact_text,
                                url=finding.get('source_url', ''),
                                title=finding.get('source_title', ''),
                                similarity=0.85
                            ))
                            
                    # Also use summary if available
                    if parsed.get('summary'):
                        # Add summary as a separate high-level context
                        web_contexts.insert(0, WebContext(
                            content=parsed['summary'],
                            source_type="web_summary",
                            similarity=0.95
                        ))
                        
            except json.JSONDecodeError:
                # If JSON parsing fails, use raw content
                logger.debug("Could not parse JSON from response, using raw content")
        
        # Fallback: if no structured contexts found, use raw response content
        # But try to clean it if it looks like JSON
        if not web_contexts and hasattr(response, 'content') and response.content:
            content = str(response.content)
            # Remove JSON markers if present
            if content.strip().startswith('```json'):
                content = content.replace('```json', '').replace('```', '')
            
            web_contexts.append(WebContext(
                content=content.strip(),
                source_type="web_search_synthesized",
                similarity=0.75
            ))
        
        return web_contexts
