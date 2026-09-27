"use client";

import PublicNavbarAuthActions from "@/components/customer/PublicNavbarAuthActions";

import Link from "next/link";
import {
  Suspense,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  LayoutGrid,
  PackageCheck,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  UserRound,
} from "lucide-react";

import {
  ApiError,
} from "@/lib/api";
import {
  getAccessToken,
} from "@/lib/auth";
import {
  getVehicles,
  type Vehicle,
} from "@/lib/vehicles";
import {
  getBrands,
  getCategories,
  getCompatibleProducts,
  getProducts,
  type Brand,
  type Category,
  type Product,
  type ProductQuery,
  type ProductSort,
} from "@/lib/products";
import {
  addToCart,
  CART_UPDATED_EVENT,
  getCartCount,
} from "@/lib/cart";


/* ============================================================
   CONSTANTS
============================================================ */

const PRODUCTS_PER_PAGE = 8;


/* ============================================================
   PRODUCT IMAGE RULES

   Priority:
   1. product.images[0]
   2. exact component rule below
   3. Image unavailable

   There is intentionally NO generic family-level image reuse.
============================================================ */

type PartImageRule = {
  keywords: string[];
  image: string;
};


const PART_IMAGE_RULES: PartImageRule[] = [
  /* ==========================================================
     STEERING / SUSPENSION
     Local stable assets for the problem cards we identified.
  ========================================================== */

  {
    keywords: [
      "power steering pressure hose",
      "power steering hose",
      "steering pressure hose",
      "steering hose",
    ],
    image:
      "/product-parts/power-steering-pressure-hose.jpg",
  },

  {
    keywords: [
      "power steering pump",
      "steering pump",
    ],
    image:
      "/product-parts/power-steering-pump.jpg",
  },

  {
    keywords: [
      "outer tie rod end",
      "outer tie rod",
    ],
    image:
      "/product-parts/outer-tie-rod.jpg",
  },

  {
    keywords: [
      "inner tie rod end",
      "inner tie rod",
    ],
    image:
      "/product-parts/inner-tie-rod.svg",
  },

  {
    keywords: [
      "tie rod end",
      "tie rod",
    ],
    image:
      "/product-parts/outer-tie-rod.jpg",
  },

  {
    keywords: [
      "control arm",
      "lower control arm",
      "upper control arm",
    ],
    image:
      "/product-parts/control-arm.jpg",
  },

  {
    keywords: [
      "strut assembly",
      "gas strut assembly",
      "quick strut",
      "strut",
    ],
    image:
      "/product-parts/strut-assembly.jpg",
  },

  {
    keywords: [
      "shock absorber",
    ],
    image:
      "/product-parts/shock-absorber.jpg",
  },

  {
    keywords: [
      "wheel hub bearing",
      "wheel bearing assembly",
      "hub bearing",
      "wheel bearing",
      "hub assembly",
      "wheel hub assembly",
    ],
    image:
      "/product-parts/wheel-hub-bearing.jpg",
  },

  /* ==========================================================
     BODY / DOOR
  ========================================================== */

  {
    keywords: [
      "door lock actuator",
      "lock actuator",
      "door actuator",
    ],
    image:
      "https://i.ebayimg.com/images/g/yXAAAOSwh1NkZSlE/s-l1600.jpg",
  },

  /* ==========================================================
     WHEEL HARDWARE
  ========================================================== */

  {
    keywords: [
      "wheel stud",
      "lug stud",
    ],
    image:
      "https://cdn11.bigcommerce.com/s-k9b7cqysdc/images/stencil/1280w/products/4630/20037/ALL44114__08701.1654003926.jpg?c=2",
  },

  /* ==========================================================
     BRAKES
     Brand-neutral local component references.
  ========================================================== */

  {
    keywords: [
      "brake fluid",
    ],
    image:
      "/product-parts/brake-fluid.svg",
  },

  {
    keywords: [
      "wheel speed sensor",
      "abs sensor",
      "anti-lock brake sensor",
    ],
    image:
      "/product-parts/abs-wheel-speed-sensor.svg",
  },

  {
    keywords: [
      "brake pad set",
      "brake pads",
      "brake pad",
      "pad set",
    ],
    image:
      "/product-parts/brake-pad.svg",
  },

  {
    keywords: [
      "brake rotor",
      "brake disc",
      "disc rotor",
      "front rotor",
      "rear rotor",
    ],
    image:
      "/product-parts/brake-rotor.svg",
  },

  {
    keywords: [
      "brake caliper",
      "front caliper",
      "rear caliper",
    ],
    image:
      "/product-parts/brake-caliper.svg",
  },

  {
    keywords: [
      "brake hose",
      "hydraulic brake hose",
    ],
    image:
      "/product-parts/brake-hose.svg",
  },

  {
    keywords: [
      "brake master cylinder",
      "master cylinder",
    ],
    image:
      "/product-parts/brake-master-cylinder.svg",
  },

  /* ==========================================================
     SENSORS
  ========================================================== */

  {
    keywords: [
      "knock sensor",
      "detonation sensor",
    ],
    image:
      "https://http2.mlstatic.com/D_NQ_NP_937756-MLV70442296463_072023-O.webp",
  },

  {
    keywords: [
      "mass air flow sensor",
      "maf sensor",
      "air flow meter",
    ],
    image:
      "https://cdn-vs1.newpartsricambi.com/img/p/3/4/5/6/4/34564-thickbox_default.jpg",
  },

  {
    keywords: [
      "camshaft position sensor",
      "cam position sensor",
    ],
    image:
      "https://i.ebayimg.com/images/g/sJsAAOSwNPxkWQ5N/s-l1200.jpg",
  },

  {
    keywords: [
      "crankshaft position sensor",
      "crank position sensor",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1866/CFHH/SU9542/SU9542-01.jpg",
  },

  {
    keywords: [
      "oxygen sensor",
      "o2 sensor",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1866/CFHH/234-4668/234-4668-01.jpg",
  },

  /* ==========================================================
     IGNITION / ELECTRICAL
  ========================================================== */

  {
    keywords: [
      "ignition coil",
      "coil pack",
    ],
    image:
      "https://cdn.awsli.com.br/2500x2500/2695/2695989/produto/2628885593588945112.jpg",
  },

  {
    keywords: [
      "spark plug",
      "spark plugs",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1711/CFHH/4469/4469-01.jpg",
  },

  {
    keywords: [
      "alternator",
    ],
    image:
      "https://media.pkwteile.de/360_photos/15804065/h-preview.jpg",
  },

  {
    keywords: [
      "starter motor",
      "starter",
    ],
    image:
      "https://i5.walmartimages.com/seo/Starter-1-Compatible-with-2007-2012-Toyota-Yaris-1-5L-4-Cylinder-2008-2009-2010-2011_8a03c910-cf60-4e90-b8a6-367c33347cd6.b3d8839248408f10f8a021346c2f383e.jpeg",
  },

  {
    keywords: [
      "automotive battery",
      "car battery",
      "battery",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/2142/CFHH/H5-DLG/H5-DLG-01.jpg",
  },

  /* ==========================================================
     BALL JOINT
  ========================================================== */

  {
    keywords: [
      "ball joint",
    ],
    image:
      "https://cdn.pkwteile.de/thumb?ccf=94077986&id=13054050&lng=en&m=0&n=1",
  },

  /* ==========================================================
     FUEL
  ========================================================== */

  {
    keywords: [
      "fuel pump",
      "electric fuel pump",
    ],
    image:
      "https://shop4allparts.com/cdn/shop/files/dfp-0105-pic1_20_1.jpg?v=1770323560&width=416",
  },

  {
    keywords: [
      "fuel injector",
      "injector",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1866/CFHH/FJ1002/FJ1002-01.jpg",
  },

  {
    keywords: [
      "fuel filter",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1674/CFHH/FF3504DL/FF3504DL-01.jpg",
  },

  /* ==========================================================
     FILTERS
  ========================================================== */

  {
    keywords: [
      "oil filter",
      "engine oil filter",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1674/CFHH/STP-S16/STP-S16-01.jpg",
  },

  {
    keywords: [
      "cabin air filter",
      "cabin filter",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1728/CFHH/CAF1816P/CAF1816P-01.jpg",
  },

  {
    keywords: [
      "engine air filter",
      "air filter",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1728/CFHH/SA9997/SA9997-01.jpg",
  },

  /* ==========================================================
     COOLING
  ========================================================== */

  {
    keywords: [
      "upper radiator hose",
      "lower radiator hose",
      "radiator hose",
      "coolant hose",
    ],
    image:
      "https://contentinfo.autozone.com/znetcs/product-info/en/US/dyc/D71825/image/10/",
  },

  {
    keywords: [
      "water pump",
      "engine water pump",
      "premium water pump",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/2208/CFHH/US8160/US8160-04.jpg",
  },

  {
    keywords: [
      "engine thermostat",
      "thermostat",
    ],
    image:
      "https://www.alxmic.com/wp-content/uploads/2025/01/thermostat-auto.jpg",
  },

  {
    keywords: [
      "engine radiator",
      "radiator",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/2172/CFHH/B730/B730-01.jpg?imwidth=1920",
  },

  /* ==========================================================
     TRANSMISSION / DRIVETRAIN
  ========================================================== */

  {
    keywords: [
      "transmission filter",
      "automatic transmission filter",
      "transmission oil filter",
    ],
    image:
      "https://contentinfo.autozone.com/znetcs/additional-prod-images/en/US/enr/FIL-D20001/5/image/10/",
  },

  {
    keywords: [
      "cv axle",
      "cv shaft",
      "constant velocity axle",
      "drive axle",
      "axle assembly",
    ],
    image:
      "https://media.cdn.a-premium.com/2022/item/image/d32e0560de484239aee137b097732f6f_width_1600_height_600.jpg",
  },

  {
    keywords: [
      "universal joint",
      "u-joint",
      "u joint",
    ],
    image:
      "https://fa.zjwgujoint.com/zjwgujoint/2024/05/30/1-2.png",
  },

  {
    keywords: [
      "transmission mount",
      "gearbox mount",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/7948/CFHH/9890/9890-01.jpg",
  },

  /* ==========================================================
     BELTS / TIMING
  ========================================================== */

  {
    keywords: [
      "timing belt",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1769/CFHH/TCKWP329/TCKWP329-01.jpg",
  },

  {
    keywords: [
      "timing chain kit",
      "timing chain",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1769/CFHH/KT4036/KT4036-01.jpg",
  },

  {
    keywords: [
      "belt tensioner",
      "tensioner pulley",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1769/CFHH/305392/305392-01.jpg",
  },

  {
    keywords: [
      "serpentine belt",
      "drive belt",
      "accessory belt",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1769/CFHH/4060885/4060885-01.jpg",
  },

  /* ==========================================================
     ENGINE MOUNT
  ========================================================== */

  {
    keywords: [
      "engine mount",
      "motor mount",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/7948/CFHH/9954/9954-01.jpg",
  },

  /* ==========================================================
     HVAC
  ========================================================== */

  {
    keywords: [
      "a/c compressor",
      "ac compressor",
      "air conditioning compressor",
    ],
    image:
      "https://cdn.autoersatzteile.de/thumb?id=8098153&lng=fr&m=0&n=3&rev=94078007",
  },

  /* ==========================================================
     EXHAUST
  ========================================================== */

  {
    keywords: [
      "catalytic converter",
      "catalyst",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/2168/CFHH/16337/16337-01.jpg",
  },

  {
    keywords: [
      "exhaust muffler",
      "muffler",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/2168/CFHH/18954/18954-01.jpg",
  },

  /* ==========================================================
     LIGHTING
  ========================================================== */

  {
    keywords: [
      "headlight assembly",
      "headlight",
      "headlamp",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1890/CFHH/1592377/1592377-01.jpg",
  },

  {
    keywords: [
      "tail light",
      "taillight",
      "tail lamp",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1890/CFHH/1611389/1611389-01.jpg",
  },

  {
    keywords: [
      "fog light",
      "fog lamp",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1890/CFHH/1571275/1571275-01.jpg",
  },

  /* ==========================================================
     WIPERS
  ========================================================== */

  {
    keywords: [
      "wiper blade",
      "windshield wiper",
    ],
    image:
      "https://contentassets.autozone.com/product_image/USA/1736/CFHH/24A/24A-01.jpg",
  },
];


/* ============================================================
   TYPES
============================================================ */

type PriceRange =
  | "any"
  | "under50"
  | "50to100"
  | "100to200"
  | "200plus";


/* ============================================================
   PAGE
============================================================ */

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <ShopPageFallback />
      }
    >
      <ShopContent />
    </Suspense>
  );
}


/* ============================================================
   SHOP CONTENT
============================================================ */

function ShopContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();


  const reduceMotion =
    useReducedMotion();


  /* ==========================================================
     URL STATE
  ========================================================== */

  const searchValue =
    searchParams.get(
      "search",
    ) ?? "";

  const categoryId =
    searchParams.get(
      "category_id",
    ) ?? "";

  const brandId =
    searchParams.get(
      "brand_id",
    ) ?? "";

  const priceRange =
    normalizePriceRange(
      searchParams.get(
        "price",
      ),
    );

  const inStock =
    searchParams.get(
      "in_stock",
    ) === "true";

  const fitsParam = searchParams.get("fits");

  const sort =
    normalizeSort(
      searchParams.get(
        "sort",
      ),
    );

  const requestedVehicleId =
    searchParams.get(
      "vehicleId",
    );

  const requestedPage =
    normalizePage(
      searchParams.get(
        "page",
      ),
    );


  /* ==========================================================
     LOCAL STATE
  ========================================================== */

  const [
    searchInput,
    setSearchInput,
  ] = useState(
    searchValue,
  );

  const [
    products,
    setProducts,
  ] = useState<
    Product[]
  >([]);

  const [
    categories,
    setCategories,
  ] = useState<
    Category[]
  >([]);

  const [
    brands,
    setBrands,
  ] = useState<
    Brand[]
  >([]);

  const [
    vehicles,
    setVehicles,
  ] = useState<
    Vehicle[]
  >([]);

  const [
    compatibleProducts,
    setCompatibleProducts,
  ] = useState<
    Product[]
  >([]);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(
    true,
  );

  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(
    true,
  );

  const [
    garageLoading,
    setGarageLoading,
  ] = useState(
    true,
  );

  const [
    compatibilityLoading,
    setCompatibilityLoading,
  ] = useState(
    false,
  );

  const [
    productError,
    setProductError,
  ] = useState("");

  const [
    catalogError,
    setCatalogError,
  ] = useState("");

  const [
    garageError,
    setGarageError,
  ] = useState("");

  const [
    compatibilityError,
    setCompatibilityError,
  ] = useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(
    0,
  );

  const [
    cartCount,
    setCartCount,
  ] = useState(
    0,
  );

  const [
    addedProductId,
    setAddedProductId,
  ] = useState<
    string | null
  >(null);


  /* ==========================================================
     QUERY HELPER
  ========================================================== */

  const replaceQuery =
    useCallback(
      (
        updates: Record<
          string,
          string | null
        >,
      ) => {
        const params =
          new URLSearchParams(
            searchParams.toString(),
          );

        Object.entries(
          updates,
        ).forEach(
          ([
            key,
            value,
          ]) => {
            if (
              value === null ||
              value === ""
            ) {
              params.delete(
                key,
              );
            } else {
              params.set(
                key,
                value,
              );
            }
          },
        );

        const query =
          params.toString();

        router.replace(
          query
            ? `/shop?${query}`
            : "/shop",
          {
            scroll: false,
          },
        );
      },
      [
        router,
        searchParams,
      ],
    );


  /* ==========================================================
     SEARCH DEBOUNCE
  ========================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const value =
            searchInput.trim();

          if (
            value ===
            searchValue
          ) {
            return;
          }

          replaceQuery({
            search:
              value ||
              null,
            page: null,
          });
        },
        350,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    replaceQuery,
    searchInput,
    searchValue,
  ]);


  /* ==========================================================
     CART COUNT
  ========================================================== */

  useEffect(() => {
    function syncCartCount() {
      setCartCount(
        getCartCount(),
      );
    }

    syncCartCount();

    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCartCount,
    );

    window.addEventListener(
      "storage",
      syncCartCount,
    );

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCartCount,
      );

      window.removeEventListener(
        "storage",
        syncCartCount,
      );
    };
  }, []);


  /* ==========================================================
     LOAD CATEGORIES + BRANDS
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      try {
        setCatalogLoading(
          true,
        );

        setCatalogError(
          "",
        );

        const [
          categoryResult,
          brandResult,
        ] =
          await Promise.all([
            getCategories(),
            getBrands(),
          ]);

        if (
          cancelled
        ) {
          return;
        }

        setCategories(
          categoryResult,
        );

        setBrands(
          brandResult,
        );
      } catch (error) {
        if (
          cancelled
        ) {
          return;
        }

        setCatalogError(
          error instanceof
            ApiError
            ? error.message
            : "Unable to load catalog filters.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setCatalogLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    refreshKey,
  ]);


  /* ==========================================================
     PRODUCT QUERY
  ========================================================== */

  const productQuery =
    useMemo<
      ProductQuery
    >(() => {
      const query:
        ProductQuery = {
        sort,
      };

      if (
        searchValue
      ) {
        query.search =
          searchValue;
      }

      if (
        categoryId
      ) {
        query.category_id =
          categoryId;
      }

      if (
        brandId
      ) {
        query.brand_id =
          brandId;
      }

      const prices =
        getPriceRangeValues(
          priceRange,
        );

      if (
        prices.min !==
        undefined
      ) {
        query.min_price =
          prices.min;
      }

      if (
        prices.max !==
        undefined
      ) {
        query.max_price =
          prices.max;
      }

      if (
        inStock
      ) {
        query.in_stock =
          true;
      }

      return query;
    }, [
      sort,
      searchValue,
      categoryId,
      brandId,
      priceRange,
      inStock,
    ]);


  /* ==========================================================
     LOAD PRODUCTS
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      try {
        setProductsLoading(
          true,
        );

        setProductError(
          "",
        );

        const result =
          await getProducts(
            productQuery,
          );

        if (
          cancelled
        ) {
          return;
        }

        setProducts(
          result,
        );
      } catch (error) {
        if (
          cancelled
        ) {
          return;
        }

        setProductError(
          error instanceof
            ApiError
            ? error.message
            : "Unable to load products.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setProductsLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    productQuery,
    refreshKey,
  ]);


  /* ==========================================================
     LOAD GARAGE
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      const token =
        getAccessToken();

      if (
        !token
      ) {
        if (
          !cancelled
        ) {
          setVehicles(
            [],
          );

          setGarageError(
            "",
          );

          setGarageLoading(
            false,
          );
        }

        return;
      }

      const accessToken =
        token;

      try {
        setGarageLoading(
          true,
        );

        setGarageError(
          "",
        );

        const result =
          await getVehicles(
            accessToken,
          );

        if (
          cancelled
        ) {
          return;
        }

        setVehicles(
          result,
        );
      } catch (error) {
        if (
          cancelled
        ) {
          return;
        }

        setVehicles(
          [],
        );

        setGarageError(
          error instanceof
            ApiError
            ? error.message
            : "Unable to load your Garage.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setGarageLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    refreshKey,
  ]);


  /* ==========================================================
     SELECT VEHICLE
  ========================================================== */

  const selectedVehicle =
    useMemo(() => {
      if (
        requestedVehicleId
      ) {
        const requested =
          vehicles.find(
            (vehicle) =>
              vehicle.id ===
              requestedVehicleId,
          );

        if (
          requested
        ) {
          return requested;
        }
      }

      return (
        vehicles.find(
          (vehicle) =>
            vehicle.is_active,
        ) ?? null
      );
    }, [
      requestedVehicleId,
      vehicles,
    ]);


  /* ==========================================================
     LOAD COMPATIBILITY
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      const token =
        getAccessToken();

      const vehicle =
        selectedVehicle;

      if (
        !token ||
        !vehicle
      ) {
        if (
          !cancelled
        ) {
          setCompatibleProducts(
            [],
          );

          setCompatibilityError(
            "",
          );

          setCompatibilityLoading(
            false,
          );
        }

        return;
      }

      const accessToken =
        token;

      const vehicleId =
        vehicle.id;

      try {
        setCompatibilityLoading(
          true,
        );

        setCompatibilityError(
          "",
        );

        const result =
          await getCompatibleProducts(
            accessToken,
            vehicleId,
          );

        if (
          cancelled
        ) {
          return;
        }

        setCompatibleProducts(
          result,
        );
      } catch (error) {
        if (
          cancelled
        ) {
          return;
        }

        setCompatibleProducts(
          [],
        );

        setCompatibilityError(
          error instanceof
            ApiError
            ? error.message
            : "Unable to load vehicle compatibility.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setCompatibilityLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    selectedVehicle,
    refreshKey,
  ]);


  /* ==========================================================
     COMPATIBLE IDS
  ========================================================== */

  const compatibleIds =
    useMemo(
      () =>
        new Set(
          compatibleProducts.map(
            (product) =>
              product.id,
          ),
        ),
      [
        compatibleProducts,
      ],
    );


  const fitsOnly =
    Boolean(
      selectedVehicle,
    ) &&
    fitsParam !== "false" &&
    !compatibilityError;


  const visibleProducts =
    useMemo(() => {
      if (
        !fitsOnly
      ) {
        return products;
      }

      return products.filter(
        (product) =>
          compatibleIds.has(
            product.id,
          ),
      );
    }, [
      products,
      fitsOnly,
      compatibleIds,
    ]);


  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        visibleProducts.length /
          PRODUCTS_PER_PAGE,
      ),
    );

  const currentPage =
    Math.min(
      requestedPage,
      totalPages,
    );

  const pageStart =
    (
      currentPage -
      1
    ) *
    PRODUCTS_PER_PAGE;

  const pageEnd =
    Math.min(
      pageStart +
        PRODUCTS_PER_PAGE,
      visibleProducts.length,
    );

  const paginatedProducts =
    visibleProducts.slice(
      pageStart,
      pageEnd,
    );


  /* ==========================================================
     BRAND LOOKUP
  ========================================================== */

  const brandNames =
    useMemo(
      () =>
        new Map(
          brands.map(
            (brand) => [
              brand.id,
              brand.name,
            ],
          ),
        ),
      [
        brands,
      ],
    );


  /* ==========================================================
     CART ACTION
  ========================================================== */

  function handleAddToCart(
    product: Product,
  ) {
    if (
      product.stock_quantity <=
      0
    ) {
      return;
    }


    const token =
      getAccessToken();


    if (!token) {
      router.push(
        "/login",
      );

      return;
    }


    addToCart(
      product,
    );

    setCartCount(
      getCartCount(),
    );

    setAddedProductId(
      product.id,
    );

    window.setTimeout(
      () => {
        setAddedProductId(
          (current) =>
            current ===
            product.id
              ? null
              : current,
        );
      },
      900,
    );
  }


  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  function clearFilters() {
    setSearchInput(
      "",
    );

    const params =
      new URLSearchParams(
        searchParams.toString(),
      );

    [
      "search",
      "category_id",
      "brand_id",
      "price",
      "in_stock",
      "fits",
      "sort",
      "page",
    ].forEach(
      (key) => {
        params.delete(
          key,
        );
      },
    );

    const query =
      params.toString();

    router.replace(
      query
        ? `/shop?${query}`
        : "/shop",
      {
        scroll: false,
      },
    );
  }


  /* ==========================================================
     PAGE CHANGE
  ========================================================== */

  function changePage(
    nextPage: number,
  ) {
    const safe =
      Math.min(
        Math.max(
          nextPage,
          1,
        ),
        totalPages,
      );

    replaceQuery({
      page:
        safe === 1
          ? null
          : String(
              safe,
            ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  const activeFilterCount =
    [
      Boolean(
        searchValue,
      ),

      Boolean(
        categoryId,
      ),

      Boolean(
        brandId,
      ),

      priceRange !==
        "any",

      inStock,

      Boolean(
        selectedVehicle,
      ) &&
        fitsOnly,
    ].filter(
      Boolean,
    ).length;


  /* ==========================================================
     FILTER PANEL
  ========================================================== */

  const filterPanel = (
    <FilterPanel
      categories={
        categories
      }
      brands={
        brands
      }
      catalogLoading={
        catalogLoading
      }
      categoryId={
        categoryId
      }
      brandId={
        brandId
      }
      priceRange={
        priceRange
      }
      inStock={
        inStock
      }
      fitsOnly={
        fitsOnly
      }
      selectedVehicle={
        selectedVehicle
      }
      compatibilityLoading={
        compatibilityLoading
      }
      compatibilityError={
        compatibilityError
      }
      onCategoryChange={(
        value,
      ) => {
        replaceQuery({
          category_id:
            value ||
            null,
          page: null,
        });
      }}
      onBrandChange={(
        value,
      ) => {
        replaceQuery({
          brand_id:
            value ||
            null,
          page: null,
        });
      }}
      onPriceChange={(
        value,
      ) => {
        replaceQuery({
          price:
            value ===
            "any"
              ? null
              : value,
          page: null,
        });
      }}
      onStockChange={(
        checked,
      ) => {
        replaceQuery({
          in_stock:
            checked
              ? "true"
              : null,
          page: null,
        });
      }}
      onFitsChange={(
        checked,
      ) => {
        replaceQuery({
          fits: checked ? "true" : "false",
          page: null,
        });
      }}
      onClear={
        clearFilters
      }
    />
  );


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f4f7] text-[#101828]">
      <VehnexaNavbar
        cartCount={
          cartCount
        }
      />


      {/* ======================================================
          MARKETPLACE HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.065] [background-image:linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.28)_1px,transparent_1px)] [background-size:68px_68px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[240px] -top-[260px] h-[720px] w-[720px] rounded-full bg-[#e31b2d]/15 blur-[120px]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-[300px] left-[18%] h-[560px] w-[720px] rounded-full bg-[#2e75ad]/10 blur-[150px]"
        />


        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [
                    -80,
                    40,
                    -80,
                  ],

                  opacity: [
                    0.20,
                    0.42,
                    0.20,
                  ],
                }
          }
          transition={{
            duration:
              11,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          }}
          className="absolute bottom-[6%] left-[10%] h-[3px] w-[55%] rotate-[-7deg] bg-gradient-to-r from-transparent via-[#e31b2d]/50 to-transparent blur-[2px]"
        />


        <div className="relative mx-auto max-w-[1480px] px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div className="max-w-[850px]">
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        y:
                          22,

                        scale:
                          0.98,
                      }
                }
                animate={{
                  y:
                    0,

                  scale:
                    1,
                }}
                transition={{
                  duration:
                    0.6,

                  ease:
                    "easeOut",
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 backdrop-blur"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#ff4b5a]" />

                <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[#d3dde5]">
                  VEH NEXA PARTS MARKETPLACE
                </span>
              </motion.div>


              <motion.h1
                initial={
                  reduceMotion
                    ? false
                    : {
                        y:
                          36,
                      }
                }
                animate={{
                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.08,

                  duration:
                    0.7,

                  ease:
                    "easeOut",
                }}
                className="mt-6 max-w-[900px] text-[48px] font-black leading-[0.93] tracking-[-0.058em] sm:text-[64px] lg:text-[76px]"
              >
                Find the part.
                <br />

                <span className="text-[#ff394a]">
                  Keep moving.
                </span>
              </motion.h1>


              <p className="mt-7 max-w-[670px] text-[12px] leading-6 text-[#abb9c5] sm:text-[13px]">
                Search the Vehnexa catalog,
                narrow it by category, brand,
                price and stock, and use your
                Garage when you want
                vehicle-aware compatibility.
              </p>


              {/* Main search */}
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        y:
                          25,

                        scale:
                          0.985,
                      }
                }
                animate={{
                  y:
                    0,

                  scale:
                    1,
                }}
                transition={{
                  delay:
                    0.17,

                  duration:
                    0.65,
                }}
                className="relative mt-9 max-w-[760px]"
              >
                <Search className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#98a2b3]" />

                <input
                  id="shop-search"
                  type="search"
                  value={
                    searchInput
                  }
                  onChange={(
                    event,
                  ) => {
                    setSearchInput(
                      event.target.value,
                    );
                  }}
                  placeholder="Search parts, brands, components, or symptoms..."
                  className="h-[62px] w-full rounded-[11px] border border-white/15 bg-white pl-14 pr-5 text-[12px] font-medium text-[#25303b] shadow-[0_22px_60px_rgba(0,0,0,.28)] outline-none transition placeholder:text-[#98a2b3] focus:border-[#ec5a67] focus:ring-4 focus:ring-[#e31b2d]/10 sm:text-[13px]"
                />
              </motion.div>


              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[8px] font-bold uppercase tracking-[0.13em] text-[#6f8394]">
                  Search shortcuts
                </span>

                {[
                  "brake",
                  "suspension",
                  "filter",
                  "sensor",
                ].map(
                  (
                    term,
                  ) => (
                    <button
                      key={
                        term
                      }
                      type="button"
                      onClick={() => {
                        setSearchInput(
                          term,
                        );
                      }}
                      className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[8px] font-semibold capitalize text-[#b8c6d0] transition hover:border-[#e31b2d]/40 hover:bg-[#e31b2d]/10 hover:text-white"
                    >
                      {
                        term
                      }
                    </button>
                  ),
                )}
              </div>
            </div>


            {/* Marketplace status card */}
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      x:
                        40,

                      scale:
                        0.97,
                    }
              }
              animate={{
                x:
                  0,

                scale:
                  1,
              }}
              transition={{
                delay:
                  0.22,

                duration:
                  0.7,
              }}
              className="hidden lg:block"
            >
              <div className="overflow-hidden rounded-[18px] border border-white/[0.10] bg-white/[0.055] p-5 shadow-[0_30px_80px_rgba(0,0,0,.24)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#74899a]">
                      MARKETPLACE STATUS
                    </p>

                    <p className="mt-1 text-[13px] font-bold text-white">
                      Catalog connected
                    </p>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#5dc48e]/20 bg-[#5dc48e]/10 text-[#68d69d]">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                </div>


                <div className="mt-6 grid grid-cols-2 gap-2">
                  <MarketplaceMetric
                    label="Matching"
                    value={
                      productsLoading
                        ? "..."
                        : String(
                            visibleProducts.length,
                          )
                    }
                  />

                  <MarketplaceMetric
                    label="Page"
                    value={`${currentPage}/${totalPages}`}
                  />

                  <MarketplaceMetric
                    label="Filters"
                    value={
                      String(
                        activeFilterCount,
                      )
                    }
                  />

                  <MarketplaceMetric
                    label="Vehicle"
                    value={
                      selectedVehicle
                        ? "Ready"
                        : "None"
                    }
                  />
                </div>


                <div className="mt-5 border-t border-white/[0.08] pt-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        selectedVehicle
                          ? "h-2 w-2 rounded-full bg-[#63d49b]"
                          : "h-2 w-2 rounded-full bg-[#728596]"
                      }
                    />

                    <p className="text-[8px] leading-4 text-[#9cafbe]">
                      {selectedVehicle
                        ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} is available for compatibility filtering.`
                        : "Browse freely or sign in and add a vehicle for compatibility filtering."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>


          {/* Hero mini features */}
          <div className="mt-10 grid gap-2 sm:grid-cols-3">
            <HeroCapability
              icon={
                LayoutGrid
              }
              label="Live catalog filters"
            />

            <HeroCapability
              icon={
                CarFront
              }
              label="Garage compatibility"
            />

            <HeroCapability
              icon={
                ShieldCheck
              }
              label="Stock & pricing visibility"
            />
          </div>
        </div>
      </section>


      {/* ======================================================
          VEHICLE CONTEXT
      ====================================================== */}

      <section className="border-b border-[#e0e5e9] bg-white">
        <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
          {garageLoading ? (
            <VehicleBannerLoading />
          ) : selectedVehicle ? (
            <VehicleBanner
              vehicle={
                selectedVehicle
              }
              filteringCompatible={
                fitsOnly
              }
            />
          ) : (
            <NoVehicleBanner />
          )}


          {garageError && (
            <div className="mt-3 rounded-[9px] border border-[#f0dfb7] bg-[#fffaf0] px-4 py-3 text-[10px] text-[#8a6116]">
              Your Shop is still available,
              but Vehnexa could not load your
              Garage:{" "}

              {
                garageError
              }
            </div>
          )}


          {compatibilityError && (
            <div className="mt-3 flex flex-col gap-2 rounded-[9px] border border-[#f0dfb7] bg-[#fffaf0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-[#8a6116]">
                Compatibility filtering is
                temporarily unavailable.
                Ordinary products are still shown.
              </p>

              <button
                type="button"
                onClick={() => {
                  setRefreshKey(
                    (
                      value,
                    ) =>
                      value +
                      1,
                  );
                }}
                className="text-[9px] font-bold text-[#b54708]"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </section>


      {/* ======================================================
          MARKETPLACE BODY
      ====================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        {/* Mobile filter */}
        <details className="mb-5 overflow-hidden rounded-[12px] border border-[#dfe4e8] bg-white shadow-[0_8px_25px_rgba(15,23,42,.04)] lg:hidden">
          <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-4 text-[11px] font-bold text-[#344054] [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#e31b2d]" />

              Filters

              {activeFilterCount >
                0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[7px] font-black text-white">
                  {
                    activeFilterCount
                  }
                </span>
              )}
            </span>

            <ChevronDown className="h-4 w-4 text-[#98a2b3]" />
          </summary>

          <div className="border-t border-[#eaecf0] p-5">
            {
              filterPanel
            }
          </div>
        </details>


        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)] xl:gap-8">
          {/* ==================================================
              FILTER RAIL
          ================================================== */}

          <aside className="hidden lg:block">
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      x:
                        -24,
                    }
              }
              animate={{
                x:
                  0,
              }}
              transition={{
                duration:
                  0.55,
              }}
              className="sticky top-[86px] overflow-hidden rounded-[16px] border border-[#dce2e7] bg-white shadow-[0_12px_35px_rgba(15,23,42,.045)]"
            >
              <div className="border-b border-[#eaecf0] bg-[#071b2d] px-5 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#71899b]">
                      REFINE RESULTS
                    </p>

                    <h2 className="mt-1 flex items-center gap-2 text-[14px] font-bold">
                      <SlidersHorizontal className="h-4 w-4 text-[#ff4655]" />

                      Filters
                    </h2>
                  </div>


                  {activeFilterCount >
                    0 && (
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-[#e31b2d]/25 bg-[#e31b2d]/10 px-2 text-[8px] font-black text-[#ff5361]">
                      {
                        activeFilterCount
                      }
                    </span>
                  )}
                </div>
              </div>


              <div className="p-5">
                {
                  filterPanel
                }
              </div>
            </motion.div>
          </aside>


          {/* ==================================================
              RESULTS
          ================================================== */}

          <section className="min-w-0">
            <motion.div
              layout
              className="overflow-hidden rounded-[14px] border border-[#dce2e7] bg-white shadow-[0_8px_30px_rgba(15,23,42,.035)]"
            >
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#f1f4f7] text-[#485867]">
                    <LayoutGrid className="h-4.5 w-4.5" />
                  </span>


                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[18px] font-black tracking-[-0.025em] text-[#101828]">
                        {fitsOnly
                          ? "Compatible products"
                          : "Marketplace results"}
                      </h2>

                      {!productsLoading && (
                        <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[8px] font-bold text-[#667085]">
                          {
                            visibleProducts.length
                          }{" "}
                          results
                        </span>
                      )}
                    </div>


                    <p className="mt-1 text-[9px] text-[#667085]">
                      {productsLoading
                        ? "Loading catalog..."
                        : visibleProducts.length ===
                            0
                          ? "No products match the current filters."
                          : `Showing ${pageStart + 1}?${pageEnd} of ${visibleProducts.length}`}
                    </p>
                  </div>
                </div>


                <div className="flex items-center gap-2">
                  <span className="hidden text-[8px] font-bold uppercase tracking-[0.10em] text-[#98a2b3] sm:inline">
                    Sort by
                  </span>

                  <div className="relative">
                    <select
                      value={
                        sort
                      }
                      onChange={(
                        event,
                      ) => {
                        const next =
                          normalizeSort(
                            event.target.value,
                          );

                        replaceQuery({
                          sort:
                            next ===
                            "recommended"
                              ? null
                              : next,

                          page:
                            null,
                        });
                      }}
                      className="h-10 appearance-none rounded-[7px] border border-[#d0d5dd] bg-[#fafbfc] pl-3 pr-9 text-[9px] font-semibold text-[#344054] outline-none transition hover:bg-white focus:border-[#e31b2d]/50"
                    >
                      <option value="recommended">
                        Recommended
                      </option>

                      <option value="price_asc">
                        Price: Low to High
                      </option>

                      <option value="price_desc">
                        Price: High to Low
                      </option>

                      <option value="rating">
                        Top Rated
                      </option>

                      <option value="newest">
                        Newest
                      </option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />
                  </div>
                </div>
              </div>


              {/* Active search/filter context */}
              {(searchValue ||
                activeFilterCount >
                  0) && (
                <div className="flex flex-wrap items-center gap-2 border-t border-[#edf0f2] bg-[#fafbfc] px-5 py-3 lg:px-6">
                  <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#98a2b3]">
                    Active
                  </span>


                  {searchValue && (
                    <ActiveChip
                      label={`Search: ${searchValue}`}
                    />
                  )}

                  {categoryId && (
                    <ActiveChip
                      label="Category"
                    />
                  )}

                  {brandId && (
                    <ActiveChip
                      label="Brand"
                    />
                  )}

                  {priceRange !==
                    "any" && (
                    <ActiveChip
                      label="Price range"
                    />
                  )}

                  {inStock && (
                    <ActiveChip
                      label="In stock"
                    />
                  )}

                  {fitsOnly && (
                    <ActiveChip
                      label="Fits vehicle"
                      accent
                    />
                  )}


                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="ml-auto text-[8px] font-bold text-[#e31b2d] transition hover:text-[#ba1624]"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </motion.div>


            {catalogError && (
              <div className="mt-5 flex items-center justify-between rounded-[11px] border border-[#f5c2c7] bg-[#fff5f6] px-4 py-3">
                <p className="text-[10px] text-[#b42318]">
                  {
                    catalogError
                  }
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setRefreshKey(
                      (
                        value,
                      ) =>
                        value +
                        1,
                    );
                  }}
                  className="text-[9px] font-bold text-[#e31b2d]"
                >
                  Try again
                </button>
              </div>
            )}


            {productError && (
              <ProductErrorState
                message={
                  productError
                }
                onRetry={() => {
                  setRefreshKey(
                    (
                      value,
                    ) =>
                      value +
                      1,
                  );
                }}
              />
            )}


            {!productError &&
              (
                productsLoading ||
                (
                  fitsOnly &&
                  compatibilityLoading
                )
              ) && (
                <ProductGridLoading />
              )}


            {!productError &&
              !productsLoading &&
              !compatibilityLoading &&
              visibleProducts.length ===
                0 && (
                <EmptyProducts
                  compatibility={
                    fitsOnly
                  }
                  onClear={
                    clearFilters
                  }
                />
              )}


            {!productError &&
              !productsLoading &&
              !(
                fitsOnly &&
                compatibilityLoading
              ) &&
              paginatedProducts.length >
                0 && (
                <>
                  <AnimatePresence
                    mode="popLayout"
                  >
                    <motion.div
                      key={`${currentPage}-${searchValue}-${categoryId}-${brandId}-${priceRange}-${inStock}-${fitsOnly}-${sort}`}
                      layout
                      className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    >
                      {paginatedProducts.map(
                        (
                          product,
                          index,
                        ) => (
                          <ProductCard
                            key={
                              product.id
                            }
                            product={
                              product
                            }
                            brandName={
                              brandNames.get(
                                product.brand_id,
                              ) ??
                              "VEHNEXA"
                            }
                            compatible={
                              compatibleIds.has(
                                product.id,
                              )
                            }
                            added={
                              addedProductId ===
                              product.id
                            }
                            onAdd={
                              handleAddToCart
                            }
                            index={
                              index
                            }
                          />
                        ),
                      )}
                    </motion.div>
                  </AnimatePresence>


                  <Pagination
                    currentPage={
                      currentPage
                    }
                    totalPages={
                      totalPages
                    }
                    totalItems={
                      visibleProducts.length
                    }
                    pageStart={
                      pageStart
                    }
                    pageEnd={
                      pageEnd
                    }
                    onChange={
                      changePage
                    }
                  />
                </>
              )}


            {selectedVehicle && (
              <div className="mt-6 flex gap-3 rounded-[12px] border border-[#dce2e7] bg-white p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4f82ae]" />

                <p className="text-[9px] leading-5 text-[#7b8794]">
                  Vehicle compatibility shown
                  in this development catalog is
                  based on Vehnexa demo fitment
                  data and is not OEM-certified.
                  Always verify fitment before
                  installation.
                </p>
              </div>
            )}
          </section>
        </div>


        {/* ==================================================
            MARKETPLACE FOOTER STRIP
        ================================================== */}

        <div className="mt-14 grid overflow-hidden rounded-[17px] border border-[#dbe1e6] bg-white shadow-[0_12px_40px_rgba(15,23,42,.04)] md:grid-cols-3">
          <MarketplaceFooterFeature
            icon={
              CarFront
            }
            eyebrow="VEHICLE CONTEXT"
            title="Shop with Garage context"
            description="Select an active vehicle when you want to narrow the catalog using Vehnexa fitment data."
          />

          <MarketplaceFooterFeature
            icon={
              PackageCheck
            }
            eyebrow="CATALOG DATA"
            title="See stock before checkout"
            description="Product cards expose current catalog stock and pricing directly in the marketplace."
          />

          <MarketplaceFooterFeature
            icon={
              ShieldCheck
            }
            eyebrow="PURCHASE FLOW"
            title="Continue when you're ready"
            description="Browse publicly, then sign in when you want to add products and continue through checkout."
          />
        </div>
      </section>
    </main>
  );
}


/* ============================================================
   FILTER PANEL
============================================================ */

function FilterPanel({
  categories,
  brands,
  catalogLoading,
  categoryId,
  brandId,
  priceRange,
  inStock,
  fitsOnly,
  selectedVehicle,
  compatibilityLoading,
  compatibilityError,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onStockChange,
  onFitsChange,
  onClear,
}: {
  categories: Category[];
  brands: Brand[];
  catalogLoading: boolean;
  categoryId: string;
  brandId: string;
  priceRange: PriceRange;
  inStock: boolean;
  fitsOnly: boolean;

  selectedVehicle:
    | Vehicle
    | null;

  compatibilityLoading: boolean;
  compatibilityError: string;

  onCategoryChange: (
    value: string,
  ) => void;

  onBrandChange: (
    value: string,
  ) => void;

  onPriceChange: (
    value: PriceRange,
  ) => void;

  onStockChange: (
    value: boolean,
  ) => void;

  onFitsChange: (
    value: boolean,
  ) => void;

  onClear:
    () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between lg:hidden">
        <h2 className="flex items-center gap-2 text-[13px] font-bold text-[#101828]">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#e31b2d]" />

          Filters
        </h2>

        <button
          type="button"
          onClick={
            onClear
          }
          className="text-[9px] font-bold text-[#e31b2d]"
        >
          Clear all
        </button>
      </div>


      <div className="hidden items-center justify-end lg:flex">
        <button
          type="button"
          onClick={
            onClear
          }
          className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#e31b2d] transition hover:text-[#b81624]"
        >
          Reset filters
        </button>
      </div>


      <FilterGroup
        label="Category"
      >
        <SelectField
          value={
            categoryId
          }
          disabled={
            catalogLoading
          }
          onChange={
            onCategoryChange
          }
        >
          <option value="">
            All categories
          </option>

          {categories
            .filter(
              (
                category,
              ) =>
                category.is_active,
            )
            .map(
              (
                category,
              ) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {
                    category.name
                  }
                </option>
              ),
            )}
        </SelectField>
      </FilterGroup>


      <FilterGroup
        label="Brand"
      >
        <SelectField
          value={
            brandId
          }
          disabled={
            catalogLoading
          }
          onChange={
            onBrandChange
          }
        >
          <option value="">
            All brands
          </option>

          {brands
            .filter(
              (
                brand,
              ) =>
                brand.is_active,
            )
            .map(
              (
                brand,
              ) => (
                <option
                  key={
                    brand.id
                  }
                  value={
                    brand.id
                  }
                >
                  {
                    brand.name
                  }
                </option>
              ),
            )}
        </SelectField>
      </FilterGroup>


      <FilterGroup
        label="Price"
      >
        <SelectField
          value={
            priceRange
          }
          onChange={(
            value,
          ) => {
            onPriceChange(
              normalizePriceRange(
                value,
              ),
            );
          }}
        >
          <option value="any">
            Any price
          </option>

          <option value="under50">
            Under $50
          </option>

          <option value="50to100">
            $50 ? $100
          </option>

          <option value="100to200">
            $100 ? $200
          </option>

          <option value="200plus">
            $200+
          </option>
        </SelectField>
      </FilterGroup>


      <FilterGroup
        label="Availability"
      >
        <button
          type="button"
          onClick={() => {
            onStockChange(
              !inStock,
            );
          }}
          className={
            inStock
              ? "flex w-full items-center justify-between rounded-[9px] border border-[#b7e4c8] bg-[#ecfdf3] px-3 py-3 text-left"
              : "flex w-full items-center justify-between rounded-[9px] border border-[#dce2e7] bg-[#fafbfc] px-3 py-3 text-left transition hover:bg-white"
          }
        >
          <div>
            <p
              className={
                inStock
                  ? "text-[9px] font-bold text-[#16804a]"
                  : "text-[9px] font-bold text-[#344054]"
              }
            >
              In-stock only
            </p>

            <p className="mt-1 text-[7px] text-[#98a2b3]">
              Hide unavailable products
            </p>
          </div>

          <span
            className={
              inStock
                ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#16804a] text-white"
                : "h-5 w-5 rounded-full border border-[#cfd5dc] bg-white"
            }
          >
            {inStock && (
              <Check className="h-3 w-3" />
            )}
          </span>
        </button>
      </FilterGroup>


      <FilterGroup
        label="Compatibility"
      >
        <button
          type="button"
          disabled={
            !selectedVehicle ||
            Boolean(
              compatibilityError,
            ) ||
            compatibilityLoading
          }
          onClick={() => {
            if (
              selectedVehicle &&
              !compatibilityError &&
              !compatibilityLoading
            ) {
              onFitsChange(
                !fitsOnly,
              );
            }
          }}
          className={
            fitsOnly
              ? "flex w-full items-center justify-between rounded-[9px] border border-[#bdd8f0] bg-[#f1f7fc] px-3 py-3 text-left"
              : "flex w-full items-center justify-between rounded-[9px] border border-[#dce2e7] bg-[#fafbfc] px-3 py-3 text-left transition enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          <div>
            <p
              className={
                fitsOnly
                  ? "text-[9px] font-bold text-[#346aa5]"
                  : "text-[9px] font-bold text-[#344054]"
              }
            >
              Fits my vehicle
            </p>

            <p className="mt-1 text-[7px] text-[#98a2b3]">
              {selectedVehicle
                ? "Use Garage fitment context"
                : "Add a vehicle first"}
            </p>
          </div>


          {compatibilityLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#346aa5]" />
          ) : (
            <span
              className={
                fitsOnly
                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#346aa5] text-white"
                  : "h-5 w-5 rounded-full border border-[#cfd5dc] bg-white"
              }
            >
              {fitsOnly && (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </button>
      </FilterGroup>
    </>
  );
}


function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-[#edf0f2] pt-5">
      <label className="mb-2.5 block text-[8px] font-black uppercase tracking-[0.12em] text-[#7d8996]">
        {label}
      </label>

      {children}
    </div>
  );
}


function SelectField({
  value,
  disabled = false,
  onChange,
  children,
}: {
  value: string;
  disabled?: boolean;
  onChange: (
    value: string,
  ) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={
          value
        }
        disabled={
          disabled
        }
        onChange={(
          event,
        ) => {
          onChange(
            event.target.value,
          );
        }}
        className="h-11 w-full appearance-none rounded-[8px] border border-[#d8dee4] bg-[#fafbfc] pl-3 pr-9 text-[9px] font-semibold text-[#344054] outline-none transition hover:bg-white focus:border-[#e31b2d]/45 focus:bg-white"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />
    </div>
  );
}


/* ============================================================
   VEHICLE BANNERS
============================================================ */

function VehicleBanner({
  vehicle,
  filteringCompatible,
}: {
  vehicle: Vehicle;
  filteringCompatible: boolean;
}) {
  return (
    <motion.div
      layout
      className="group relative overflow-hidden rounded-[15px] border border-[#cfe0f0] bg-[linear-gradient(120deg,#f5f9fd_0%,#edf5fc_52%,#f8fbfd_100%)] px-5 py-5 shadow-[0_10px_35px_rgba(52,106,165,.06)]"
    >
      <div
        aria-hidden="true"
        className="absolute -right-[70px] -top-[100px] h-[240px] w-[240px] rounded-full border border-[#4b84b8]/10"
      />

      <div
        aria-hidden="true"
        className="absolute -right-[15px] -top-[45px] h-[140px] w-[140px] rounded-full border border-[#4b84b8]/10"
      />


      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{
              rotate:
                -4,

              scale:
                1.05,
            }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] border border-[#c8dced] bg-white text-[#346aa5] shadow-sm"
          >
            <CarFront className="h-6 w-6" />
          </motion.div>


          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#4b79a9]">
                {vehicle.is_active
                  ? "ACTIVE VEHICLE"
                  : "GARAGE VEHICLE"}
              </p>

              {filteringCompatible && (
                <span className="rounded-full border border-[#b7e4c8] bg-[#ecfdf3] px-2 py-1 text-[7px] font-black text-[#16804a]">
                  FITMENT ON
                </span>
              )}
            </div>


            <h2 className="mt-1.5 text-[16px] font-black tracking-[-0.025em] text-[#183b5d]">
              {vehicle.year}{" "}
              {vehicle.make}{" "}
              {vehicle.model}
            </h2>


            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[9px] font-semibold text-[#64809d]">
                {
                  vehicle.engine
                }
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-[#a8bfd2] sm:block" />

              <span className="text-[8px] text-[#64809d]">
                {filteringCompatible
                  ? "Catalog filtered using this vehicle"
                  : "Compatibility filter available"}
              </span>
            </div>
          </div>
        </div>


        <Link
          href="/account/garage"
          className="group/button inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-[#aac7df] bg-white px-4 text-[8px] font-bold text-[#346aa5] shadow-sm transition hover:border-[#346aa5] hover:bg-[#346aa5] hover:text-white"
        >
          Change vehicle

          <ArrowRight className="h-3.5 w-3.5 transition group-hover/button:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  );
}


function NoVehicleBanner() {
  const authenticated =
    Boolean(
      getAccessToken(),
    );


  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[15px] border border-[#dde3e8] bg-[#fafbfc] px-5 py-5"
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] border border-[#e1e5e9] bg-white text-[#71808e]">
            <CarFront className="h-5 w-5" />
          </span>


          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#98a2b3]">
              VEHICLE COMPATIBILITY
            </p>

            <p className="mt-1.5 text-[11px] font-bold text-[#344054]">
              {authenticated
                ? "Select a vehicle to unlock fitment filtering."
                : "Sign in to use My Garage and vehicle compatibility."}
            </p>

            <p className="mt-1 text-[8px] leading-4 text-[#7d8996]">
              You can still browse the complete
              marketplace without a vehicle.
            </p>
          </div>
        </div>


        <Link
          href={
            authenticated
              ? "/account/garage"
              : "/login"
          }
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-[#071b2d] px-4 text-[8px] font-bold text-white transition hover:bg-[#102d43]"
        >
          {authenticated
            ? "Open My Garage"
            : "Sign in"}

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}


function VehicleBannerLoading() {
  return (
    <div className="overflow-hidden rounded-[15px] border border-[#dce5ed] bg-[#f5f9fc] p-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-[12px] bg-[#e4ebf1]" />

        <div className="flex-1">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#e1e8ee]" />

          <div className="mt-3 h-4 w-52 animate-pulse rounded bg-[#dce5ec]" />

          <div className="mt-2 h-2.5 w-72 max-w-full animate-pulse rounded bg-[#e5ebf0]" />
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   PRODUCT CARD
============================================================ */

function ProductCard({
  product,
  brandName,
  compatible,
  added,
  onAdd,
  index,
}: {
  product: Product;
  brandName: string;
  compatible: boolean;
  added: boolean;

  onAdd: (
    product: Product,
  ) => void;

  index:
    number;
}) {
  const reduceMotion =
    useReducedMotion();


  const price =
    product.sale_price ??
    product.price;


  const sale =
    product.sale_price !=
      null &&
    product.sale_price <
      product.price;


  const discountPercent =
    sale
      ? Math.round(
          (
            (
              product.price -
              price
            ) /
            product.price
          ) *
            100,
        )
      : 0;


  const outOfStock =
    product.stock_quantity <=
    0;


  const lowStock =
    !outOfStock &&
    product.stock_quantity <=
      10;


  const realProductImage =
    product.images[0]?.trim() ||
    null;


  const image =
    getProductImage(
      product,
    );


  const reference =
    !realProductImage &&
    Boolean(
      image,
    );


  const detailHref =
    `/product/${product.slug}`;


  return (
    <motion.article
      layout
      initial={
        reduceMotion
          ? false
          : {
              y:
                26,

              scale:
                0.985,
            }
      }
      animate={{
        y:
          0,

        scale:
          1,
      }}
      transition={{
        delay:
          reduceMotion
            ? 0
            : Math.min(
                index *
                  0.045,
                0.28,
              ),

        duration:
          0.45,

        ease:
          "easeOut",
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y:
                -7,
            }
      }
      className="group relative flex min-h-[470px] flex-col overflow-hidden rounded-[17px] border border-[#dce2e7] bg-white shadow-[0_8px_28px_rgba(15,23,42,.035)] transition-colors duration-300 hover:border-[#cbd3da] hover:shadow-[0_26px_60px_rgba(15,23,42,.10)]"
    >
      {/* Image */}
      <Link
        href={
          detailHref
        }
        className="relative flex h-[245px] items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#fafbfc_0%,#f3f5f7_100%)]"
        aria-label={`View ${product.name}`}
      >
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-14 h-40 w-40 rounded-full border border-[#dce1e6] opacity-0 transition duration-500 group-hover:scale-110 group-hover:opacity-100"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-[#e31b2d]/0 blur-[45px] transition duration-500 group-hover:bg-[#e31b2d]/[0.06]"
        />


        <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
          {compatible && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#b7e4c8] bg-[#ecfdf3]/95 px-2.5 py-1 text-[7px] font-black text-[#16804a] backdrop-blur">
              <BadgeCheck className="h-3 w-3" />

              FITS
            </span>
          )}


          {sale && (
            <span className="rounded-full bg-[#e31b2d] px-2.5 py-1 text-[7px] font-black text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>


        {outOfStock && (
          <span className="absolute right-3 top-3 z-20 rounded-full border border-[#e1e5e9] bg-white/95 px-2.5 py-1 text-[7px] font-bold text-[#667085] backdrop-blur">
            OUT OF STOCK
          </span>
        )}


        {image ? (
          <ProductImage
            src={
              image
            }
            alt={
              product.name
            }
            reference={
              reference
            }
          />
        ) : (
          <ImageUnavailable />
        )}


        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/45 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />


        <span className="absolute bottom-4 right-4 flex h-9 w-9 translate-y-3 items-center justify-center rounded-full bg-[#071b2d] text-white opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>


      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.13em] text-[#8d98a8]">
            {
              brandName
            }
          </p>

          <span className="shrink-0 text-[7px] font-semibold text-[#a0a9b4]">
            {
              product.sku
            }
          </span>
        </div>


        <Link
          href={
            detailHref
          }
          className="block"
        >
          <h3 className="mt-2 line-clamp-2 min-h-[48px] text-[14px] font-black leading-[22px] tracking-[-0.018em] text-[#17202b] transition group-hover:text-[#d61c2b]">
            {
              product.name
            }
          </h3>
        </Link>


        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#f4b740] text-[#f4b740]" />

            <span className="text-[9px] font-bold text-[#475467]">
              {product.rating_average.toFixed(
                1,
              )}
            </span>
          </div>

          <span className="text-[8px] text-[#98a2b3]">
            {
              product.review_count
            }{" "}
            reviews
          </span>
        </div>


        <div className="my-4 h-px bg-[#edf0f2]" />


        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[20px] font-black tracking-[-0.035em] text-[#101828]">
                $
                {price.toFixed(
                  2,
                )}
              </span>

              {sale && (
                <span className="text-[9px] font-semibold text-[#98a2b3] line-through">
                  $
                  {product.price.toFixed(
                    2,
                  )}
                </span>
              )}
            </div>


            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={
                  outOfStock
                    ? "h-1.5 w-1.5 rounded-full bg-[#98a2b3]"
                    : lowStock
                      ? "h-1.5 w-1.5 rounded-full bg-[#f5a623]"
                      : "h-1.5 w-1.5 rounded-full bg-[#32a46f]"
                }
              />

              <p
                className={
                  outOfStock
                    ? "text-[8px] font-semibold text-[#98a2b3]"
                    : lowStock
                      ? "text-[8px] font-semibold text-[#b76e00]"
                      : "text-[8px] font-semibold text-[#46745c]"
                }
              >
                {outOfStock
                  ? "Currently unavailable"
                  : lowStock
                    ? `Only ${product.stock_quantity} left`
                    : `${product.stock_quantity} in stock`}
              </p>
            </div>
          </div>


          <motion.button
            type="button"
            disabled={
              outOfStock
            }
            whileHover={
              !outOfStock &&
              !reduceMotion
                ? {
                    scale:
                      1.08,

                    rotate:
                      -3,
                  }
                : undefined
            }
            whileTap={
              !outOfStock &&
              !reduceMotion
                ? {
                    scale:
                      0.92,
                  }
                : undefined
            }
            onClick={() => {
              onAdd(
                product,
              );
            }}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[9px] text-white shadow-sm transition ${
              outOfStock
                ? "cursor-not-allowed bg-[#cfd4dc]"
                : added
                  ? "bg-[#16804a]"
                  : "bg-[#e31b2d] hover:bg-[#c81424]"
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              {added ? (
                <motion.span
                  key="added"
                  initial={{
                    scale:
                      0,
                  }}
                  animate={{
                    scale:
                      1,
                  }}
                  exit={{
                    scale:
                      0,
                  }}
                >
                  <Check className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{
                    scale:
                      0.8,
                  }}
                  animate={{
                    scale:
                      1,
                  }}
                  exit={{
                    scale:
                      0,
                  }}
                >
                  <Plus className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}


/* ============================================================
   PRODUCT IMAGE
============================================================ */

function ProductImage({
  src,
  alt,
  reference,
}: {
  src: string;
  alt: string;
  reference: boolean;
}) {
  const [
    failed,
    setFailed,
  ] = useState(
    false,
  );

  if (
    failed
  ) {
    return (
      <ImageUnavailable />
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          src
        }
        alt={
          alt
        }
        loading="lazy"
        onError={() => {
          setFailed(
            true,
          );
        }}
        className="relative z-10 h-full w-full object-contain p-7 transition duration-700 ease-out group-hover:scale-[1.075] group-hover:-rotate-[0.8deg]"
      />

      {reference && (
        <span className="absolute bottom-3 left-3 z-20 rounded-full border border-[#e2e6ea] bg-white/90 px-2.5 py-1 text-[7px] font-bold text-[#7c8794] shadow-sm backdrop-blur">
          Reference image
        </span>
      )}
    </>
  );
}


function ImageUnavailable() {
  return (
    <div className="flex flex-col items-center justify-center">
      <PackageSearch className="h-8 w-8 text-[#c3cad3]" />

      <span className="mt-2 text-[10px] text-[#98a2b3]">
        Image unavailable
      </span>
    </div>
  );
}


/* ============================================================
   PAGINATION
============================================================ */

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageStart,
  pageEnd,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageStart: number;
  pageEnd: number;

  onChange: (
    page: number,
  ) => void;
}) {
  if (
    totalPages <=
    1
  ) {
    return null;
  }


  const pages =
    getPaginationPages(
      currentPage,
      totalPages,
    );


  const progress =
    (
      currentPage /
      totalPages
    ) *
    100;


  return (
    <div className="mt-7 overflow-hidden rounded-[14px] border border-[#dce2e7] bg-white shadow-[0_8px_28px_rgba(15,23,42,.035)]">
      <div className="h-[3px] bg-[#edf0f2]">
        <motion.div
          animate={{
            width:
              `${progress}%`,
          }}
          transition={{
            duration:
              0.45,

            ease:
              "easeOut",
          }}
          className="h-full bg-[#e31b2d]"
        />
      </div>


      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-bold text-[#344054]">
            Showing{" "}
            {pageStart + 1}
            {" ? "}
            {
              pageEnd
            }{" "}
            of{" "}
            {
              totalItems
            }
          </p>

          <p className="mt-1 text-[7px] text-[#98a2b3]">
            Page{" "}
            {
              currentPage
            }{" "}
            of{" "}
            {
              totalPages
            }
          </p>
        </div>


        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={
              currentPage ===
              1
            }
            onClick={() => {
              onChange(
                currentPage -
                  1,
              );
            }}
            className="flex h-9 items-center gap-1.5 rounded-[7px] border border-[#d5dbe1] bg-white px-3 text-[8px] font-bold text-[#475467] transition hover:border-[#bdc5cd] hover:bg-[#fafbfc] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-3.5 w-3.5" />

            Previous
          </button>


          {pages.map(
            (
              page,
              index,
            ) =>
              page ===
              "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-[10px] text-[#98a2b3]"
                >
                  ?
                </span>
              ) : (
                <motion.button
                  type="button"
                  key={
                    page
                  }
                  whileTap={{
                    scale:
                      0.92,
                  }}
                  onClick={() => {
                    onChange(
                      page,
                    );
                  }}
                  className={
                    page ===
                    currentPage
                      ? "h-9 min-w-9 rounded-[7px] border border-[#e31b2d] bg-[#e31b2d] px-2 text-[8px] font-black text-white shadow-[0_4px_14px_rgba(227,27,45,.20)]"
                      : "h-9 min-w-9 rounded-[7px] border border-[#d5dbe1] bg-white px-2 text-[8px] font-bold text-[#475467] transition hover:border-[#bfc8d0] hover:bg-[#fafbfc]"
                  }
                >
                  {
                    page
                  }
                </motion.button>
              ),
          )}


          <button
            type="button"
            disabled={
              currentPage ===
              totalPages
            }
            onClick={() => {
              onChange(
                currentPage +
                  1,
              );
            }}
            className="flex h-9 items-center gap-1.5 rounded-[7px] border border-[#d5dbe1] bg-white px-3 text-[8px] font-bold text-[#475467] transition hover:border-[#bdc5cd] hover:bg-[#fafbfc] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Next

            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   EMPTY / ERROR / LOADING
============================================================ */

function EmptyProducts({
  compatibility,
  onClear,
}: {
  compatibility: boolean;

  onClear:
    () => void;
}) {
  return (
    <motion.div
      initial={{
        scale:
          0.985,
      }}
      animate={{
        scale:
          1,
      }}
      className="mt-5 flex min-h-[390px] items-center justify-center overflow-hidden rounded-[16px] border border-[#dce2e7] bg-white p-8 shadow-[0_8px_28px_rgba(15,23,42,.03)]"
    >
      <div className="max-w-[390px] text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[16px] border border-[#e2e6ea] bg-[#f6f8fa] text-[#71808e]">
          <PackageSearch className="h-7 w-7" />
        </span>

        <p className="mt-5 text-[8px] font-black uppercase tracking-[0.14em] text-[#98a2b3]">
          NO MATCHES
        </p>

        <h3 className="mt-2 text-[21px] font-black tracking-[-0.03em] text-[#101828]">
          {compatibility
            ? "No compatible products found"
            : "No products found"}
        </h3>

        <p className="mt-3 text-[9px] leading-5 text-[#667085]">
          Try changing the current filters
          or clear them to return to the
          complete marketplace catalog.
        </p>

        <button
          type="button"
          onClick={
            onClear
          }
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#071b2d] px-5 text-[8px] font-bold text-white transition hover:bg-[#102d43]"
        >
          Clear filters

          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}


function ProductErrorState({
  message,
  onRetry,
}: {
  message: string;

  onRetry:
    () => void;
}) {
  return (
    <div className="mt-5 rounded-[15px] border border-[#f2c6ca] bg-[#fff7f8] p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#fff0f1] text-[#e31b2d]">
        <PackageSearch className="h-5 w-5" />
      </span>

      <p className="mt-4 text-[10px] font-semibold text-[#b42318]">
        {
          message
        }
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="mt-5 rounded-[7px] bg-[#e31b2d] px-5 py-2.5 text-[8px] font-bold text-white transition hover:bg-[#c91625]"
      >
        Try again
      </button>
    </div>
  );
}


function ProductGridLoading() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({
        length:
          PRODUCTS_PER_PAGE,
      }).map(
        (
          _,
          index,
        ) => (
          <motion.div
            key={
              index
            }
            initial={{
              y:
                16,
            }}
            animate={{
              y:
                0,
            }}
            transition={{
              delay:
                index *
                0.035,
            }}
            className="overflow-hidden rounded-[17px] border border-[#e0e5e9] bg-white"
          >
            <div className="relative h-[245px] overflow-hidden bg-[#f4f6f8]">
              <motion.div
                animate={{
                  x: [
                    "-120%",
                    "120%",
                  ],
                }}
                transition={{
                  duration:
                    1.5,

                  repeat:
                    Infinity,

                  ease:
                    "linear",

                  delay:
                    index *
                    0.06,
                }}
                className="absolute inset-y-0 w-[45%] bg-gradient-to-r from-transparent via-white/80 to-transparent"
              />
            </div>

            <div className="space-y-4 p-5">
              <div className="h-2.5 w-20 animate-pulse rounded bg-[#edf0f2]" />

              <div className="h-4 w-full animate-pulse rounded bg-[#e9edf1]" />

              <div className="h-4 w-3/4 animate-pulse rounded bg-[#edf0f2]" />

              <div className="h-px bg-[#edf0f2]" />

              <div className="flex items-center justify-between">
                <div className="h-6 w-24 animate-pulse rounded bg-[#e9edf1]" />

                <div className="h-11 w-11 animate-pulse rounded-[9px] bg-[#eceff2]" />
              </div>
            </div>
          </motion.div>
        ),
      )}
    </div>
  );
}


/* ============================================================
   MARKETPLACE SUPPORT COMPONENTS
============================================================ */

function MarketplaceMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[10px] border border-white/[0.07] bg-black/10 p-3">
      <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#657b8c]">
        {
          label
        }
      </p>

      <p className="mt-1 text-[15px] font-black tracking-[-0.02em] text-white">
        {
          value
        }
      </p>
    </div>
  );
}


function HeroCapability({
  icon:
    Icon,
  label,
}: {
  icon:
    typeof LayoutGrid;

  label:
    string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-white/[0.07] bg-white/[0.035] px-4 py-3 backdrop-blur">
      <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/[0.08] bg-black/10 text-[#ff4858]">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <span className="text-[8px] font-bold text-[#c0cdd7]">
        {
          label
        }
      </span>
    </div>
  );
}


function ActiveChip({
  label,
  accent =
    false,
}: {
  label:
    string;

  accent?:
    boolean;
}) {
  return (
    <span
      className={
        accent
          ? "rounded-full border border-[#bed7ed] bg-[#eef6fc] px-2.5 py-1 text-[7px] font-bold text-[#346aa5]"
          : "rounded-full border border-[#dce1e6] bg-white px-2.5 py-1 text-[7px] font-bold text-[#596775]"
      }
    >
      {
        label
      }
    </span>
  );
}


function MarketplaceFooterFeature({
  icon:
    Icon,
  eyebrow,
  title,
  description,
}: {
  icon:
    typeof CarFront;

  eyebrow:
    string;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="group relative p-6 md:border-r md:border-[#edf0f2] md:last:border-r-0 lg:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#e1e5e9] bg-[#f5f7f9] text-[#536372] transition duration-300 group-hover:border-[#f1c7cb] group-hover:bg-[#fff1f2] group-hover:text-[#e31b2d]">
        <Icon className="h-4.5 w-4.5" />
      </span>

      <p className="mt-5 text-[7px] font-black uppercase tracking-[0.13em] text-[#98a2b3]">
        {
          eyebrow
        }
      </p>

      <h3 className="mt-1.5 text-[13px] font-black tracking-[-0.02em] text-[#101828]">
        {
          title
        }
      </h3>

      <p className="mt-2 text-[8px] leading-4 text-[#7b8794]">
        {
          description
        }
      </p>
    </div>
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function VehnexaNavbar({
  cartCount,
}: {
  cartCount:
    number;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
    <motion.header
      initial={
        reduceMotion
          ? false
          : {
              y:
                -65,
            }
      }
      animate={{
        y:
          0,
      }}
      transition={{
        duration:
          0.55,

        ease:
          "easeOut",
      }}
      className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#061827]/95 shadow-[0_8px_30px_rgba(0,0,0,.08)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[66px] max-w-[1480px] items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
        >
          <motion.div
            whileHover={
              reduceMotion
                ? undefined
                : {
                    rotate:
                      -4,

                    scale:
                      1.06,
                  }
            }
          >
            <VehnexaMark />
          </motion.div>

          <span className="text-[14px] font-black tracking-[-0.025em] text-white">
            Vehnexa
          </span>
        </Link>


        <nav className="ml-10 hidden h-full items-center gap-8 lg:flex">
          <TopNavLink
            href="/shop"
            label="Shop"
            active
          />

          <TopNavLink
            href="/account/garage"
            label="My Garage"
          />

          <TopNavLink
            href="/ai-mechanic"
            label="AI Mechanic"
          />

          <TopNavLink
            href="/#resources"
            label="Resources"
          />
        </nav>


        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById(
                  "shop-search",
                )
                ?.focus();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Search products"
          >
            <Search className="h-[16px] w-[16px]" />
          </button>


          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingCart className="h-[16px] w-[16px]" />

            {cartCount >
              0 && (
              <motion.span
                initial={{
                  scale:
                    0,
                }}
                animate={{
                  scale:
                    1,
                }}
                className="absolute right-0 top-0 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[7px] font-black text-white"
              >
                {cartCount >
                99
                  ? "99+"
                  : cartCount}
              </motion.span>
            )}
          </Link>


          <PublicNavbarAuthActions />
        </div>
      </div>
    </motion.header>
  );
}


function TopNavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={
        href
      }
      className={`group relative flex h-full items-center text-[9px] font-semibold transition ${
        active
          ? "text-white"
          : "text-[#bcc9d3] hover:text-white"
      }`}
    >
      {
        label
      }

      <span
        className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 bg-[#e31b2d] transition-all duration-300 ${
          active
            ? "w-full"
            : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}


function VehnexaMark() {
  return (
    <div className="relative h-7 w-7">
      <span className="absolute left-[1px] top-[3px] h-[22px] w-[10px] -skew-x-[25deg] rounded-[2px] bg-[#e31b2d]" />

      <span className="absolute right-[2px] top-[3px] h-[22px] w-[10px] skew-x-[25deg] rounded-[2px] bg-[#d8dee5]" />
    </div>
  );
}


/* ============================================================
   PAGE FALLBACK
============================================================ */

function ShopPageFallback() {
  return (
    <main className="min-h-screen bg-[#f5f7f9]">
      <header className="h-[64px] bg-[#071b2d]" />

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-52 animate-pulse rounded bg-[#e4e7ec]" />

        <div className="mt-6 h-[82px] animate-pulse rounded-[6px] bg-[#e9edf2]" />

        <ProductGridLoading />
      </div>
    </main>
  );
}


/* ============================================================
   PRODUCT IMAGE RESOLUTION
============================================================ */

function getProductImage(
  product: Product,
): string | null {
  /*
   * 1. Real product/SKU image from MongoDB always wins.
   */

  const realImage =
    product.images[0]?.trim();

  if (
    realImage
  ) {
    return realImage;
  }


  /*
   * 2. Build searchable component identity.
   */

  const searchableText =
    [
      product.name,
      product.description,
      product.sku,
      product.part_number,
      product.subcategory_slug,
    ]
      .filter(
        Boolean,
      )
      .join(" ")
      .toLowerCase();


  /*
   * 3. Exact component-type representative image.
   *
   * Rules are ordered from more specific to less specific.
   */

  const matchingRule =
    PART_IMAGE_RULES.find(
      (rule) =>
        rule.keywords.some(
          (keyword) =>
            searchableText.includes(
              keyword,
            ),
        ),
    );


  if (
    matchingRule
  ) {
    return matchingRule.image;
  }


  /*
   * 4. Unknown component.
   *
   * Do not invent or reuse a generic family photo.
   */

  return null;
}


/* ============================================================
   HELPERS
============================================================ */

function normalizePage(
  value:
    | string
    | null,
): number {
  const parsed =
    Number.parseInt(
      value ?? "1",
      10,
    );

  return Number.isFinite(
    parsed,
  ) &&
    parsed >
      0
    ? parsed
    : 1;
}


function getPaginationPages(
  currentPage: number,
  totalPages: number,
): Array<
  number |
  "ellipsis"
> {
  if (
    totalPages <=
    7
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index,
      ) =>
        index +
        1,
    );
  }

  if (
    currentPage <=
    4
  ) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis",
      totalPages,
    ];
  }

  if (
    currentPage >=
    totalPages -
      3
  ) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}


function normalizeSort(
  value:
    | string
    | null,
): ProductSort {
  switch (
    value
  ) {
    case "price_asc":
    case "price_desc":
    case "rating":
    case "newest":
      return value;

    default:
      return "recommended";
  }
}


function normalizePriceRange(
  value:
    | string
    | null,
): PriceRange {
  switch (
    value
  ) {
    case "under50":
    case "50to100":
    case "100to200":
    case "200plus":
      return value;

    default:
      return "any";
  }
}


function getPriceRangeValues(
  range: PriceRange,
): {
  min?: number;
  max?: number;
} {
  switch (
    range
  ) {
    case "under50":
      return {
        max: 50,
      };

    case "50to100":
      return {
        min: 50,
        max: 100,
      };

    case "100to200":
      return {
        min: 100,
        max: 200,
      };

    case "200plus":
      return {
        min: 200,
      };

    default:
      return {};
  }
}