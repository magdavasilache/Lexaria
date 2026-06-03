import bcrypt
from server.utils.logger import logger

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except ValueError as e:
        logger.error(f"[verify_password] Invalid bcrypt hash format: {e}")
        return False
    except Exception as e:
        logger.error(f"[verify_password] Unexpected password verification error: {e}", exc_info=True)
        return False