"""
User Interaction Service - Business logic for user interactions.

Handles all interaction-related business logic between routes and repository.
"""
import logging
from typing import Dict, Any, List, Optional

from ..repositories.user_interaction_repository import UserInteractionRepository
from ..repositories.news_repository import NewsRepository

logger = logging.getLogger(__name__)


class UserInteractionService:
    """Service for user interaction operations."""
    
    def __init__(
        self,
        interaction_repository: UserInteractionRepository,
        news_repository: NewsRepository
    ):
        """
        Initialize user interaction service.
        
        Args:
            interaction_repository: UserInteractionRepository instance
            news_repository: NewsRepository instance for fetching news details
        """
        self.interaction_repo = interaction_repository
        self.news_repo = news_repository
    
    async def create_interaction(
        self,
        user_id: str,
        news_id: str,
        action_type: str
    ) -> Dict[str, Any]:
        """
        Create or update user interaction with news.
        
        Args:
            user_id: UUID of user
            news_id: UUID of news article
            action_type: Type of action (approve/reject)
            
        Returns:
            Dict with interaction info
        """
        # Check if interaction already exists
        exists = await self.interaction_repo.exists(user_id, news_id)
        
        if exists:
            # Update existing interaction
            result = await self.interaction_repo.update_action(
                user_id=user_id,
                news_id=news_id,
                action_type=action_type
            )
            message = "Interaction updated"
        else:
            # Create new interaction
            result = await self.interaction_repo.create(
                user_id=user_id,
                news_id=news_id,
                action_type=action_type
            )
            message = "Interaction saved"
        
        logger.info(f"User {user_id} {action_type}d news {news_id}")
        
        return {
            "message": message,
            "interaction_id": result.get("interaction_id", "")
        }
    
    async def get_user_interests(self, user_id: str) -> Dict[str, Any]:
        """
        Get news articles that user has approved with analyst content.
        
        Args:
            user_id: UUID of user
            
        Returns:
            Dict with news list and analysis stats
        """
        # Get approved news IDs
        news_ids = await self.interaction_repo.find_approved_news_ids(user_id)
        
        if not news_ids:
            return {
                "news": [],
                "total": 0,
                "has_analysis": 0,
                "missing_analysis": 0
            }
        
        # Fetch news with analyst content
        news_list = await self.news_repo.find_by_ids(news_ids)
        
        # Count analysis stats
        has_analysis = sum(1 for n in news_list if n.get("analyst"))
        missing_analysis = len(news_list) - has_analysis
        
        return {
            "news": news_list,
            "total": len(news_list),
            "has_analysis": has_analysis,
            "missing_analysis": missing_analysis
        }
    
    async def get_user_interactions(
        self,
        user_id: str,
        action_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Get paginated list of user's interactions.
        
        Args:
            user_id: UUID of user
            action_type: Optional filter by action type
            page: Page number
            page_size: Items per page
            
        Returns:
            Dict with interactions and pagination
        """
        offset = (page - 1) * page_size
        
        interactions = await self.interaction_repo.find_by_user(
            user_id=user_id,
            action_type=action_type,
            limit=page_size,
            offset=offset
        )
        
        total = await self.interaction_repo.count_by_user(user_id, action_type)
        
        return {
            "interactions": interactions,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_next": offset + page_size < total
        }
