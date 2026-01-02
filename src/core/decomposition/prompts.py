"""
Prompts for query decomposition using Gemini.
"""

DECOMPOSITION_SYSTEM_PROMPT = """Bạn là một chuyên gia phân tách truy vấn tài chính-pháp lý Việt Nam.

NHIỆM VỤ: Phân tách truy vấn phức tạp thành các sub-queries đơn giản, atomic.

QUY TẮC:
1. Mỗi sub-query chỉ hỏi MỘT thông tin cụ thể
2. Giữ nguyên ngữ cảnh cần thiết trong mỗi sub-query
3. Sắp xếp theo thứ tự logic (định nghĩa trước, dữ liệu sau)
4. Giữ nguyên tên công ty, mã chứng khoán, số điều luật
5. Tối đa 5 sub-queries
6. Nếu query đã đơn giản, trả về nguyên bản

PHÂN LOẠI SUB-QUERY:
- GLOSSARY: Hỏi định nghĩa, thuật ngữ (ví dụ: "ROE là gì")
- LEGAL: Hỏi quy định, luật, thủ tục (ví dụ: "Điều 10 Luật Doanh nghiệp")
- FINANCIAL: Hỏi dữ liệu tài chính cụ thể (ví dụ: "ROE của VNM năm 2024")
- NEWS: Hỏi tin tức, xu hướng, diễn biến (ví dụ: "thị trường hôm nay")"""


DECOMPOSITION_USER_TEMPLATE = """Phân tách truy vấn sau:

QUERY: {query}

Trả về JSON với format:
{{
    "original_query": "...",
    "is_decomposed": true/false,
    "sub_queries": [
        {{"query": "...", "type": "GLOSSARY/LEGAL/FINANCIAL/NEWS", "order": 1}},
        ...
    ],
    "reasoning": "Giải thích ngắn gọn tại sao phân tách như vậy"
}}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC."""


# Few-shot examples for better decomposition
DECOMPOSITION_EXAMPLES = [
    {
        "input": "ROE là gì và VNM có ROE bao nhiêu năm 2024",
        "output": {
            "original_query": "ROE là gì và VNM có ROE bao nhiêu năm 2024",
            "is_decomposed": True,
            "sub_queries": [
                {"query": "ROE là gì", "type": "GLOSSARY", "order": 1},
                {"query": "VNM có ROE bao nhiêu năm 2024", "type": "FINANCIAL", "order": 2}
            ],
            "reasoning": "Tách định nghĩa thuật ngữ (GLOSSARY) và dữ liệu tài chính cụ thể (FINANCIAL)"
        }
    },
    {
        "input": "Quy định về công bố thông tin và FPT đã công bố gì mới nhất",
        "output": {
            "original_query": "Quy định về công bố thông tin và FPT đã công bố gì mới nhất",
            "is_decomposed": True,
            "sub_queries": [
                {"query": "Quy định về công bố thông tin", "type": "LEGAL", "order": 1},
                {"query": "FPT đã công bố gì mới nhất", "type": "NEWS", "order": 2}
            ],
            "reasoning": "Tách quy định pháp lý (LEGAL) và tin tức mới nhất (NEWS)"
        }
    },
    {
        "input": "So sánh P/E của VNM và FPT, giải thích P/E là gì",
        "output": {
            "original_query": "So sánh P/E của VNM và FPT, giải thích P/E là gì",
            "is_decomposed": True,
            "sub_queries": [
                {"query": "P/E là gì", "type": "GLOSSARY", "order": 1},
                {"query": "P/E của VNM", "type": "FINANCIAL", "order": 2},
                {"query": "P/E của FPT", "type": "FINANCIAL", "order": 3}
            ],
            "reasoning": "Tách định nghĩa trước (GLOSSARY), sau đó lấy dữ liệu từng công ty để so sánh (FINANCIAL)"
        }
    },
    {
        "input": "P/E của VNM",
        "output": {
            "original_query": "P/E của VNM",
            "is_decomposed": False,
            "sub_queries": [
                {"query": "P/E của VNM", "type": "FINANCIAL", "order": 1}
            ],
            "reasoning": "Query đã đơn giản, chỉ hỏi một thông tin cụ thể"
        }
    },
    {
        "input": "Điều 10 Luật Doanh nghiệp 2020 quy định gì",
        "output": {
            "original_query": "Điều 10 Luật Doanh nghiệp 2020 quy định gì",
            "is_decomposed": False,
            "sub_queries": [
                {"query": "Điều 10 Luật Doanh nghiệp 2020 quy định gì", "type": "LEGAL", "order": 1}
            ],
            "reasoning": "Query đơn giản, hỏi một điều luật cụ thể"
        }
    },
    {
        "input": "Thị trường chứng khoán hôm nay thế nào và ngành ngân hàng có tin gì mới",
        "output": {
            "original_query": "Thị trường chứng khoán hôm nay thế nào và ngành ngân hàng có tin gì mới",
            "is_decomposed": True,
            "sub_queries": [
                {"query": "Thị trường chứng khoán hôm nay thế nào", "type": "NEWS", "order": 1},
                {"query": "Ngành ngân hàng có tin gì mới", "type": "NEWS", "order": 2}
            ],
            "reasoning": "Tách thành 2 câu hỏi tin tức riêng biệt (cùng loại NEWS)"
        }
    }
]


def build_few_shot_prompt(query: str) -> str:
    """
    Build the complete prompt with few-shot examples.
    
    Args:
        query: User query to decompose
        
    Returns:
        Complete prompt string
    """
    import json
    
    examples_text = "\n\n".join([
        f"VÍ DỤ {i+1}:\nInput: {ex['input']}\nOutput: {json.dumps(ex['output'], ensure_ascii=False, indent=2)}"
        for i, ex in enumerate(DECOMPOSITION_EXAMPLES)
    ])
    
    return f"""{DECOMPOSITION_SYSTEM_PROMPT}

{examples_text}

---

{DECOMPOSITION_USER_TEMPLATE.format(query=query)}"""
