from app.repositories.product_repository import ProductRepository


class FakeCursor:
    def __init__(self, documents=None):
        self.documents = list(documents or [])
        self.sort_calls = []

    def sort(self, key, direction):
        self.sort_calls.append((key, direction))
        return self

    def __iter__(self):
        return iter(self.documents)


class FakeCollection:
    def __init__(self):
        self.last_find_query = None
        self.last_aggregate_pipeline = None
        self.cursor = FakeCursor()

    def find(self, query):
        self.last_find_query = query
        return self.cursor

    def aggregate(self, pipeline):
        self.last_aggregate_pipeline = pipeline
        return []


def make_repository():
    """
    Construct ProductRepository without depending on its real MongoDB
    constructor. For these tests we only need the collection attribute.
    """
    repository = ProductRepository.__new__(ProductRepository)
    repository.collection = FakeCollection()
    return repository


def test_list_active_preserves_existing_catalog_filters():
    repository = make_repository()

    repository.list_active(
        category_id="cat-brakes",
        brand_id="brand-bosch",
        subcategory_slug="brake-pads",
    )

    assert repository.collection.last_find_query == {
        "is_active": True,
        "category_id": "cat-brakes",
        "brand_id": "brand-bosch",
        "subcategory_slug": "brake-pads",
    }


def test_list_active_searches_name_sku_part_number_and_description():
    repository = make_repository()

    repository.list_active(
        search="ceramic",
    )

    query = repository.collection.last_find_query

    assert query["is_active"] is True

    assert query["$or"] == [
        {
            "name": {
                "$regex": "ceramic",
                "$options": "i",
            }
        },
        {
            "sku": {
                "$regex": "ceramic",
                "$options": "i",
            }
        },
        {
            "part_number": {
                "$regex": "ceramic",
                "$options": "i",
            }
        },
        {
            "description": {
                "$regex": "ceramic",
                "$options": "i",
            }
        },
    ]


def test_list_active_escapes_regex_characters_in_search():
    repository = make_repository()

    repository.list_active(
        search="brake.*pad",
    )

    query = repository.collection.last_find_query

    search_clauses = query["$or"]

    for clause in search_clauses:
        field_query = next(iter(clause.values()))

        assert field_query["$regex"] == r"brake\.\*pad"
        assert field_query["$options"] == "i"


def test_list_active_applies_minimum_effective_price():
    repository = make_repository()

    repository.list_active(
        min_price=20,
    )

    query = repository.collection.last_find_query

    assert query["$expr"] == {
        "$gte": [
            {
                "$ifNull": [
                    "$sale_price",
                    "$price",
                ]
            },
            20,
        ]
    }


def test_list_active_applies_maximum_effective_price():
    repository = make_repository()

    repository.list_active(
        max_price=60,
    )

    query = repository.collection.last_find_query

    assert query["$expr"] == {
        "$lte": [
            {
                "$ifNull": [
                    "$sale_price",
                    "$price",
                ]
            },
            60,
        ]
    }


def test_list_active_applies_minimum_and_maximum_effective_price():
    repository = make_repository()

    repository.list_active(
        min_price=20,
        max_price=60,
    )

    query = repository.collection.last_find_query

    assert query["$expr"] == {
        "$and": [
            {
                "$gte": [
                    {
                        "$ifNull": [
                            "$sale_price",
                            "$price",
                        ]
                    },
                    20,
                ]
            },
            {
                "$lte": [
                    {
                        "$ifNull": [
                            "$sale_price",
                            "$price",
                        ]
                    },
                    60,
                ]
            },
        ]
    }


def test_list_active_filters_to_in_stock_products():
    repository = make_repository()

    repository.list_active(
        in_stock=True,
    )

    query = repository.collection.last_find_query

    assert query["stock_quantity"] == {
        "$gt": 0,
    }


def test_list_active_does_not_force_stock_filter_when_false():
    repository = make_repository()

    repository.list_active(
        in_stock=False,
    )

    query = repository.collection.last_find_query

    assert "stock_quantity" not in query


def test_list_active_sorts_by_rating_descending():
    repository = make_repository()

    repository.list_active(
        sort="rating",
    )

    assert repository.collection.cursor.sort_calls == [
        (
            "rating_average",
            -1,
        )
    ]


def test_list_active_sorts_by_newest_descending():
    repository = make_repository()

    repository.list_active(
        sort="newest",
    )

    assert repository.collection.cursor.sort_calls == [
        (
            "created_at",
            -1,
        )
    ]


def test_list_active_sorts_by_effective_price_ascending():
    repository = make_repository()

    repository.list_active(
        sort="price_asc",
    )

    pipeline = (
        repository.collection.last_aggregate_pipeline
    )

    assert pipeline is not None

    assert pipeline[0] == {
        "$match": {
            "is_active": True,
        }
    }

    assert pipeline[1] == {
        "$addFields": {
            "_effective_price": {
                "$ifNull": [
                    "$sale_price",
                    "$price",
                ]
            }
        }
    }

    assert pipeline[2] == {
        "$sort": {
            "_effective_price": 1,
        }
    }

    assert pipeline[3] == {
        "$unset": "_effective_price",
    }


def test_list_active_sorts_by_effective_price_descending():
    repository = make_repository()

    repository.list_active(
        sort="price_desc",
    )

    pipeline = (
        repository.collection.last_aggregate_pipeline
    )

    assert pipeline is not None

    assert pipeline[0] == {
        "$match": {
            "is_active": True,
        }
    }

    assert pipeline[1] == {
        "$addFields": {
            "_effective_price": {
                "$ifNull": [
                    "$sale_price",
                    "$price",
                ]
            }
        }
    }

    assert pipeline[2] == {
        "$sort": {
            "_effective_price": -1,
        }
    }

    assert pipeline[3] == {
        "$unset": "_effective_price",
    }


def test_recommended_sort_preserves_existing_natural_order():
    repository = make_repository()

    repository.list_active(
        sort="recommended",
    )

    assert (
        repository.collection.last_aggregate_pipeline
        is None
    )

    assert (
        repository.collection.cursor.sort_calls
        == []
    )