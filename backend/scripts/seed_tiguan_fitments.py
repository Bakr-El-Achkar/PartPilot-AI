from __future__ import annotations

import argparse
from datetime import UTC, datetime

from app.core.database import (
    database,
    ping_database,
)


# ============================================================
# TARGET VEHICLE
# ============================================================

MAKE = "Volkswagen"
MODEL = "Tiguan"
YEAR = 2026
ENGINE = "2.0L TSI"
TRANSMISSION = "Automatic"


# ============================================================
# DEMO PRODUCT TYPES
#
# These are intentionally DEMO fitments.
# They are not OEM-certified fitment claims.
# ============================================================

PRODUCT_PATTERNS = [
    (
        "Brake Pads",
        r"brake pad",
    ),
    (
        "Brake Rotor",
        r"brake rotor",
    ),
    (
        "Brake Caliper",
        r"brake caliper",
    ),
    (
        "ABS Wheel Speed Sensor",
        r"(abs.*wheel speed sensor|wheel speed sensor)",
    ),
    (
        "Spark Plug",
        r"spark plug",
    ),
    (
        "Oil Filter",
        r"oil filter",
    ),
    (
        "Ignition Coil",
        r"ignition coil",
    ),
    (
        "Serpentine Belt",
        r"(serpentine|drive belt)",
    ),
    (
        "Engine Air Filter",
        r"engine air filter",
    ),
    (
        "Cabin Air Filter",
        r"cabin air filter",
    ),
    (
        "Fuel Filter",
        r"fuel filter",
    ),
    (
        "Wiper Blade",
        r"wiper blade",
    ),
    (
        "Shock Absorber",
        r"shock absorber",
    ),
    (
        "Strut Assembly",
        r"strut assembly",
    ),
    (
        "Control Arm",
        r"control arm",
    ),
    (
        "Wheel Hub Bearing",
        r"(wheel hub bearing|wheel bearing assembly)",
    ),
]


# ============================================================
# NORMALIZATION
# ============================================================

