from datetime import (
    datetime,
    timezone,
)

from bson import ObjectId

from fastapi.testclient import (
    TestClient,
)

from app.dependencies.auth import (
    get_current_user,
)
from app.main import app

import app.routes.addresses as address_routes


ORIGINAL_ADDRESS_SERVICE = (
    address_routes.address_service
)


client = TestClient(
    app
)

USER_ID = ObjectId()


def fake_current_user():
    return {
        "_id":
            USER_ID,

        "email":
            "baker@example.com",

        "role":
            "customer",

        "is_active":
            True,
    }


def sample_address():
    now = datetime.now(
        timezone.utc
    )

    return {
        "id":
            "address-1",

        "label":
            "Home",

        "recipient_name":
            "Baker El Achkar",

        "phone":
            "+961 70 123 456",

        "address_line1":
            "Main Street",

        "address_line2":
            None,

        "city":
            "Tripoli",

        "region":
            "North Lebanon",

        "country":
            "Lebanon",

        "postal_code":
            None,

        "is_default":
            True,

        "created_at":
            now,

        "updated_at":
            now,
    }


class FakeAddressService:
    def __init__(
        self
    ):
        self.addresses = [
            sample_address()
        ]

    def create_address(
        self,
        user_id,
        payload,
    ):
        result = (
            sample_address()
        )

        result[
            "id"
        ] = "address-2"

        result[
            "label"
        ] = payload.label

        self.addresses.append(
            result
        )

        return result

    def list_addresses(
        self,
        user_id,
    ):
        return self.addresses

    def get_address(
        self,
        address_id,
        user_id,
    ):
        for address in (
            self.addresses
        ):
            if (
                address["id"]
                == address_id
            ):
                return address

        return None

    def update_address(
        self,
        address_id,
        user_id,
        payload,
    ):
        address = (
            self.get_address(
                address_id,
                user_id,
            )
        )

        if address is None:
            return None

        address.update(
            payload.model_dump(
                exclude_unset=True
            )
        )

        return address

    def set_default_address(
        self,
        address_id,
        user_id,
    ):
        address = (
            self.get_address(
                address_id,
                user_id,
            )
        )

        if address is None:
            return None

        for item in (
            self.addresses
        ):
            item[
                "is_default"
            ] = False

        address[
            "is_default"
        ] = True

        return address

    def delete_address(
        self,
        address_id,
        user_id,
    ):
        address = (
            self.get_address(
                address_id,
                user_id,
            )
        )

        if address is None:
            return False

        self.addresses.remove(
            address
        )

        return True


def setup_function():
    app.dependency_overrides[
        get_current_user
    ] = fake_current_user

    address_routes.address_service = (
        FakeAddressService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )

    address_routes.address_service = (
        ORIGINAL_ADDRESS_SERVICE
    )


def test_create_address():
    response = client.post(
        "/api/addresses",
        json={
            "label":
                "Work",

            "recipient_name":
                "Baker El Achkar",

            "phone":
                "+96170123456",

            "address_line1":
                "Office Street",

            "city":
                "Tripoli",

            "country":
                "Lebanon",
        },
    )

    assert (
        response.status_code
        == 201
    )


def test_list_addresses():
    response = client.get(
        "/api/addresses"
    )

    assert (
        response.status_code
        == 200
    )

    assert len(
        response.json()
    ) == 1


def test_get_address():
    response = client.get(
        "/api/addresses/address-1"
    )

    assert (
        response.status_code
        == 200
    )


def test_missing_address_returns_404():
    response = client.get(
        "/api/addresses/missing"
    )

    assert (
        response.status_code
        == 404
    )


def test_set_default_address():
    response = client.patch(
        "/api/addresses/address-1/default"
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "is_default"
        ]
        is True
    )


def test_delete_address():
    response = client.delete(
        "/api/addresses/address-1"
    )

    assert (
        response.status_code
        == 204
    )
