from server.utils.errors import raise_http_error

def validate_pagination(offset: int, limit: int, max_limit: int = 100):
    if offset < 0:
        raise_http_error(400, "Offset must be non-negative", code="INVALID_OFFSET")
    if limit <= 0:
        raise_http_error(400, "Limit must be positive", code="INVALID_LIMIT")
    if limit > max_limit:
        raise_http_error(400, f"Limit cannot exceed {max_limit}", code="LIMIT_EXCEEDED")