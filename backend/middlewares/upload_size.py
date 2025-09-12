from typing import Annotated, TypeAlias
from fastapi import Depends, Request, HTTPException, status


def limit_upload_size(max_upload_size: int):
    async def dependency(request: Request):
        if request.method == "POST":
            if "content-length" not in request.headers:
                raise HTTPException(status_code=status.HTTP_411_LENGTH_REQUIRED)
            content_length = int(request.headers["content-length"])
            if content_length > max_upload_size:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                )

    return dependency


MaxUploadSize1GB = Annotated[
    None, Depends(limit_upload_size(1024 * 1024 * 1024))
]

MaxUploadSize100MB: TypeAlias = Annotated[
    None, Depends(limit_upload_size(100 * 1024 * 1024))
]
