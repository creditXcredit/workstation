"""API key management."""
import secrets
import hashlib
from typing import Tuple

def generate_api_key() -> Tuple[str, str]:
    """Generate a new API key and return (plain_key, hashed_key)"""
    plain_key = secrets.token_urlsafe(32)
    return plain_key, hash_api_key(plain_key)

def hash_api_key(api_key: str) -> str:
    """
    Hash an API key with a salt using PBKDF2.
    Returns salt$hash format for storage.
    """
    salt = secrets.token_bytes(32)
    hash_value = hashlib.pbkdf2_hmac('sha256', api_key.encode(), salt, 100000)
    return f"{salt.hex()}${hash_value.hex()}"

def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """Verify an API key against its stored hash."""
    try:
        salt_hex, stored_hash = hashed_key.split('$')
        salt = bytes.fromhex(salt_hex)
        computed_hash = hashlib.pbkdf2_hmac('sha256', plain_key.encode(), salt, 100000)
        return computed_hash.hex() == stored_hash
    except (ValueError, AttributeError):
        # Handle legacy SHA256 hashes for backward compatibility
        return hashlib.sha256(plain_key.encode()).hexdigest() == hashed_key
