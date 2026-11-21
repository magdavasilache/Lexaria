from typing import Any

from server.core.message_keys import MessageKey, MessageParam, as_message_key, clean_params

_KEYS_BY_TYPE: dict[str, MessageKey] = {
    "missing": MessageKey.REQUIRED,
    "extra_forbidden": MessageKey.NOT_ALLOWED,
    "string_too_long": MessageKey.MAX_CHARS,
    "string_type": MessageKey.TEXT,
    "string_pattern_mismatch": MessageKey.PATTERN,
    "int_parsing": MessageKey.WHOLE_NUMBER,
    "int_type": MessageKey.WHOLE_NUMBER,
    "int_from_float": MessageKey.WHOLE_NUMBER,
    "float_parsing": MessageKey.NUMBER,
    "float_type": MessageKey.NUMBER,
    "decimal_parsing": MessageKey.NUMBER,
    "bool_parsing": MessageKey.BOOLEAN,
    "bool_type": MessageKey.BOOLEAN,
    "greater_than": MessageKey.GREATER_THAN,
    "greater_than_equal": MessageKey.AT_LEAST,
    "less_than": MessageKey.LESS_THAN,
    "less_than_equal": MessageKey.AT_MOST,
    "enum": MessageKey.ONE_OF,
    "literal_error": MessageKey.ONE_OF,
    "date_parsing": MessageKey.DATE,
    "date_type": MessageKey.DATE,
    "date_from_datetime_parsing": MessageKey.DATE,
    "datetime_parsing": MessageKey.DATETIME,
    "datetime_type": MessageKey.DATETIME,
    "url_parsing": MessageKey.URL,
    "url_type": MessageKey.URL,
    "url_scheme": MessageKey.URL,
    "list_type": MessageKey.LIST,
    "too_short": MessageKey.MIN_ITEMS,
    "too_long": MessageKey.MAX_ITEMS,
    "json_invalid": MessageKey.INVALID_JSON,
    "model_attributes_type": MessageKey.JSON_OBJECT,
    "dict_type": MessageKey.OBJECT,
    "model_type": MessageKey.JSON_OBJECT,
}


def message_for(error: dict[str, Any]) -> tuple[MessageKey, dict[str, MessageParam]]:
    error_type = error.get("type", "")
    context = error.get("ctx") or {}

    custom_key = as_message_key(error_type)
    if custom_key is not None:
        return custom_key, clean_params(context.get("params"))
    if error_type == "string_too_short":
        min_length = context.get("min_length", 1)
        if min_length <= 1:
            return MessageKey.REQUIRED, {}
        return MessageKey.MIN_CHARS, {"min_length": min_length}

    key = _KEYS_BY_TYPE.get(error_type, MessageKey.INVALID)
    return key, clean_params(context)
