import bcrypt

def hash_password(unhashed_password: str):
    hashed_password = bcrypt.hashpw(unhashed_password.encode('utf-8'), bcrypt.gensalt())
    return hashed_password.decode('utf-8')