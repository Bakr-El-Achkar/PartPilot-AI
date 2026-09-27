from app.repositories.user_repository import UserRepository


class FakeCollection:
    def __init__(self):
        self.documents = []

    def find_one(self, query):
        for document in self.documents:
            if "email" in query and document.get("email") == query["email"]:
                return document

            if "_id" in query and document.get("_id") == query["_id"]:
                return document

        return None

    def insert_one(self, document):
        document = document.copy()
        document["_id"] = "fake-user-id"
        self.documents.append(document)

        class Result:
            inserted_id = "fake-user-id"

        return Result()

def test_find_by_email_returns_existing_user():
    collection = FakeCollection()
    collection.documents.append(
        {
            "_id": "1",
            "email": "bakr@example.com",
        }
    )

    repository = UserRepository(collection)

    user = repository.find_by_email("bakr@example.com")

    assert user["email"] == "bakr@example.com"


def test_create_user_returns_created_document():
    repository = UserRepository(FakeCollection())

    created = repository.create(
        {
            "first_name": "Bakr",
            "email": "bakr@example.com",
        }
    )

    assert created["_id"] == "fake-user-id"
    assert created["first_name"] == "Bakr"


def test_find_by_id_returns_existing_user():
    collection = FakeCollection()
    collection.documents.append(
        {
            "_id": "user-123",
            "email": "bakr@example.com",
        }
    )

    repository = UserRepository(collection)

    user = repository.find_by_id("user-123")

    assert user["_id"] == "user-123"


def find_one(self, query):
    for document in self.documents:
        if "email" in query and document.get("email") == query["email"]:
            return document

        if "_id" in query and document.get("_id") == query["_id"]:
            return document

    return None