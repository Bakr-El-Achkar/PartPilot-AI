from pydantic import BaseModel


class VehiclePreviewResponse(BaseModel):
    found: bool
    image_url: str | None = None
    thumbnail_url: str | None = None
    source_url: str | None = None
    message: str | None = None