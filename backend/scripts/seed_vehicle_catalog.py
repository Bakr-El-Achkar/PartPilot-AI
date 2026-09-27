from __future__ import annotations

import sys
from pathlib import Path


# ---------------------------------------------------------
# Allow running this file directly:
# python scripts/seed_vehicle_catalog.py
# ---------------------------------------------------------

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_ROOT),
    )


from app.core.database import database


# =========================================================
# VEHICLE CATALOG SEED
# =========================================================
#
# IMPORTANT:
# This is DEMO / DEVELOPMENT vehicle data for Vehnexa.
#
# It is NOT intended to represent authoritative OEM fitment
# or manufacturer specifications.
#
# Exact production compatibility should eventually come from
# a trusted automotive data provider / verified fitment source.
# =========================================================


CURRENT_YEAR = 2026


CATALOG_BLUEPRINT = {
    "Honda": [
        {
            "model": "Civic",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.5L I4",
                "1.8L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Accord",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.5L I4 Turbo",
                "2.0L I4",
                "2.4L I4",
                "3.0L V6",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "CR-V",
            "year_start": 1997,
            "year_end": 2026,
            "engines": [
                "2.0L I4",
                "2.4L I4",
                "1.5L I4 Turbo",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "HR-V",
            "year_start": 2015,
            "year_end": 2026,
            "engines": [
                "1.5L I4",
                "1.8L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Pilot",
            "year_start": 2003,
            "year_end": 2026,
            "engines": [
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Fit",
            "year_start": 2001,
            "year_end": 2020,
            "engines": [
                "1.3L I4",
                "1.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Odyssey",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "City",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
    ],

    "Toyota": [
        {
            "model": "Corolla",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.6L I4",
                "1.8L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Camry",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.4L I4",
                "2.5L I4",
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "RAV4",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.0L I4",
                "2.4L I4",
                "2.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Yaris",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.3L I4",
                "1.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Land Cruiser",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "4.0L V6",
                "4.6L V8",
                "4.7L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Prius",
            "year_start": 2001,
            "year_end": 2026,
            "engines": [
                "1.5L Hybrid",
                "1.8L Hybrid",
                "2.0L Hybrid",
            ],
            "transmissions": [
                "e-CVT",
            ],
        },
        {
            "model": "Hilux",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.4L Diesel",
                "2.7L I4",
                "2.8L Diesel",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Highlander",
            "year_start": 2001,
            "year_end": 2026,
            "engines": [
                "2.4L I4",
                "2.5L I4",
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
    ],

    "Nissan": [
        {
            "model": "Altima",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.0L I4",
                "2.5L I4",
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Sentra",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.6L I4",
                "1.8L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "X-Trail",
            "year_start": 2001,
            "year_end": 2026,
            "engines": [
                "2.0L I4",
                "2.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Pathfinder",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "3.5L V6",
                "4.0L V6",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Patrol",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "4.0L V6",
                "5.6L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Sunny",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.5L I4",
                "1.6L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Maxima",
            "year_start": 2000,
            "year_end": 2023,
            "engines": [
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Juke",
            "year_start": 2010,
            "year_end": 2026,
            "engines": [
                "1.0L I3 Turbo",
                "1.6L I4 Turbo",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
    ],

    "Hyundai": [
        {
            "model": "Elantra",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.6L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "DCT",
            ],
        },
        {
            "model": "Tucson",
            "year_start": 2005,
            "year_end": 2026,
            "engines": [
                "1.6L Turbo",
                "2.0L I4",
                "2.4L I4",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
        {
            "model": "Santa Fe",
            "year_start": 2001,
            "year_end": 2026,
            "engines": [
                "2.0L Turbo",
                "2.4L I4",
                "3.3L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Accent",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.4L I4",
                "1.6L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Sonata",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.6L Turbo",
                "2.0L I4",
                "2.4L I4",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
        {
            "model": "Kona",
            "year_start": 2018,
            "year_end": 2026,
            "engines": [
                "1.6L Turbo",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
        {
            "model": "Creta",
            "year_start": 2015,
            "year_end": 2026,
            "engines": [
                "1.5L I4",
                "1.6L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "i10",
            "year_start": 2008,
            "year_end": 2026,
            "engines": [
                "1.0L I3",
                "1.2L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
    ],

    "Kia": [
        {
            "model": "Sportage",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.6L Turbo",
                "2.0L I4",
                "2.4L I4",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
        {
            "model": "Cerato",
            "year_start": 2004,
            "year_end": 2026,
            "engines": [
                "1.6L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Rio",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.4L I4",
                "1.6L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Sorento",
            "year_start": 2003,
            "year_end": 2026,
            "engines": [
                "2.4L I4",
                "2.5L Turbo",
                "3.3L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Optima",
            "year_start": 2001,
            "year_end": 2020,
            "engines": [
                "2.0L Turbo",
                "2.4L I4",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "K5",
            "year_start": 2021,
            "year_end": 2026,
            "engines": [
                "1.6L Turbo",
                "2.5L Turbo",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
        {
            "model": "Picanto",
            "year_start": 2004,
            "year_end": 2026,
            "engines": [
                "1.0L I3",
                "1.2L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Seltos",
            "year_start": 2020,
            "year_end": 2026,
            "engines": [
                "1.6L Turbo",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
                "DCT",
            ],
        },
    ],

    "Ford": [
        {
            "model": "Focus",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.5L Turbo",
                "1.6L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Escape",
            "year_start": 2001,
            "year_end": 2026,
            "engines": [
                "1.5L Turbo",
                "2.0L Turbo",
                "2.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Fusion",
            "year_start": 2006,
            "year_end": 2020,
            "engines": [
                "1.5L Turbo",
                "2.0L Turbo",
                "2.5L I4",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Mustang",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.3L Turbo",
                "4.6L V8",
                "5.0L V8",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Explorer",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.3L Turbo",
                "3.0L V6",
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Edge",
            "year_start": 2007,
            "year_end": 2024,
            "engines": [
                "2.0L Turbo",
                "2.7L V6 Turbo",
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "F-150",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.7L V6 Turbo",
                "3.5L V6 Turbo",
                "5.0L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Ranger",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.3L Turbo",
                "2.5L I4",
                "3.2L Diesel",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
    ],

    "Chevrolet": [
        {
            "model": "Cruze",
            "year_start": 2009,
            "year_end": 2019,
            "engines": [
                "1.4L Turbo",
                "1.8L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Malibu",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.5L Turbo",
                "2.0L Turbo",
                "2.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Camaro",
            "year_start": 2010,
            "year_end": 2024,
            "engines": [
                "2.0L Turbo",
                "3.6L V6",
                "6.2L V8",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Tahoe",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "5.3L V8",
                "6.2L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Suburban",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "5.3L V8",
                "6.2L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Equinox",
            "year_start": 2005,
            "year_end": 2026,
            "engines": [
                "1.5L Turbo",
                "2.0L Turbo",
                "2.4L I4",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Traverse",
            "year_start": 2009,
            "year_end": 2026,
            "engines": [
                "2.5L Turbo",
                "3.6L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Silverado 1500",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.7L Turbo",
                "5.3L V8",
                "6.2L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
    ],

    "Volkswagen": [
        {
            "model": "Golf",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.4L TSI",
                "1.6L",
                "2.0L TSI",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "DSG",
            ],
        },
        {
            "model": "Passat",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.8L TSI",
                "2.0L TSI",
                "2.5L",
            ],
            "transmissions": [
                "Automatic",
                "DSG",
            ],
        },
        {
            "model": "Jetta",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.4L TSI",
                "1.8L TSI",
                "2.0L",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "DSG",
            ],
        },
        {
            "model": "Tiguan",
            "year_start": 2008,
            "year_end": 2026,
            "engines": [
                "1.4L TSI",
                "2.0L TSI",
            ],
            "transmissions": [
                "Automatic",
                "DSG",
            ],
        },
        {
            "model": "Touareg",
            "year_start": 2003,
            "year_end": 2026,
            "engines": [
                "3.0L V6",
                "3.6L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "Polo",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.0L",
                "1.2L",
                "1.4L",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "DSG",
            ],
        },
        {
            "model": "Arteon",
            "year_start": 2018,
            "year_end": 2026,
            "engines": [
                "2.0L TSI",
            ],
            "transmissions": [
                "Automatic",
                "DSG",
            ],
        },
        {
            "model": "T-Roc",
            "year_start": 2018,
            "year_end": 2026,
            "engines": [
                "1.0L TSI",
                "1.5L TSI",
                "2.0L TSI",
            ],
            "transmissions": [
                "Manual",
                "DSG",
            ],
        },
    ],

    "BMW": [
        {
            "model": "3 Series",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.0L I4 Turbo",
                "3.0L I6",
                "3.0L I6 Turbo",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "5 Series",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.0L I4 Turbo",
                "3.0L I6 Turbo",
                "4.4L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "7 Series",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "3.0L I6 Turbo",
                "4.4L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "X1",
            "year_start": 2009,
            "year_end": 2026,
            "engines": [
                "1.5L Turbo",
                "2.0L Turbo",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "X3",
            "year_start": 2004,
            "year_end": 2026,
            "engines": [
                "2.0L Turbo",
                "3.0L I6 Turbo",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "X5",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "3.0L I6 Turbo",
                "4.4L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "X6",
            "year_start": 2008,
            "year_end": 2026,
            "engines": [
                "3.0L I6 Turbo",
                "4.4L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "1 Series",
            "year_start": 2004,
            "year_end": 2026,
            "engines": [
                "1.5L Turbo",
                "2.0L Turbo",
                "3.0L I6",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
    ],

    "Mercedes-Benz": [
        {
            "model": "C-Class",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.5L Turbo",
                "2.0L Turbo",
                "3.0L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "E-Class",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.0L Turbo",
                "3.0L I6",
                "3.5L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "S-Class",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "3.0L I6",
                "4.0L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "GLA",
            "year_start": 2014,
            "year_end": 2026,
            "engines": [
                "1.3L Turbo",
                "2.0L Turbo",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
        {
            "model": "GLC",
            "year_start": 2016,
            "year_end": 2026,
            "engines": [
                "2.0L Turbo",
                "3.0L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "GLE",
            "year_start": 2015,
            "year_end": 2026,
            "engines": [
                "2.0L Turbo",
                "3.0L I6",
                "4.0L V8",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "A-Class",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.3L Turbo",
                "1.6L Turbo",
                "2.0L Turbo",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
        {
            "model": "CLA",
            "year_start": 2013,
            "year_end": 2026,
            "engines": [
                "1.3L Turbo",
                "2.0L Turbo",
            ],
            "transmissions": [
                "Automatic",
                "DCT",
            ],
        },
    ],

    "Mazda": [
        {
            "model": "Mazda3",
            "year_start": 2004,
            "year_end": 2026,
            "engines": [
                "1.5L I4",
                "2.0L I4",
                "2.5L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "Mazda6",
            "year_start": 2003,
            "year_end": 2023,
            "engines": [
                "2.0L I4",
                "2.5L I4",
                "2.5L Turbo",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "CX-3",
            "year_start": 2015,
            "year_end": 2022,
            "engines": [
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "CX-5",
            "year_start": 2012,
            "year_end": 2026,
            "engines": [
                "2.0L I4",
                "2.5L I4",
                "2.5L Turbo",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "CX-9",
            "year_start": 2007,
            "year_end": 2023,
            "engines": [
                "2.5L Turbo",
                "3.7L V6",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "MX-5",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "1.8L I4",
                "2.0L I4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
        {
            "model": "CX-30",
            "year_start": 2020,
            "year_end": 2026,
            "engines": [
                "2.0L I4",
                "2.5L I4",
                "2.5L Turbo",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
        {
            "model": "CX-50",
            "year_start": 2023,
            "year_end": 2026,
            "engines": [
                "2.5L I4",
                "2.5L Turbo",
            ],
            "transmissions": [
                "Automatic",
            ],
        },
    ],

    "Subaru": [
        {
            "model": "Forester",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.0L H4",
                "2.5L H4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Impreza",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.0L H4",
                "2.5L H4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Legacy",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.4L Turbo",
                "2.5L H4",
                "3.6L H6",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "Outback",
            "year_start": 2000,
            "year_end": 2026,
            "engines": [
                "2.4L Turbo",
                "2.5L H4",
                "3.6L H6",
            ],
            "transmissions": [
                "Automatic",
                "CVT",
            ],
        },
        {
            "model": "XV Crosstrek",
            "year_start": 2012,
            "year_end": 2023,
            "engines": [
                "2.0L H4",
                "2.5L H4",
            ],
            "transmissions": [
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "Crosstrek",
            "year_start": 2018,
            "year_end": 2026,
            "engines": [
                "2.0L H4",
                "2.5L H4",
            ],
            "transmissions": [
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "WRX",
            "year_start": 2002,
            "year_end": 2026,
            "engines": [
                "2.0L Turbo H4",
                "2.4L Turbo H4",
                "2.5L Turbo H4",
            ],
            "transmissions": [
                "Manual",
                "CVT",
            ],
        },
        {
            "model": "BRZ",
            "year_start": 2013,
            "year_end": 2026,
            "engines": [
                "2.0L H4",
                "2.4L H4",
            ],
            "transmissions": [
                "Automatic",
                "Manual",
            ],
        },
    ],
}


def build_vehicle_catalog() -> list[dict]:
    vehicles: list[dict] = []

    for make, models in CATALOG_BLUEPRINT.items():
        for model in models:
            vehicles.append(
                {
                    "make": make,
                    "model": model["model"],
                    "year_start": model["year_start"],
                    "year_end": model["year_end"],
                    "engines": model["engines"],
                    "transmissions": model["transmissions"],
                    "is_active": True,
                    "data_source": "Vehnexa demo seed",
                }
            )

    return vehicles


def seed_vehicle_catalog():
    collection = database[
        "vehicle_catalog"
    ]

    vehicle_catalog = (
        build_vehicle_catalog()
    )

    created = 0
    skipped = 0
    failed = 0

    print()
    print(
        "=========================================="
    )
    print(
        "       Vehnexa Vehicle Catalog Seed"
    )
    print(
        "=========================================="
    )

    print(
        f"Vehicle definitions : {len(vehicle_catalog)}"
    )

    print(
        f"Makes               : {len(CATALOG_BLUEPRINT)}"
    )

    print()

    # -----------------------------------------------------
    # Helpful indexes
    # -----------------------------------------------------

    collection.create_index(
        [
            ("make", 1),
            ("model", 1),
        ]
    )

    collection.create_index(
        [
            ("make", 1),
            ("model", 1),
            ("year_start", 1),
            ("year_end", 1),
        ],
        unique=True,
    )

    # -----------------------------------------------------
    # Seed records
    # -----------------------------------------------------

    for vehicle in vehicle_catalog:
        try:
            existing = (
                collection.find_one(
                    {
                        "make": vehicle[
                            "make"
                        ],
                        "model": vehicle[
                            "model"
                        ],
                        "year_start": vehicle[
                            "year_start"
                        ],
                        "year_end": vehicle[
                            "year_end"
                        ],
                    },
                    {
                        "_id": 1,
                    },
                )
            )

            if existing:
                skipped += 1

                print(
                    "[SKIPPED] "
                    f"{vehicle['make']} "
                    f"{vehicle['model']} "
                    f"({vehicle['year_start']}-"
                    f"{vehicle['year_end']}) "
                    "already exists"
                )

                continue

            collection.insert_one(
                vehicle
            )

            created += 1

            print(
                "[CREATED] "
                f"{vehicle['make']} "
                f"{vehicle['model']} "
                f"({vehicle['year_start']}-"
                f"{vehicle['year_end']})"
            )

        except Exception as exc:
            failed += 1

            print(
                "[FAILED] "
                f"{vehicle['make']} "
                f"{vehicle['model']} "
                f"-> {exc}"
            )

    print()
    print(
        "=========================================="
    )
    print(
        "                 Seed Result"
    )
    print(
        "=========================================="
    )

    print(
        f"Vehicles created : {created}"
    )

    print(
        f"Vehicles skipped : {skipped}"
    )

    print(
        f"Vehicles failed  : {failed}"
    )

    print()

    if failed == 0:
        print(
            "Vehnexa vehicle catalog seed completed successfully."
        )
    else:
        print(
            "Vehicle catalog seed completed with errors."
        )


if __name__ == "__main__":
    seed_vehicle_catalog()