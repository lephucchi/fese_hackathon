"""
APScheduler job definitions and configuration.

Defines scheduled jobs for news scraping and analysis.
"""
import logging
from datetime import datetime
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


def create_news_scraper_job(pipeline):
    """
    Create news scraper job function.
    
    Args:
        pipeline: NewsAnalystPipeline instance
        
    Returns:
        Job function
    """
    async def job():
        """Execute news scraping and analysis pipeline."""
        start_time = datetime.now()
        logger.info("=" * 80)
        logger.info(f"Starting NewsAnalyst job at {start_time}")
        logger.info("=" * 80)
        
        try:
            # Run pipeline
            stats = await pipeline.run()
            
            # Log results
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info("=" * 80)
            logger.info("Job completed successfully!")
            logger.info(f"Duration: {duration:.2f} seconds")
            logger.info(f"Statistics: {stats}")
            logger.info("=" * 80)
            
        except Exception as e:
            logger.error(f"Job failed with error: {e}", exc_info=True)
            # TODO: Send notification/alert
    
    return job


def get_job_trigger(config: NewsAnalystConfig):
    """
    Get APScheduler trigger based on configuration.
    
    Args:
        config: NewsAnalystConfig instance
        
    Returns:
        APScheduler trigger (IntervalTrigger or CronTrigger)
    """
    interval_hours = config.scrape_interval_hours
    
    if interval_hours == 4:
        # Run every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
        trigger = CronTrigger(
            hour='0,4,8,12,16,20',
            minute=0,
            timezone=config.scheduler_timezone
        )
    elif interval_hours == 6:
        # Run every 6 hours: 00:00, 06:00, 12:00, 18:00
        trigger = CronTrigger(
            hour='0,6,12,18',
            minute=0,
            timezone=config.scheduler_timezone
        )
    else:
        # Fallback to interval trigger
        trigger = IntervalTrigger(
            hours=interval_hours,
            timezone=config.scheduler_timezone
        )
    
    logger.info(f"Using trigger: {trigger}")
    return trigger
