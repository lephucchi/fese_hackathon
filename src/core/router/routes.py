"""
Route definitions for the Semantic Router.

Each route represents a domain/index in the RAG system:
- glossary: Financial/legal terminology and definitions
- legal: Vietnamese laws and regulations  
- financial: Company financial data and metrics
- news: Market news and economic updates
"""
from dataclasses import dataclass
from typing import List


@dataclass
class Route:
    """A route definition with example utterances."""
    name: str
    description: str
    utterances: List[str]
    
    def __repr__(self):
        return f"Route(name='{self.name}', examples={len(self.utterances)})"


# =============================================================================
# Route 1: GLOSSARY - Definitions and terminology
# =============================================================================
glossary_route = Route(
    name="glossary",
    description="Financial/legal terminology and definitions - queries asking 'what is X', definitions, explanations",
    utterances=[
        # Pattern: "X là gì"
        "ROE là gì",
        "EPS là gì",
        "P/E ratio là gì",
        "vốn chủ sở hữu là gì",
        "margin là gì",
        "EBITDA là gì",
        "NAV là gì",
        "leverage là gì",
        "thanh khoản là gì",
        "beta là gì",
        "alpha là gì",
        "dividend yield là gì",
        
        # Pattern: "định nghĩa X"
        "định nghĩa vốn điều lệ",
        "định nghĩa công ty đại chúng",
        "định nghĩa cổ phiếu ưu đãi",
        "định nghĩa trái phiếu doanh nghiệp",
        "định nghĩa quỹ ETF",
        
        # Pattern: "giải thích thuật ngữ"
        "giải thích thuật ngữ leverage",
        "giải thích thuật ngữ hedging",
        "thuật ngữ NAV nghĩa là gì",
        "ý nghĩa của chỉ số P/B",
        "ý nghĩa của chỉ số ROA",
        
        # Pattern: "khái niệm X"
        "khái niệm dòng tiền tự do",
        "khái niệm chi phí vốn",
        "khái niệm rủi ro hệ thống",
        "khái niệm đa dạng hóa danh mục",
        
        # Pattern: "X có nghĩa là gì" / "X nghĩa là gì"
        "market cap có nghĩa là gì",
        "blue chip nghĩa là gì",
        "penny stock là loại cổ phiếu gì",
    ]
)

# =============================================================================
# Route 2: LEGAL - Laws and regulations
# =============================================================================
legal_route = Route(
    name="legal",
    description="Vietnamese laws, regulations, decrees - queries about legal requirements, compliance",
    utterances=[
        # Pattern: Điều + Luật
        "Điều 10 Luật Doanh nghiệp 2020",
        "Điều 5 Luật Chứng khoán 2019",
        "Điều 15 Luật Đầu tư",
        "Luật Doanh nghiệp quy định gì về cổ đông",
        "Luật Chứng khoán 2019 nói gì về IPO",
        
        # Pattern: quy định về X
        "quy định về thành lập công ty cổ phần",
        "quy định về phát hành cổ phiếu",
        "quy định về công bố thông tin",
        "quy định về giao dịch nội bộ",
        "quy định về mua bán cổ phiếu quỹ",
        "quy định về niêm yết chứng khoán",
        
        # Pattern: nghị định / thông tư
        "nghị định về thuế doanh nghiệp",
        "nghị định 155 về chứng khoán",
        "thông tư hướng dẫn IPO",
        "thông tư về công bố thông tin",
        
        # Pattern: điều kiện / thủ tục
        "điều kiện niêm yết sàn HOSE",
        "điều kiện phát hành trái phiếu",
        "thủ tục đăng ký kinh doanh",
        "thủ tục tăng vốn điều lệ",
        "thủ tục chia cổ tức",
        
        # Pattern: nghĩa vụ / yêu cầu pháp lý
        "nghĩa vụ công bố báo cáo tài chính",
        "yêu cầu pháp lý khi IPO",
        "quyền và nghĩa vụ cổ đông",
    ]
)

# =============================================================================
# Route 3: FINANCIAL - Company financial data
# =============================================================================
financial_route = Route(
    name="financial", 
    description="Company-specific financial data, metrics, reports - queries about specific company financials",
    utterances=[
        # Pattern: chỉ số + mã cổ phiếu
        "P/E của VNM",
        "EPS của FPT năm 2024",
        "ROE của VCB",
        "ROA của TCB",
        "lợi nhuận ròng của HPG",
        "doanh thu của VIC",
        "biên lợi nhuận của MWG",
        
        # Pattern: báo cáo tài chính + công ty
        "báo cáo tài chính FPT Q3/2024",
        "báo cáo tài chính VNM năm 2023",
        "kết quả kinh doanh VIC quý 4",
        "doanh thu MWG năm 2023",
        "lợi nhuận HPG 6 tháng đầu năm",
        
        # Pattern: so sánh
        "so sánh P/E của VNM và MSN",
        "so sánh ROE của các ngân hàng",
        "công ty nào có ROE cao nhất",
        "ngân hàng nào lợi nhuận cao nhất",
        
        # Pattern: dữ liệu cụ thể
        "cổ tức VNM năm 2024",
        "vốn hóa thị trường của VIC",
        "tỷ lệ nợ trên vốn của HPG",
        "số lượng cổ phiếu lưu hành FPT",
        "giá trị sổ sách VCB",
        
        # Pattern: tên công ty + chỉ số
        "Vinamilk có EPS bao nhiêu",
        "FPT có tỷ lệ nợ như thế nào",
        "Hòa Phát báo lãi bao nhiêu",
    ]
)

# =============================================================================
# Route 4: NEWS - Market news and updates
# =============================================================================
news_route = Route(
    name="news",
    description="Market news, trends, economic updates - queries with temporal keywords or about current events",
    utterances=[
        # Pattern: temporal keywords
        "tin tức chứng khoán hôm nay",
        "VN-Index hôm nay thế nào",
        "thị trường tuần này",
        "diễn biến giao dịch sáng nay",
        "thị trường phiên chiều",
        
        # Pattern: sự kiện mới
        "FPT vừa công bố gì",
        "tin mới nhất về Vingroup",
        "động thái của NHNN",
        "Fed vừa quyết định gì",
        "ĐHCĐ VNM có gì mới",
        
        # Pattern: xu hướng
        "ngành nào đang tăng trưởng",
        "cổ phiếu nào đáng chú ý",
        "tâm lý thị trường hiện tại",
        "xu hướng thị trường",
        "dòng tiền đang chảy vào đâu",
        
        # Pattern: vĩ mô
        "lạm phát tháng này",
        "tỷ giá USD/VND mới nhất",
        "FED tăng lãi suất ảnh hưởng gì",
        "GDP Việt Nam quý này",
        "CPI tháng 11",
        
        # Pattern: tin tức + chủ đề
        "tin tức bất động sản",
        "tin ngân hàng hôm nay",
        "tin về lãi suất",
        "cập nhật thị trường",
    ]
)

# =============================================================================
# All routes list
# =============================================================================
ROUTES = [glossary_route, legal_route, financial_route, news_route]

# Route name to route mapping
ROUTE_MAP = {route.name: route for route in ROUTES}


def get_route(name: str) -> Route:
    """Get route by name."""
    if name not in ROUTE_MAP:
        raise ValueError(f"Unknown route: {name}. Available: {list(ROUTE_MAP.keys())}")
    return ROUTE_MAP[name]


def get_all_route_names() -> List[str]:
    """Get all route names."""
    return [route.name for route in ROUTES]
