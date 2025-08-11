from typing import Any, TypedDict


class PresignedPostFields(TypedDict):
    key: str
    policy: str


class PresignedUrlResponse(TypedDict):
    url: str
    fields: dict[str, Any]
