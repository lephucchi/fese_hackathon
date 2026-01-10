"""
APScheduler runner for NewsAnalyst engine.

Manages scheduled execution of news scraping and analysis.
"""
import logging
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor

from ..config import NewsAnalystConfig
from .jobs import create_news_scraper_job, get_job_trigger

logger = logging.getLogger(__name__)


class NewsAnalystScheduler:
    """
    APScheduler wrapper for NewsAnalyst engine.
    
    Schedules and runs news scraping jobs automatically.
    """
    
    def __init__(self, config: NewsAnalystConfig, pipeline):
        """
        Initialize scheduler.
        
        Args:
            config: NewsAnalystConfig instance
            pipeline: NewsAnalystPipeline instance to run
        """
        self.config = config
        self.pipeline = pipeline
        
        # Configure job stores - use MemoryJobStore instead of SQLAlchemy
        # since we don't need persistence across restarts in container environment
        jobstores = {
            'default': MemoryJobStore()
        }
        
        # Configure executors
        executors = {
            'default': AsyncIOExecutor()
        }
        
        # Job defaults
        job_defaults = {
            'coalesce': True,  # Combine missed runs
            'max_instances': 1,  # Only one instance at a time
            'misfire_grace_time': 3600  # 1 hour grace period
        }
        
        # Create scheduler
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone=config.scheduler_timezone
        )
        
        logger.info("NewsAnalystScheduler initialized with MemoryJobStore")
    
    def start(self):
        """
        Start the scheduler.
        
        Adds news scraper job and starts scheduling.
        """
        if not self.config.enable_scheduler:
            logger.warning("Scheduler is disabled in configuration")
            return
        
        # Create job function
        job_func = create_news_scraper_job(self.pipeline)
        
        # Get trigger
        trigger = get_job_trigger(self.config)
        
        # Add job
        self.scheduler.add_job(
            func=job_func,
            trigger=trigger,
            id='news_scraper_job',
            name='News Scraper & Analyzer',
            replace_existing=True
        )
        
        # Start scheduler
        self.scheduler.start()
        
        logger.info("Scheduler started successfully")
        logger.info(f"Next run: {self.scheduler.get_jobs()[0].next_run_time}")
    
    def stop(self):
        """Stop the scheduler gracefully."""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=True)
            logger.info("Scheduler stopped")
    
    def run_now(self):
        """Manually trigger job execution immediately."""
        logger.info("Triggering manual job execution...")
        job_func = create_news_scraper_job(self.pipeline)
        asyncio.create_task(job_func())
    
    def get_status(self) -> dict:
        """
        Get scheduler status.
        
        Returns:
            Dictionary with scheduler info
        """
        jobs = self.scheduler.get_jobs()
        
        return {
            "running": self.scheduler.running,
            "jobs": len(jobs),
            "next_run": jobs[0].next_run_time if jobs else None,
            "timezone": self.config.scheduler_timezone
        }
