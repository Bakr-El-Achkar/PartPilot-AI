from types import SimpleNamespace

from app.repositories.fitment_repository import (
    FitmentRepository,
)


class FakeCollection:
    def __init__(self):
        self.documents = []

    def insert_one(self, document):
        saved = document.copy()

        saved["_id"] = (
            f"fitment-{len(self.documents) + 1}"
        )

        self.documents.append(saved)

        return SimpleNamespace(
            inserted_id=saved["_id"]
        )

    def find(self, query):
        return [
            document.copy()
            for document in self.documents
            if self._matches(
                document,
                query,
            )
        ]

    def find_one(self, query):
        for document in self.documents:
            if self._matches(
                document,
                query,
            ):
                return document.copy()

        return None

    def _matches(
        self,
        document,
        query,
    ):
        for key, expected in query.items():
            if key == "$or":
                if not any(
                    self._matches(
                        document,
                        condition,
                    )
                    for condition in expected
                ):
                    return False

                continue

            actual = document.get(key)

            if isinstance(
                expected,
                dict,
            ):
                if (
                    "$lte" in expected
                    and not (
                        actual
                        <= expected["$lte"]
                    )
                ):
                    return False

                if (
                    "$gte" in expected
                    and not (
                        actual
                        >= expected["$gte"]
                    )
                ):
                    return False

                if (
                    "$in" in expected
                    and actual
                    not in expected["$in"]
                ):
                    return False

                continue

            if actual != expected:
                return False

        return True


def make_fitment(
    *,
    product_id="product-1",
    make="honda",
    model="cr-v",
    year_start=2002,
    year_end=2006,
    engine="2.4l",
    transmission="automatic",
):
    return {
        "product_id": product_id,
        "make": "Honda",
        "model": "CR-V",
        "make_normalized": make,
        "model_normalized": model,
        "year_start": year_start,
        "year_end": year_end,
        "engine": (
            None
            if engine is None
            else "2.4L"
        ),
        "engine_normalized": engine,
        "transmission": (
            None
            if transmission is None
            else "Automatic"
        ),
        "transmission_normalized": (
            transmission
        ),
        "is_active": True,
    }


def test_fitment_repository_creates_fitment():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    fitment = repository.create(
        make_fitment()
    )

    assert (
        fitment["_id"]
        == "fitment-1"
    )

    assert (
        fitment["product_id"]
        == "product-1"
    )


def test_fitment_repository_lists_product_fitments():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="product-1",
        )
    )

    repository.create(
        make_fitment(
            product_id="product-2",
        )
    )

    fitments = (
        repository.find_by_product_id(
            "product-1"
        )
    )

    assert len(fitments) == 1

    assert (
        fitments[0]["product_id"]
        == "product-1"
    )


def test_matching_vehicle_finds_exact_fitment():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="brake-pads",
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert len(matches) == 1

    assert (
        matches[0]["product_id"]
        == "brake-pads"
    )


def test_matching_vehicle_respects_year_range():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="fits",
            year_start=2002,
            year_end=2006,
        )
    )

    repository.create(
        make_fitment(
            product_id="too-new",
            year_start=2010,
            year_end=2015,
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    product_ids = {
        item["product_id"]
        for item in matches
    }

    assert "fits" in product_ids
    assert "too-new" not in product_ids


def test_matching_vehicle_rejects_wrong_make():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="honda-part",
            make="honda",
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="toyota",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert matches == []


def test_matching_vehicle_rejects_wrong_model():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="crv-part",
            model="cr-v",
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="civic",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert matches == []


def test_universal_engine_matches_vehicle():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="universal-engine",
            engine=None,
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert len(matches) == 1

    assert (
        matches[0]["product_id"]
        == "universal-engine"
    )


def test_universal_transmission_matches_vehicle():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="universal-transmission",
            transmission=None,
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert len(matches) == 1

    assert (
        matches[0]["product_id"]
        == "universal-transmission"
    )


def test_wrong_engine_does_not_match():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="wrong-engine",
            engine="1.8l",
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert matches == []


def test_wrong_transmission_does_not_match():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    repository.create(
        make_fitment(
            product_id="manual-only",
            transmission="manual",
        )
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert matches == []


def test_inactive_fitment_does_not_match():
    collection = FakeCollection()

    repository = FitmentRepository(
        collection
    )

    fitment = make_fitment(
        product_id="inactive-part",
    )

    fitment["is_active"] = False

    repository.create(
        fitment
    )

    matches = (
        repository.find_matching(
            year=2004,
            make="honda",
            model="cr-v",
            engine="2.4l",
            transmission="automatic",
        )
    )

    assert matches == []