from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from server.core.exception_handlers import unexpected_error_response
from server.core.request_context import RequestContext, reset_request_context, set_request_context
from server.database.models.audit_log import (
    AUDIT_PATH_MAX_LENGTH,
    IP_ADDRESS_MAX_LENGTH,
    REQUEST_ID_MAX_LENGTH,
    USER_AGENT_MAX_LENGTH,
)
from server.utils.logger import logger

REQUEST_ID_HEADER = "X-Request-ID"


def _truncate(value: str | None, length: int) -> str | None:
    return value[:length] if value else None


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = (request.headers.get(REQUEST_ID_HEADER) or uuid4().hex)[:REQUEST_ID_MAX_LENGTH]
        request.state.request_id = request_id
        token = set_request_context(
            RequestContext(
                request_id=request_id,
                method=request.method,
                path=request.url.path[:AUDIT_PATH_MAX_LENGTH],
                ip_address=_truncate(request.client.host if request.client else None, IP_ADDRESS_MAX_LENGTH),
                user_agent=_truncate(request.headers.get("user-agent"), USER_AGENT_MAX_LENGTH),
            )
        )
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled error [%s] on %s %s", request_id, request.method, request.url.path)
            response = unexpected_error_response(request)
        finally:
            reset_request_context(token)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response
