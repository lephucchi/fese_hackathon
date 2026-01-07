"""
Base model configuration for Supabase schema models.
All models inherit from this base to ensure consistent configuration.
"""
from pydantic import BaseModel, ConfigDict


class SupabaseBaseModel(BaseModel):
    """
    Base model for all Supabase table schemas.
    Configured to work seamlessly with FastAPI and allow attribute access.
    """
    model_config = ConfigDict(from_attributes=True, extra="forbid")
