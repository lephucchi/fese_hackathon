"""
Main entry point for NewsAnalyst engine.

Can run as:
- Scheduled daemon (APScheduler)
- One-time manual execution
- FastAPI background service
"""
import asyncio
import logging
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from dotenv import load_dotenv
load_dotenv()
from src.functions.NewsAnalyst.config import NewsAnalystConfig
from src.functions.NewsAnalyst.pipeline import NewsAnalystPipeline
from src.functions.NewsAnalyst.scheduler import NewsAnalystScheduler


# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/news_analyst.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


async def run_once():
    """Run pipeline once (manual execution)."""
    logger.info("Running NewsAnalyst in one-time mode...")
    
    config = NewsAnalystConfig()
    pipeline = NewsAnalystPipeline(config)
    
    stats = await pipeline.run()
    
    logger.info("=" * 80)
    logger.info("Execution completed!")
    logger.info(f"Statistics: {stats}")
    logger.info("=" * 80)


def run_scheduled():
    """Run pipeline with scheduler (daemon mode)."""
    logger.info("Starting NewsAnalyst in scheduled mode...")
    
    config = NewsAnalystConfig()
    pipeline = NewsAnalystPipeline(config)
    scheduler = NewsAnalystScheduler(config, pipeline)
    
    try:
        # Start scheduler
        scheduler.start()
        
        logger.info("Scheduler is running. Press Ctrl+C to stop.")
        logger.info(f"Status: {scheduler.get_status()}")
        
        # Keep running
        asyncio.get_event_loop().run_forever()
        
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down scheduler...")
        scheduler.stop()
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="NewsAnalyst Engine")
    parser.add_argument(
        "--mode",
        choices=["once", "scheduled"],
        default="once",
        help="Execution mode: 'once' for single run, 'scheduled' for daemon"
    )
    
    args = parser.parse_args()
    
    if args.mode == "once":
        asyncio.run(run_once())
    else:
        run_scheduled()
