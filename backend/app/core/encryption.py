from cryptography.fernet import Fernet
import os

# usage: generate a key once and set it as env var ENCRYPTION_KEY
# key = Fernet.generate_key()

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_text(plaintext: str) -> str:
    return cipher_suite.encrypt(plaintext.encode()).decode()

def decrypt_text(ciphertext: str) -> str:
    return cipher_suite.decrypt(ciphertext.encode()).decode()
