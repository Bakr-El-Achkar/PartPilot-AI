from datetime import (
    datetime,
    timezone,
)

from bson import ObjectId

from app.repositories.ai_mechanic_repository import (
    AIMechanicSessionRepository,
)


class FakeInsertResult:
    def __init__(
        self,
        inserted_id,
    ):
        self.inserted_id = inserted_id


class FakeUpdateResult:
    def __init__(
        self,
        matched_count=1,
    ):
        self.matched_count = matched_count


class FakeCollection:
    def __init__(self):
        self.calls = []

    def insert_one(
        self,
        document,
    ):
        inserted_id = ObjectId()

        self.calls.append(
            (
                "insert_one",
                document,
            )
        )

        return FakeInsertResult(
            inserted_id
        )

    def find_one(
        self,
        query,
    ):
        self.calls.append(
            (
                "find_one",
                query,
            )
        )

        return None

    def update_one(
        self,
        query,
        update,
    ):
        self.calls.append(
            (
                "update_one",
                query,
                update,
            )
        )

        return FakeUpdateResult()


def test_find_owned_session_scopes_to_user():
    collection = FakeCollection()

    repository = (
        AIMechanicSessionRepository(
            collection
        )
    )

    session_id = ObjectId()
    user_id = ObjectId()

    repository.find_owned_by_id(
        str(session_id),
        user_id,
    )

    assert collection.calls[0] == (
        "find_one",
        {
            "_id": session_id,
            "user_id": user_id,
        },
    )


def test_invalid_session_id_returns_none():
    collection = FakeCollection()

    repository = (
        AIMechanicSessionRepository(
            collection
        )
    )

    result = (
        repository.find_owned_by_id(
            "not-an-object-id",
            ObjectId(),
        )
    )

    assert result is None

    assert collection.calls == []


def test_create_session_inserts_document():
    collection = FakeCollection()

    repository = (
        AIMechanicSessionRepository(
            collection
        )
    )

    now = datetime.now(
        timezone.utc
    )

    document = {
        "user_id": ObjectId(),
        "vehicle_id": ObjectId(),
        "status": (
            "waiting_for_user"
        ),
        "messages": [],
        "latest_turn": None,
        "created_at": now,
        "updated_at": now,
    }

    created = repository.create(
        document
    )

    assert (
        collection.calls[0][0]
        == "insert_one"
    )

    assert (
        collection.calls[0][1]
        == document
    )

    assert "_id" in created

    assert (
        created["user_id"]
        == document["user_id"]
    )


def test_update_turn_scopes_to_session_and_user():
    collection = FakeCollection()

    repository = (
        AIMechanicSessionRepository(
            collection
        )
    )

    session_id = ObjectId()
    user_id = ObjectId()

    now = datetime.now(
        timezone.utc
    )

    messages = [
        {
            "role": "user",
            "content": (
                "The steering wheel shakes."
            ),
            "created_at": now,
        },
        {
            "role": "assistant",
            "content": (
                "Do you feel it mainly "
                "while braking?"
            ),
            "created_at": now,
        },
    ]

    latest_turn = {
        "response_type": (
            "follow_up"
        ),
        "assistant_message": (
            "I need one more detail."
        ),
        "follow_up_question": (
            "Do you feel it mainly "
            "while braking?"
        ),
        "possible_causes": [],
        "components": [],
        "safety": {
            "level": "normal",
            "message": (
                "Guidance only."
            ),
        },
    }

    repository.update_turn(
        session_id=str(
            session_id
        ),
        user_id=user_id,
        messages=messages,
        latest_turn=latest_turn,
        status=(
            "waiting_for_user"
        ),
        updated_at=now,
    )

    assert (
        collection.calls[0][0]
        == "update_one"
    )

    assert (
        collection.calls[0][1]
        == {
            "_id": session_id,
            "user_id": user_id,
        }
    )

    assert (
        collection.calls[0][2]
        == {
            "$set": {
                "messages": messages,
                "latest_turn": (
                    latest_turn
                ),
                "status": (
                    "waiting_for_user"
                ),
                "updated_at": now,
            }
        }
    )


def test_close_session_scopes_to_owner():
    collection = FakeCollection()

    repository = (
        AIMechanicSessionRepository(
            collection
        )
    )

    session_id = ObjectId()
    user_id = ObjectId()

    now = datetime.now(
        timezone.utc
    )

    repository.close(
        session_id=str(
            session_id
        ),
        user_id=user_id,
        updated_at=now,
    )

    assert (
        collection.calls[0]
        == (
            "update_one",
            {
                "_id": session_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "status": (
                        "closed"
                    ),
                    "updated_at": now,
                }
            },
        )
    )