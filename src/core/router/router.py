"""
Semantic Router Implementation.

This module provides the core router classes for classifying queries
into appropriate indices (glossary, legal, financial, news).

Supports:
- Single-label routing (1 index)
- Multi-label routing (2-4 indices)
- Hybrid approach (rule-based + semantic)
"""
import re
import numpy as np
from typing import List, Tuple, Dict, Optional
from sentence_transformers import SentenceTransformer

from src.config import RouterConfig, DEFAULT_CONFIG
from .routes import ROUTES, Route


class SemanticRouter:
    """
    Semantic Router using embedding similarity for query classification.
    
    Uses pre-computed route prototypes (average embeddings of examples)
    to classify incoming queries via cosine similarity.
    """
    
    def __init__(self, config: RouterConfig = None):
        """
        Initialize the Semantic Router.
        
        Args:
            config: Router configuration. Uses DEFAULT_CONFIG if None.
        """
        self.config = config or DEFAULT_CONFIG
        self.encoder = None  # Lazy loading
        self.routes = {r.name: r for r in ROUTES}
        self.route_embeddings: Dict[str, np.ndarray] = {}
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of encoder and embeddings."""
        if not self._initialized:
            print(f"Loading encoder model: {self.config.encoder_model}...")
            self.encoder = SentenceTransformer(self.config.encoder_model)
            self.route_embeddings = self._compute_route_embeddings()
            self._initialized = True
            print(f"Router initialized with {len(self.routes)} routes.")
    
    def _compute_route_embeddings(self) -> Dict[str, np.ndarray]:
        """
        Pre-compute average embeddings for each route.
        
        Returns:
            Dict mapping route name to prototype embedding.
        """
        embeddings = {}
        for route in ROUTES:
            print(f"  Computing embeddings for route: {route.name} ({len(route.utterances)} examples)")
            route_embs = self.encoder.encode(
                route.utterances,
                normalize_embeddings=self.config.normalize_embeddings,
                show_progress_bar=False
            )
            # Prototype = mean of all example embeddings
            embeddings[route.name] = np.mean(route_embs, axis=0)
        return embeddings
    
    def route(self, query: str) -> Tuple[List[str], Dict[str, float]]:
        """
        Route a query to appropriate index(es).
        
        Args:
            query: User query string
            
        Returns:
            Tuple of (selected_routes, scores_dict)
            - selected_routes: List of route names in priority order
            - scores_dict: Dict of {route_name: similarity_score}
        """
        self._ensure_initialized()
        
        # Encode query
        query_emb = self.encoder.encode(
            query,
            normalize_embeddings=self.config.normalize_embeddings,
            show_progress_bar=False
        )
        
        # Compute similarity with all routes
        scores = {}
        for route_name, route_emb in self.route_embeddings.items():
            # Cosine similarity (dot product for normalized vectors)
            scores[route_name] = float(np.dot(query_emb, route_emb))
        
        # Select routes based on thresholds
        selected = self._select_routes(scores)
        
        return selected, scores
    
    def _select_routes(self, scores: Dict[str, float]) -> List[str]:
        """
        Select routes based on scores and thresholds.
        
        Args:
            scores: Dict of {route_name: score}
            
        Returns:
            List of selected route names in priority order.
        """
        selected = []
        
        # Sort by score descending
        sorted_routes = sorted(scores.items(), key=lambda x: -x[1])
        
        for route_name, score in sorted_routes:
            threshold = self.config.route_thresholds.get(
                route_name, self.config.default_threshold
            )
            
            if score >= threshold:
                selected.append(route_name)
                
                # Single-label mode: stop after first match
                if not self.config.enable_multi_label:
                    break
                
                # Multi-label mode: limit to max_routes
                if len(selected) >= self.config.max_routes:
                    break
        
        # Fallback if no route selected
        if not selected:
            selected = [self.config.fallback_route]
        
        return selected
    
    def route_with_confidence(self, query: str) -> Dict:
        """
        Route with detailed confidence information.
        
        Args:
            query: User query string
            
        Returns:
            Dict with routing details including confidence scores.
        """
        routes, scores = self.route(query)
        
        return {
            "query": query,
            "selected_routes": routes,
            "scores": scores,
            "primary_route": routes[0],
            "is_multi_label": len(routes) > 1,
            "confidence": scores[routes[0]],
            "top_route": max(scores, key=scores.get),
            "needs_reranker": max(scores.values()) < 0.50
        }
    
    def batch_route(self, queries: List[str]) -> List[Tuple[List[str], Dict[str, float]]]:
        """
        Route multiple queries efficiently.
        
        Args:
            queries: List of query strings
            
        Returns:
            List of (routes, scores) tuples for each query.
        """
        self._ensure_initialized()
        
        # Batch encode queries
        query_embs = self.encoder.encode(
            queries,
            normalize_embeddings=self.config.normalize_embeddings,
            show_progress_bar=True,
            batch_size=32
        )
        
        results = []
        for query_emb in query_embs:
            scores = {}
            for route_name, route_emb in self.route_embeddings.items():
                scores[route_name] = float(np.dot(query_emb, route_emb))
            
            selected = self._select_routes(scores)
            results.append((selected, scores))
        
        return results


class HybridRouter(SemanticRouter):
    """
    Hybrid Router combining rule-based and semantic routing.
    
    First applies rule-based patterns for high-confidence cases,
    then falls back to semantic similarity for ambiguous queries.
    
    This approach provides:
    - Deterministic behavior for clear patterns
    - Semantic understanding for ambiguous cases
    - Better accuracy than pure semantic routing
    """
    
    # ==========================================================================
    # Rule-based patterns (Vietnamese)
    # ==========================================================================
    
    # Glossary patterns - definitions and explanations
    GLOSSARY_PATTERNS = [
        r".+\s+là\s+gì",              # "X là gì"
        r"định\s+nghĩa\s+.+",         # "định nghĩa X"
        r"giải\s+thích\s+(thuật\s+ngữ|khái\s+niệm)", # "giải thích thuật ngữ/khái niệm"
        r"khái\s+niệm\s+.+",          # "khái niệm X"
        r"ý\s+nghĩa\s+(của\s+)?.+",   # "ý nghĩa của X"
        r".+\s+có\s+nghĩa\s+là\s+gì", # "X có nghĩa là gì"
        r".+\s+nghĩa\s+là\s+gì",      # "X nghĩa là gì"
        r"thế\s+nào\s+là\s+.+",       # "thế nào là X"
    ]
    
    # Legal patterns - laws and regulations (EXPANDED)
    LEGAL_PATTERNS = [
        r"điều\s+\d+",                # "Điều 10"
        r"luật\s+\w+",                # "Luật X"
        r"nghị\s+định\s*\d*",         # "Nghị định 155"
        r"thông\s+tư\s*\d*",          # "Thông tư 96"
        r"quy\s+định\s+về",           # "quy định về"
        r"điều\s+kiện\s+.+",          # "điều kiện X"
        r"thủ\s+tục\s+.+",            # "thủ tục X"
        r"pháp\s+luật",               # "pháp luật"
        r"văn\s+bản\s+pháp",          # "văn bản pháp"
        r"nghĩa\s+vụ\s+(công\s+bố|của)", # "nghĩa vụ công bố/của"
        r"yêu\s+cầu\s+pháp\s+lý",     # "yêu cầu pháp lý"
        r"quyền\s+và\s+nghĩa\s+vụ",   # "quyền và nghĩa vụ"
        r"cổ\s+đông",                 # "cổ đông" (legal context)
        r"đhcđ|đại\s+hội\s+cổ\s+đông", # "ĐHCĐ" 
        r"điều\s+lệ\s+công\s+ty",     # "điều lệ công ty"
        r"người\s+đại\s+diện\s+pháp", # "người đại diện pháp luật"
        r"giải\s+thể\s+doanh\s+nghiệp", # "giải thể doanh nghiệp"
        r"nghị\s+quyết",              # "nghị quyết"
        r"kiểm\s+toán",               # "kiểm toán"
    ]
    
    # News patterns - temporal and current events (EXPANDED)
    NEWS_PATTERNS = [
        r"hôm\s+nay",                 # "hôm nay"
        r"tuần\s+này",                # "tuần này"
        r"tháng\s+này",               # "tháng này"
        r"mới\s+nhất",                # "mới nhất"
        r"vừa\s+công\s+bố",           # "vừa công bố"
        r"tin\s+tức",                 # "tin tức"
        r"diễn\s+biến",               # "diễn biến"
        r"cập\s+nhật",                # "cập nhật"
        r"phiên\s+(sáng|chiều|giao\s+dịch)", # "phiên sáng/chiều/giao dịch"
        r"động\s+thái",               # "động thái"
        r"xu\s+hướng",                # "xu hướng"
        r"tâm\s+lý\s+thị\s+trường",   # "tâm lý thị trường"
        r"ngành\s+nào\s+đang",        # "ngành nào đang"
        r"cổ\s+phiếu\s+nào\s+đáng",   # "cổ phiếu nào đáng"
        r"khối\s+ngoại",              # "khối ngoại"
        r"dòng\s+tiền\s+đang",        # "dòng tiền đang"
        r"nhận\s+định",               # "nhận định"
        r"thống\s+kê",                # "thống kê"
        r"giá\s+(vàng|dầu)",          # "giá vàng/dầu"
        r"lãi\s+suất\s+liên\s+ngân",  # "lãi suất liên ngân hàng"
        r"tăng\s+mạnh\s+nhất",        # "tăng mạnh nhất"
        r"ngày\s+mai",                # "ngày mai"
        # Macroeconomic news
        r"fed\s+(tăng|giảm|giữ)",     # "FED tăng lãi suất"
        r"gdp\s+việt\s+nam",          # "GDP Việt Nam"
        r"lãi\s+suất\s+ngân\s+hàng",  # "lãi suất ngân hàng"
        r"ảnh\s+hưởng\s+gì",          # "ảnh hưởng gì"
        r"tin\s+về\s+lãi\s+suất",     # "tin về lãi suất"
        r"quý\s+này",                 # "quý này"
    ]
    
    # Financial patterns - company-specific data (MORE SPECIFIC)
    FINANCIAL_PATTERNS = [
        r"(p/e|pe|eps|roe|roa|p/b|pb)\s+của\s+\w+", # "P/E của VNM" (requires company)
        r"báo\s+cáo\s+tài\s+chính\s+\w+",           # "báo cáo tài chính VNM"
        r"(doanh\s+thu|lợi\s+nhuận)\s+\w+\s+\d+",   # "doanh thu VNM 2024"
        r"cổ\s+tức\s+\w+\s+(năm\s+)?\d+",           # "cổ tức VNM năm 2024"
        r"vốn\s+hóa\s+(thị\s+trường\s+)?(của\s+)?\w+", # "vốn hóa VIC"
        r"(vnm|fpt|vcb|hpg|vic|mwg|msn|tcb)\s+(có|báo|lãi)", # Company + action
        r"so\s+sánh\s+(p/e|eps|roe)",               # "so sánh P/E"
        r"(chỉ\s+số|tỷ\s+lệ).+\w{3}\s*$",           # chỉ số/tỷ lệ + ticker at end
    ]
    
    def _rule_based_route(self, query: str) -> Optional[str]:
        """
        Apply rule-based routing first.
        
        Args:
            query: User query string
            
        Returns:
            Route name if pattern matched, None otherwise.
        """
        query_lower = query.lower()
        
        # Check glossary patterns (highest priority - most specific)
        for pattern in self.GLOSSARY_PATTERNS:
            if re.search(pattern, query_lower):
                return "glossary"
        
        # Check legal patterns
        for pattern in self.LEGAL_PATTERNS:
            if re.search(pattern, query_lower):
                return "legal"
        
        # Check news patterns (temporal keywords)
        for pattern in self.NEWS_PATTERNS:
            if re.search(pattern, query_lower):
                return "news"
        
        # Check financial patterns
        for pattern in self.FINANCIAL_PATTERNS:
            if re.search(pattern, query_lower):
                return "financial"
        
        return None  # No rule match, fall through to semantic
    
    def route(self, query: str) -> Tuple[List[str], Dict[str, float]]:
        """
        Hybrid routing: rule-based first, then semantic.
        
        Args:
            query: User query string
            
        Returns:
            Tuple of (selected_routes, scores_dict)
        """
        # Always compute semantic scores
        self._ensure_initialized()
        
        query_emb = self.encoder.encode(
            query,
            normalize_embeddings=self.config.normalize_embeddings,
            show_progress_bar=False
        )
        
        scores = {}
        for route_name, route_emb in self.route_embeddings.items():
            scores[route_name] = float(np.dot(query_emb, route_emb))
        
        # Try rule-based routing
        rule_route = self._rule_based_route(query)
        
        if rule_route:
            # Boost the rule-matched route confidence
            scores[rule_route] = max(scores[rule_route], 0.95)
            
            if self.config.enable_multi_label:
                # Combine rule route with semantic for multi-label
                selected = [rule_route]
                
                # Add other high-scoring routes
                for route_name, score in sorted(scores.items(), key=lambda x: -x[1]):
                    if route_name != rule_route:
                        if score >= self.config.multi_label_threshold:
                            selected.append(route_name)
                        if len(selected) >= self.config.max_routes:
                            break
                
                return selected, scores
            else:
                return [rule_route], scores
        
        # No rule match - use semantic selection
        selected = self._select_routes(scores)
        return selected, scores
    
    def should_search_all_indices(self, query: str, scores: Dict[str, float]) -> bool:
        """
        Determine if query should search all indices.
        
        Args:
            query: User query
            scores: Route scores from routing
            
        Returns:
            True if should search all indices.
        """
        # User explicitly requests all
        explicit_keywords = ["tất cả", "toàn bộ", "mọi thông tin", "tổng hợp"]
        if any(kw in query.lower() for kw in explicit_keywords):
            return True
        
        # Very low confidence
        if max(scores.values()) < 0.50:
            return True
        
        # Very short query (ambiguous)
        if len(query.split()) <= 2:
            return True
        
        # All scores are similar (no clear winner)
        score_values = list(scores.values())
        if max(score_values) - min(score_values) < 0.15:
            return True
        
        return False


# =============================================================================
# Utility functions
# =============================================================================

def create_router(
    hybrid: bool = True,
    config: RouterConfig = None
) -> SemanticRouter:
    """
    Factory function to create a router.
    
    Args:
        hybrid: If True, create HybridRouter. Otherwise SemanticRouter.
        config: Router configuration.
        
    Returns:
        Configured router instance.
    """
    if hybrid:
        return HybridRouter(config)
    return SemanticRouter(config)
