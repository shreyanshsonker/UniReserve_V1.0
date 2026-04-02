import os
import hashlib
import binascii

def generate_verification_token():
    """Generates a secure 64-character hex token."""
    return binascii.hexlify(os.urandom(32)).decode()

def hash_token(token):
    """(Optional) If we want to store SHA-256 traces only"""
    return hashlib.sha256(token.encode()).hexdigest()
