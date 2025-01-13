import os
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

key = os.getenv('SECRET_SALT').encode()
if len(key) < 16:
    key = key.ljust(16, b'\0')

def encrypt_data(data: str) -> str:
    iv = get_random_bytes(AES.block_size)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_data = data + (AES.block_size - len(data) % AES.block_size) * chr(AES.block_size - len(data) % AES.block_size)
    encrypted_data = cipher.encrypt(padded_data.encode())
    encrypted_data_with_iv = iv + encrypted_data
    return base64.urlsafe_b64encode(encrypted_data_with_iv).decode()

def decrypt_data(encrypted_data: str) -> str:
    encrypted_data_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
    iv = encrypted_data_bytes[:AES.block_size]
    encrypted_data_bytes = encrypted_data_bytes[AES.block_size:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted_data = cipher.decrypt(encrypted_data_bytes).decode()
    padding_length = ord(decrypted_data[-1])
    return decrypted_data[:-padding_length]