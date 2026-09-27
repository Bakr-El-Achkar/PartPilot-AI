from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from app.core.database import database


def parse_document_id(
    value: str,
):
    try:
        return ObjectId(value)
    except InvalidId:
        return value


class CategoryRepository:
    def __init__(
        self,
        collection: Collection,
    ):
        self.collection = collection

    def create(
        self,
        category_data: dict,
    ) -> dict:
        result = self.collection.insert_one(
            category_data
        )

        category_data["_id"] = (
            result.inserted_id
        )

        return category_data

    def find_by_slug(
        self,
        slug: str,
    ):
        return self.collection.find_one(
            {
                "slug": slug,
            }
        )

    def find_by_id(
        self,
        category_id: str,
    ):
        return self.collection.find_one(
            {
                "_id": parse_document_id(
                    category_id
                ),
            }
        )

    def list_active(
        self,
    ) -> list[dict]:
        categories = self.collection.find(
            {
                "is_active": True,
            }
        )

        return list(categories)


class BrandRepository:
    def __init__(
        self,
        collection: Collection,
    ):
        self.collection = collection

    def create(
        self,
        brand_data: dict,
    ) -> dict:
        result = self.collection.insert_one(
            brand_data
        )

        brand_data["_id"] = (
            result.inserted_id
        )

        return brand_data

    def find_by_slug(
        self,
        slug: str,
    ):
        return self.collection.find_one(
            {
                "slug": slug,
            }
        )

    def find_by_id(
        self,
        brand_id: str,
    ):
        return self.collection.find_one(
            {
                "_id": parse_document_id(
                    brand_id
                ),
            }
        )

    def list_active(
        self,
    ) -> list[dict]:
        brands = self.collection.find(
            {
                "is_active": True,
            }
        )

        return list(brands)


category_repository = CategoryRepository(
    database["categories"]
)

brand_repository = BrandRepository(
    database["brands"]
)