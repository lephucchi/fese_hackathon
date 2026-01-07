"""
Password Hashing Utilities.

Provides secure password hashing and verification using bcrypt.
"""
import warnings
from passlib.context import CryptContext

# Suppress passlib bcrypt warnings for the newer bcrypt version
warnings.filterwarnings("ignore", message=".*bcrypt.*")

# Create password context with bcrypt
# Using bcrypt__ident='2b' for compatibility with newer bcrypt versions
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Standard security level
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password (will be truncated to 72 bytes if longer)
        
    Returns:
        Hashed password string
    """
    # Bcrypt has a max input length of 72 bytes
    truncated = password[:72] if len(password.encode('utf-8')) > 72 else password
    return pwd_context.hash(truncated)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    truncated = plain_password[:72] if len(plain_password.encode('utf-8')) > 72 else plain_password
    return pwd_context.verify(truncated, hashed_password)