def normalize(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    cleaned = " ".join(
        value.strip().lower().split()
    )

    return cleaned or None


# ============================================================
# FIND DEMO PRODUCTS
# ============================================================

def find_candidate_products():
    products_collection = (
        database["products"]
    )

    candidates = []
    seen_ids = set()

    for (
        label,
        pattern,
    ) in PRODUCT_PATTERNS:
        product = (
            products_collection.find_one(
                {
                    "is_active": True,
                    "name": {
                        "$regex": pattern,
                        "$options": "i",
                    },
                }
            )
        )

        if product is None:
            candidates.append(
                {
                    "label": label,
                    "product": None,
                }
            )

            continue

        product_id = str(
            product["_id"]
        )

        if product_id in seen_ids:
            candidates.append(
                {
                    "label": label,
                    "product": None,
                    "reason": (
                        "matching product already "
                        "selected by another rule"
                    ),
                }
            )

            continue

        seen_ids.add(
            product_id
        )

        candidates.append(
            {
                "label": label,
                "product": product,
            }
        )

    return candidates


# ============================================================
# BUILD FITMENT
# ============================================================

def build_fitment(
    product_id: str,
) -> dict:
    now = (
        datetime.now(UTC)
        .replace(
            tzinfo=None
        )
    )

    return {
        "product_id": product_id,

        "make": MAKE,
        "model": MODEL,

        "make_normalized":
            normalize(MAKE),

        "model_normalized":
            normalize(MODEL),

        "year_start": YEAR,
        "year_end": YEAR,

        "engine": ENGINE,

        "engine_normalized":
            normalize(ENGINE),

        "transmission":
            TRANSMISSION,

        "transmission_normalized":
            normalize(
                TRANSMISSION
            ),

        "is_active": True,

        "created_at": now,
        "updated_at": now,
    }


# ============================================================
# EXISTING FITMENT CHECK
# ============================================================

def existing_fitment_query(
    product_id: str,
) -> dict:
    return {
        "product_id":
            product_id,

        "make_normalized":
            normalize(MAKE),

        "model_normalized":
            normalize(MODEL),

        "year_start":
            YEAR,

        "year_end":
            YEAR,

        "engine_normalized":
            normalize(ENGINE),

        "transmission_normalized":
            normalize(
                TRANSMISSION
            ),

        "is_active":
            True,
    }


# ============================================================
# PRINT PRODUCT
# ============================================================

def print_candidate(
    label: str,
    product: dict | None,
    reason: str | None = None,
):
    if product is None:
        print(
            f"[MISSING] {label}"
        )

        if reason:
            print(
                f"          {reason}"
            )

        return

    print(
        "[FOUND] "
        f"{label}"
    )

    print(
        "        "
        f"{product.get('name')}"
    )

    print(
        "        SKU: "
        f"{product.get('sku')}"
    )

    print(
        "        ID: "
        f"{product.get('_id')}"
    )


# ============================================================
# DRY RUN
# ============================================================

def dry_run(
    candidates,
):
    print()
    print(
        "========================================="
    )
    print(
        " DRY RUN — NO DATABASE WRITES"
    )
    print(
        "========================================="
    )

    found = 0
    missing = 0

    for candidate in candidates:
        product = candidate.get(
            "product"
        )

        print()

        print_candidate(
            candidate["label"],
            product,
            candidate.get(
                "reason"
            ),
        )

        if product:
            found += 1
        else:
            missing += 1

    print()
    print(
        "========================================="
    )
    print(
        " Dry Run Result"
    )
    print(
        "========================================="
    )

    print(
        f"Products found : {found}"
    )

    print(
        f"Products missing: {missing}"
    )

    print()
    print(
        "Nothing was written to MongoDB."
    )

    print()
    print(
        "If these products look appropriate "
        "for the Vehnexa demo, run:"
    )

    print()
    print(
        "python -m "
        "scripts.seed_tiguan_fitments "
        "--apply"
    )

    print()


# ============================================================
# APPLY
# ============================================================

def apply_fitments(
    candidates,
):
    fitments_collection = (
        database["fitments"]
    )

    created = 0
    skipped = 0
    missing = 0

    print()
    print(
        "========================================="
    )
    print(
        " APPLYING TIGUAN DEMO FITMENTS"
    )
    print(
        "========================================="
    )

    for candidate in candidates:
        label = candidate[
            "label"
        ]

        product = candidate.get(
            "product"
        )

        if product is None:
            missing += 1

            print(
                f"[MISSING] {label}"
            )

            continue

        product_id = str(
            product["_id"]
        )

        existing = (
            fitments_collection
            .find_one(
                existing_fitment_query(
                    product_id
                )
            )
        )

        if existing:
            skipped += 1

            print(
                "[SKIPPED] "
                f"{product.get('sku')} "
                f"-> {MAKE} {MODEL} "
                "already exists"
            )

            continue

        document = (
            build_fitment(
                product_id
            )
        )

        result = (
            fitments_collection
            .insert_one(
                document
            )
        )

        if result.inserted_id:
            created += 1

            print(
                "[CREATED] "
                f"{product.get('sku')} "
                f"-> {YEAR} "
                f"{MAKE} {MODEL}"
            )

        else:
            print(
                "[FAILED] "
                f"{product.get('sku')}"
            )

    print()
    print(
        "========================================="
    )
    print(
        " Seed Result"
    )
    print(
        "========================================="
    )

    print(
        f"Fitments created : {created}"
    )

    print(
        f"Fitments skipped : {skipped}"
    )

    print(
        f"Products missing : {missing}"
    )

    print()


# ============================================================
# VERIFY
# ============================================================

def verify():
    fitments_collection = (
        database["fitments"]
    )

    query = {
        "make_normalized":
            normalize(MAKE),

        "model_normalized":
            normalize(MODEL),

        "year_start": {
            "$lte": YEAR,
        },

        "year_end": {
            "$gte": YEAR,
        },

        "is_active":
            True,
    }

    total = (
        fitments_collection
        .count_documents(
            query
        )
    )

    print(
        "========================================="
    )
    print(
        " Verification"
    )
    print(
        "========================================="
    )

    print(
        f"Active {YEAR} "
        f"{MAKE} {MODEL} "
        f"fitments: {total}"
    )

    print()

    if total > 0:
        print(
            "Database now contains "
            "Tiguan demo fitments."
        )
    else:
        print(
            "No matching Tiguan fitments "
            "were found."
        )

    print()


# ============================================================
# MAIN
# ============================================================

def main():
    parser = (
        argparse.ArgumentParser()
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help=(
            "Actually insert the "
            "demo fitments."
        ),
    )

    args = (
        parser.parse_args()
    )

    print()
    print(
        "========================================="
    )
    print(
        " Vehnexa 2026 Tiguan Demo Fitments"
    )
    print(
        "========================================="
    )
    print()

    if not ping_database():
        raise RuntimeError(
            "MongoDB connection failed."
        )

    print(
        "Database connection: OK"
    )

    print(
        "Target vehicle: "
        f"{YEAR} {MAKE} {MODEL} "
        f"{ENGINE} {TRANSMISSION}"
    )

    print()
    print(
        "IMPORTANT:"
    )

    print(
        "These are Vehnexa development/demo "
        "fitments, not OEM-certified "
        "compatibility claims."
    )

    candidates = (
        find_candidate_products()
    )

    if not args.apply:
        dry_run(
            candidates
        )

        return

    apply_fitments(
        candidates
    )

    verify()


if __name__ == "__main__":
    main()