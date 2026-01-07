"""
Base repository with common database operations.
"""
from typing import Optional, List, Any, Dict
from supabase import Client


class BaseRepository:
    """
    Base repository providing common CRUD operations.
    All repositories should inherit from this class.
    """
    
    def __init__(self, supabase: Client, table_name: str):
        """
        Initialize repository.
        
        Args:
            supabase: Supabase client instance
            table_name: Name of the table in database
        """
        self.supabase = supabase
        self.table_name = table_name
    
    async def find_by_id(self, id_field: str, id_value: Any) -> Optional[Dict[str, Any]]:
        """
        Find single record by ID.
        
        Args:
            id_field: Name of ID column
            id_value: Value to search for
            
        Returns:
            Record dict or None if not found
        """
        response = self.supabase.table(self.table_name)\
            .select("*")\
            .eq(id_field, id_value)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def find_all(
        self,
        limit: int = 100,
        offset: int = 0,
        order_by: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Find all records with pagination.
        
        Args:
            limit: Maximum records to return
            offset: Number of records to skip
            order_by: Column to order by
            
        Returns:
            List of record dicts
        """
        query = self.supabase.table(self.table_name).select("*")
        
        if order_by:
            query = query.order(order_by)
        
        response = query.limit(limit).offset(offset).execute()
        return response.data
    
    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create new record.
        
        Args:
            data: Record data
            
        Returns:
            Created record dict
        """
        response = self.supabase.table(self.table_name)\
            .insert(data)\
            .execute()
        
        return response.data[0] if response.data else {}
    
    async def update(
        self,
        id_field: str,
        id_value: Any,
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update existing record.
        
        Args:
            id_field: Name of ID column
            id_value: ID of record to update
            data: Fields to update
            
        Returns:
            Updated record dict or None
        """
        response = self.supabase.table(self.table_name)\
            .update(data)\
            .eq(id_field, id_value)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def delete(self, id_field: str, id_value: Any) -> bool:
        """
        Delete record by ID.
        
        Args:
            id_field: Name of ID column
            id_value: ID of record to delete
            
        Returns:
            True if deleted, False otherwise
        """
        response = self.supabase.table(self.table_name)\
            .delete()\
            .eq(id_field, id_value)\
            .execute()
        
        return len(response.data) > 0
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count records matching filters.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            Number of matching records
        """
        query = self.supabase.table(self.table_name).select("*", count="exact")
        
        if filters:
            for field, value in filters.items():
                query = query.eq(field, value)
        
        response = query.execute()
        return response.count if hasattr(response, 'count') else len(response.data)
