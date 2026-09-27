from app.schemas.address import (
    AddressCreate,
)
from app.services.address_service import (
    AddressService,
)


class FakeRepository:
    def __init__(self):
        self.documents = []
        self.counter = 1

    def create(
        self,
        document,
    ):
        created = {
            **document,
            "_id":
                f"address-{self.counter}",
        }

        self.counter += 1

        self.documents.append(
            created
        )

        return created

    def find_by_user_id(
        self,
        user_id,
    ):
        return [
            item
            for item
            in self.documents
            if item[
                "user_id"
            ] == user_id
        ]

    def find_by_id_for_user(
        self,
        address_id,
        user_id,
    ):
        for item in self.documents:
            if (
                str(
                    item["_id"]
                )
                == address_id
                and item[
                    "user_id"
                ]
                == user_id
            ):
                return item

        return None

    def update(
        self,
        address_id,
        user_id,
        fields,
    ):
        item = (
            self.find_by_id_for_user(
                address_id,
                user_id,
            )
        )

        if item is None:
            return None

        item.update(
            fields
        )

        return item

    def delete(
        self,
        address_id,
        user_id,
    ):
        item = (
            self.find_by_id_for_user(
                address_id,
                user_id,
            )
        )

        if item is None:
            return False

        self.documents.remove(
            item
        )

        return True

    def clear_default(
        self,
        user_id,
    ):
        for item in self.documents:
            if (
                item[
                    "user_id"
                ]
                == user_id
            ):
                item[
                    "is_default"
                ] = False

    def set_default(
        self,
        address_id,
        user_id,
    ):
        item = (
            self.find_by_id_for_user(
                address_id,
                user_id,
            )
        )

        if item is None:
            return None

        self.clear_default(
            user_id
        )

        item[
            "is_default"
        ] = True

        return item


def make_payload(
    label="Home",
):
    return AddressCreate(
        label=label,
        recipient_name=(
            "Baker El Achkar"
        ),
        phone=(
            "+961 70 123 456"
        ),
        address_line1=(
            "Main Street"
        ),
        city="Tripoli",
        region=(
            "North Lebanon"
        ),
        country="Lebanon",
    )


def test_first_address_is_default():
    repository = (
        FakeRepository()
    )

    service = (
        AddressService(
            repository
        )
    )

    created = (
        service.create_address(
            "user-1",
            make_payload(),
        )
    )

    assert (
        created[
            "is_default"
        ]
        is True
    )


def test_second_address_is_not_default():
    repository = (
        FakeRepository()
    )

    service = (
        AddressService(
            repository
        )
    )

    service.create_address(
        "user-1",
        make_payload(),
    )

    second = (
        service.create_address(
            "user-1",
            make_payload(
                "Work"
            ),
        )
    )

    assert (
        second[
            "is_default"
        ]
        is False
    )


def test_set_default_switches_address():
    repository = (
        FakeRepository()
    )

    service = (
        AddressService(
            repository
        )
    )

    first = (
        service.create_address(
            "user-1",
            make_payload(),
        )
    )

    second = (
        service.create_address(
            "user-1",
            make_payload(
                "Work"
            ),
        )
    )

    service.set_default_address(
        second["id"],
        "user-1",
    )

    addresses = (
        service.list_addresses(
            "user-1"
        )
    )

    first_result = next(
        item
        for item
        in addresses
        if item["id"]
        == first["id"]
    )

    second_result = next(
        item
        for item
        in addresses
        if item["id"]
        == second["id"]
    )

    assert (
        first_result[
            "is_default"
        ]
        is False
    )

    assert (
        second_result[
            "is_default"
        ]
        is True
    )


def test_other_user_cannot_read_address():
    repository = (
        FakeRepository()
    )

    service = (
        AddressService(
            repository
        )
    )

    created = (
        service.create_address(
            "user-1",
            make_payload(),
        )
    )

    assert (
        service.get_address(
            created["id"],
            "user-2",
        )
        is None
    )
