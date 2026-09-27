from pymongo.collection import Collection

from app.core.database import database

from bson import ObjectId
from bson.errors import InvalidId

class UserRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def find_by_email(self, email: str):
        return self.collection.find_one({"email": email})

    def create(self, user_document: dict):
        document = user_document.copy()

        result = self.collection.insert_one(document)

        document["_id"] = result.inserted_id

        return document

    def find_by_id(self, user_id: str):
        try:
            object_id = ObjectId(user_id)
            return self.collection.find_one({"_id": object_id})
        except InvalidId:
            return self.collection.find_one({"_id": user_id})


user_repository = UserRepository(database["users"])