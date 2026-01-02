"""
Canonical Types for the Canonical Answer Framework (CAF).

Defines structured data types for:
- CanonicalFact: Extracted facts from documents
- Enums for domain, fact_type, relevance

SOLID Principles:
- Single Responsibility: Only defines data types
- All prompts in prompts.py
- All config in config.py
"""
from dataclasses import dataclass, asdict, field
from typing import List, Optional
from enum import Enum
import json


class FactDomain(str, Enum):
    """Domain categories for facts."""
    LEGAL = "LEGAL"
    FINANCIAL = "FINANCIAL"
    NEWS = "NEWS"
    GLOSSARY = "GLOSSARY"
    
    @classmethod
    def from_string(cls, value: str) -> "FactDomain":
        """Convert string to FactDomain, case-insensitive."""
        try:
            return cls(value.upper())
        except ValueError:
            # Default to NEWS if unknown
            return cls.NEWS


class FactType(str, Enum):
    """Types of facts that can be extracted."""
    DEFINITION = "definition"      # Định nghĩa thuật ngữ
    REGULATION = "regulation"      # Quy định pháp lý
    REQUIREMENT = "requirement"    # Điều kiện, yêu cầu
    METRIC = "metric"              # Số liệu, chỉ số
    TREND = "trend"                # Xu hướng thị trường
    EXAMPLE = "example"            # Ví dụ minh họa
    
    @classmethod
    def from_string(cls, value: str) -> "FactType":
        """Convert string to FactType."""
        try:
            return cls(value.lower())
        except ValueError:
            return cls.EXAMPLE


class Relevance(str, Enum):
    """Relevance level of a fact to the query."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    
    @classmethod
    def from_string(cls, value: str) -> "Relevance":
        """Convert string to Relevance."""
        try:
            return cls(value.upper())
        except ValueError:
            return cls.MEDIUM


@dataclass
class CanonicalFact:
    """
    A single structured fact extracted from documents.
    
    This is the core data structure of the Canonical Answer Framework.
    All facts from different domains are normalized to this schema.
    
    Attributes:
        domain: Which index/domain this fact came from
        fact_type: Type of information (definition, regulation, etc.)
        statement: The actual factual statement (1-2 sentences)
        scope: Geographic or entity scope (Vietnam, Global, Company: XYZ)
        relevance: How relevant this fact is to the query
        source_id: Citation number [1], [2], etc.
        sub_query: Which sub-query this fact answers
    
    Example:
        >>> fact = CanonicalFact(
        ...     domain=FactDomain.LEGAL,
        ...     fact_type=FactType.REQUIREMENT,
        ...     statement="Doanh nghiệp xuất nhập khẩu phải đăng ký theo Luật Doanh nghiệp 2020",
        ...     scope="Vietnam",
        ...     relevance=Relevance.HIGH,
        ...     source_id=3,
        ...     sub_query="Điều kiện thành lập công ty XNK"
        ... )
    """
    domain: FactDomain
    fact_type: FactType
    statement: str
    scope: str
    relevance: Relevance
    source_id: int
    sub_query: str
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "domain": self.domain.value,
            "fact_type": self.fact_type.value,
            "statement": self.statement,
            "scope": self.scope,
            "relevance": self.relevance.value,
            "source_id": self.source_id,
            "sub_query": self.sub_query
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "CanonicalFact":
        """Create CanonicalFact from dictionary."""
        return cls(
            domain=FactDomain.from_string(data.get("domain", "NEWS")),
            fact_type=FactType.from_string(data.get("fact_type", "example")),
            statement=data.get("statement", ""),
            scope=data.get("scope", "Vietnam"),
            relevance=Relevance.from_string(data.get("relevance", "MEDIUM")),
            source_id=int(data.get("source_id", 0)),
            sub_query=data.get("sub_query", "")
        )
    
    def __str__(self) -> str:
        """Human-readable representation."""
        return f"[{self.domain.value}:{self.fact_type.value}] {self.statement[:80]}... [{self.source_id}]"


@dataclass
class CanonicalFactList:
    """
    Container for a list of canonical facts with utility methods.
    """
    facts: List[CanonicalFact] = field(default_factory=list)
    
    def add(self, fact: CanonicalFact) -> None:
        """Add a fact to the list."""
        self.facts.append(fact)
    
    def filter_by_domain(self, domain: FactDomain) -> List[CanonicalFact]:
        """Get facts for a specific domain."""
        return [f for f in self.facts if f.domain == domain]
    
    def filter_by_relevance(self, min_relevance: Relevance = Relevance.MEDIUM) -> List[CanonicalFact]:
        """Get facts with at least the specified relevance."""
        relevance_order = {Relevance.LOW: 0, Relevance.MEDIUM: 1, Relevance.HIGH: 2}
        min_level = relevance_order[min_relevance]
        return [f for f in self.facts if relevance_order[f.relevance] >= min_level]
    
    def get_high_relevance(self) -> List[CanonicalFact]:
        """Get only HIGH relevance facts."""
        return self.filter_by_relevance(Relevance.HIGH)
    
    def group_by_domain(self) -> dict:
        """Group facts by domain."""
        result = {}
        for domain in FactDomain:
            domain_facts = self.filter_by_domain(domain)
            if domain_facts:
                result[domain] = domain_facts
        return result
    
    def to_json(self) -> str:
        """Serialize to JSON string."""
        return json.dumps([f.to_dict() for f in self.facts], ensure_ascii=False, indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> "CanonicalFactList":
        """Create from JSON string."""
        try:
            data = json.loads(json_str)
            facts = [CanonicalFact.from_dict(d) for d in data]
            return cls(facts=facts)
        except (json.JSONDecodeError, KeyError, TypeError):
            return cls(facts=[])
    
    def __len__(self) -> int:
        return len(self.facts)
    
    def __iter__(self):
        return iter(self.facts)
