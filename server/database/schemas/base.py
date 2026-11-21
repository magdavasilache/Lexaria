from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

RawStr = Annotated[str, StringConstraints(strip_whitespace=False)]


class InputSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class OutputSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
