"""
Utility functions for the Semantic Router.
"""
import json
import time
from typing import List, Dict, Any
from pathlib import Path


def load_json(filepath: str) -> Any:
    """Load JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: Any, filepath: str, indent: int = 2):
    """Save data to JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)


def load_jsonl(filepath: str) -> List[Dict]:
    """Load JSONL file (one JSON object per line)."""
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data


def save_jsonl(data: List[Dict], filepath: str):
    """Save data to JSONL file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')


class Timer:
    """Simple timer for measuring execution time."""
    
    def __init__(self, name: str = ""):
        self.name = name
        self.start_time = None
        self.elapsed = None
    
    def __enter__(self):
        self.start_time = time.perf_counter()
        return self
    
    def __exit__(self, *args):
        self.elapsed = (time.perf_counter() - self.start_time) * 1000  # ms
        if self.name:
            print(f"[{self.name}] {self.elapsed:.2f}ms")
    
    @property
    def elapsed_ms(self) -> float:
        return self.elapsed


def benchmark_router(router, queries: List[str], n_runs: int = 3) -> Dict[str, float]:
    """
    Benchmark router performance.
    
    Args:
        router: SemanticRouter instance
        queries: List of test queries
        n_runs: Number of runs to average
        
    Returns:
        Dict with latency statistics (p50, p95, p99, mean)
    """
    import numpy as np
    
    # Warm up
    router.route(queries[0])
    
    latencies = []
    for _ in range(n_runs):
        for q in queries:
            start = time.perf_counter()
            router.route(q)
            latencies.append((time.perf_counter() - start) * 1000)
    
    return {
        "p50": float(np.percentile(latencies, 50)),
        "p95": float(np.percentile(latencies, 95)),
        "p99": float(np.percentile(latencies, 99)),
        "mean": float(np.mean(latencies)),
        "std": float(np.std(latencies)),
        "n_queries": len(queries),
        "n_runs": n_runs
    }


def format_route_result(result: Dict) -> str:
    """
    Format routing result for display.
    
    Args:
        result: Result from router.route_with_confidence()
        
    Returns:
        Formatted string.
    """
    lines = [
        f"Query: {result['query']}",
        f"Routes: {result['selected_routes']}",
        f"Confidence: {result['confidence']:.3f}",
        "Scores:"
    ]
    for route, score in sorted(result['scores'].items(), key=lambda x: -x[1]):
        marker = "✓" if route in result['selected_routes'] else " "
        lines.append(f"  {marker} {route}: {score:.3f}")
    
    return "\n".join(lines)
