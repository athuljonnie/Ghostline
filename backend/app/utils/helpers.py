"""
Utility functions
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional


def hash_password(password: str) -> str:
    """
    Hash a password using SHA256
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        password: Plain text password
        password_hash: Hashed password
        
    Returns:
        True if password matches
    """
    return hash_password(password) == password_hash


def generate_session_id() -> str:
    """
    Generate a secure random session ID
    
    Returns:
        Random session ID
    """
    return secrets.token_urlsafe(32)


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """
    Format datetime as ISO string
    
    Args:
        dt: Datetime object (defaults to now)
        
    Returns:
        ISO formatted datetime string
    """
    if dt is None:
        dt = datetime.utcnow()
    return dt.isoformat()


def is_session_expired(created_at: datetime, timeout_seconds: int = 3600) -> bool:
    """
    Check if session has expired
    
    Args:
        created_at: Session creation time
        timeout_seconds: Timeout in seconds
        
    Returns:
        True if session expired
    """
    now = datetime.utcnow()
    expiry = created_at + timedelta(seconds=timeout_seconds)
    return now > expiry
