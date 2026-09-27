import httpx

from app.core.config import settings


class VehicleImageService:
    BASE_URL = "https://api.carsxe.com/images"

    def get_vehicle_image(
        self,
        *,
        year: int,
        make: str,
        model: str,
    ) -> dict:
        if not settings.carsxe_api_key:
            return {
                "found": False,
                "image_url": None,
                "thumbnail_url": None,
                "source_url": None,
                "message": "Vehicle image service is not configured.",
            }

        params = {
            "key": settings.carsxe_api_key,
            "year": str(year),
            "make": make,
            "model": model,
            "photoType": "exterior",
            "size": "Large",
            "transparent": "true",
            "validate": "true",
            "format": "json",
        }

        try:
            response = httpx.get(
                self.BASE_URL,
                params=params,
                timeout=15.0,
            )

            response.raise_for_status()
            data = response.json()

        except httpx.HTTPStatusError as exc:
            return {
                "found": False,
                "image_url": None,
                "thumbnail_url": None,
                "source_url": None,
                "message": (
                    f"Vehicle image provider returned "
                    f"HTTP {exc.response.status_code}."
                ),
            }

        except (httpx.HTTPError, ValueError):
            return {
                "found": False,
                "image_url": None,
                "thumbnail_url": None,
                "source_url": None,
                "message": "Unable to contact vehicle image service.",
            }

        images = data.get("images", [])

        if not images:
            return {
                "found": False,
                "image_url": None,
                "thumbnail_url": None,
                "source_url": None,
                "message": "No matching vehicle image was found.",
            }

        image = images[0]

        return {
            "found": True,
            "image_url": image.get("link"),
            "thumbnail_url": image.get("thumbnailLink"),
            "source_url": image.get("contextLink"),
            "message": None,
        }


vehicle_image_service = VehicleImageService()