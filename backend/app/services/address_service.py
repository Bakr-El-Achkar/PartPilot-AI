from datetime import (
    datetime,
    timezone,
)

from app.repositories.address_repository import (
    AddressRepository,
    address_repository,
)
from app.schemas.address import (
    AddressCreate,
    AddressUpdate,
)


class AddressService:
    def __init__(
        self,
        repository:
            AddressRepository,
    ):
        self.repository = (
            repository
        )

    def create_address(
        self,
        user_id: str,
        payload:
            AddressCreate,
    ) -> dict:
        now = datetime.now(
            timezone.utc
        )

        existing = (
            self.repository
            .find_by_user_id(
                user_id
            )
        )

        document = {
            "user_id":
                user_id,

            "label":
                payload.label,

            "recipient_name":
                payload.recipient_name,

            "phone":
                payload.phone,

            "address_line1":
                payload.address_line1,

            "address_line2":
                payload.address_line2,

            "city":
                payload.city,

            "region":
                payload.region,

            "country":
                payload.country,

            "postal_code":
                payload.postal_code,

            "is_default":
                len(
                    existing
                ) == 0,

            "created_at":
                now,

            "updated_at":
                now,
        }

        created = (
            self.repository.create(
                document
            )
        )

        return self._serialize(
            created
        )

    def list_addresses(
        self,
        user_id: str,
    ) -> list[dict]:
        return [
            self._serialize(
                address
            )
            for address
            in self.repository
            .find_by_user_id(
                user_id
            )
        ]

    def get_address(
        self,
        address_id: str,
        user_id: str,
    ) -> dict | None:
        address = (
            self.repository
            .find_by_id_for_user(
                address_id,
                user_id,
            )
        )

        if address is None:
            return None

        return self._serialize(
            address
        )

    def update_address(
        self,
        address_id: str,
        user_id: str,
        payload:
            AddressUpdate,
    ) -> dict | None:
        existing = (
            self.repository
            .find_by_id_for_user(
                address_id,
                user_id,
            )
        )

        if existing is None:
            return None

        fields = (
            payload.model_dump(
                exclude_unset=True
            )
        )

        fields[
            "updated_at"
        ] = datetime.now(
            timezone.utc
        )

        updated = (
            self.repository.update(
                address_id,
                user_id,
                fields,
            )
        )

        if updated is None:
            return None

        return self._serialize(
            updated
        )

    def delete_address(
        self,
        address_id: str,
        user_id: str,
    ) -> bool:
        existing = (
            self.repository
            .find_by_id_for_user(
                address_id,
                user_id,
            )
        )

        if existing is None:
            return False

        was_default = bool(
            existing.get(
                "is_default",
                False,
            )
        )

        deleted = (
            self.repository.delete(
                address_id,
                user_id,
            )
        )

        if (
            deleted
            and was_default
        ):
            remaining = (
                self.repository
                .find_by_user_id(
                    user_id
                )
            )

            if remaining:
                self.repository.set_default(
                    str(
                        remaining[0][
                            "_id"
                        ]
                    ),
                    user_id,
                )

        return deleted

    def set_default_address(
        self,
        address_id: str,
        user_id: str,
    ) -> dict | None:
        updated = (
            self.repository.set_default(
                address_id,
                user_id,
            )
        )

        if updated is None:
            return None

        return self._serialize(
            updated
        )

    @staticmethod
    def _serialize(
        address: dict,
    ) -> dict:
        return {
            "id":
                str(
                    address[
                        "_id"
                    ]
                ),

            "label":
                address[
                    "label"
                ],

            "recipient_name":
                address[
                    "recipient_name"
                ],

            "phone":
                address[
                    "phone"
                ],

            "address_line1":
                address[
                    "address_line1"
                ],

            "address_line2":
                address.get(
                    "address_line2"
                ),

            "city":
                address[
                    "city"
                ],

            "region":
                address.get(
                    "region"
                ),

            "country":
                address[
                    "country"
                ],

            "postal_code":
                address.get(
                    "postal_code"
                ),

            "is_default":
                bool(
                    address.get(
                        "is_default",
                        False,
                    )
                ),

            "created_at":
                address[
                    "created_at"
                ],

            "updated_at":
                address[
                    "updated_at"
                ],
        }


address_service = (
    AddressService(
        address_repository
    )
)
