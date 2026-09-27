"use client";

import PublicNavbarAuthActions from "@/components/customer/PublicNavbarAuthActions";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Heart,
  CarFront,
  Check,
  ChevronRight,
  Loader2,
  Minus,
  PackageCheck,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
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
  getProductBySlug,
  type Brand,
  type Category,
  type Product,
} from "@/lib/products";

import {
  addToCart,
  CART_UPDATED_EVENT,
  getCartCount,
} from "@/lib/cart";

import {
  addWishlistProduct,
  getWishlistProductIds,
  removeWishlistProduct,
} from "@/lib/wishlist";


import {
  createReview,
  getProductReviews,
  getReviewEligibility,
  type Review,
  type ReviewEligibility,
} from "@/lib/reviews";


type DetailTab =
  | "overview"
  | "specifications"
  | "fitment"
  | "reviews";


export default function ProductDetailPage() {
  const params =
    useParams<{
      slug: string;
    }>();

  const router =
    useRouter();


  const reduceMotion =
    useReducedMotion();

  const slug =
    params.slug;


  const [
    product,
    setProduct,
  ] = useState<
    Product | null
  >(null);

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
    activeVehicle,
    setActiveVehicle,
  ] = useState<
    Vehicle | null
  >(null);

  const [
    compatible,
    setCompatible,
  ] = useState<
    boolean | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    error,
    setError,
  ] = useState(
    "",
  );

  const [
    compatibilityLoading,
    setCompatibilityLoading,
  ] = useState(
    false,
  );

  const [
    compatibilityError,
    setCompatibilityError,
  ] = useState(
    "",
  );

  const [
    quantity,
    setQuantity,
  ] = useState(
    1,
  );

  const [
    activeTab,
    setActiveTab,
  ] = useState<DetailTab>(
    "overview",
  );

  const [
    cartCount,
    setCartCount,
  ] = useState(
    0,
  );

  const [
    added,
    setAdded,
  ] = useState(
    false,
  );

  const [
    search,
    setSearch,
  ] = useState(
    "",
  );


  const [
    isWishlisted,
    setIsWishlisted,
  ] = useState(
    false,
  );


  const [
    wishlistBusy,
    setWishlistBusy,
  ] = useState(
    false,
  );


  const [
    wishlistError,
    setWishlistError,
  ] = useState(
    "",
  );


  /* ==========================================================
     REVIEW DEEP LINK
  ========================================================== */

  useEffect(() => {
    if (
      window.location.hash !==
      "#reviews"
    ) {
      return;
    }


    const timer =
      window.setTimeout(
        () => {
          setActiveTab(
            "reviews",
          );


          document
            .getElementById(
              "reviews",
            )
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });
        },
        50,
      );


    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);


  /* ==========================================================
     WISHLIST STATUS
  ========================================================== */

  useEffect(() => {
    if (!product) {
      return;
    }


    const token =
      getAccessToken();


    if (!token) {
      return;
    }


    const accessToken =
      token;

    const productId =
      product.id;


    let cancelled =
      false;


    async function loadWishlistStatus() {
      try {
        const productIds =
          await getWishlistProductIds(
            accessToken,
          );


        if (
          cancelled
        ) {
          return;
        }


        setIsWishlisted(
          productIds.includes(
            productId,
          ),
        );

      } catch {
        /*
         * Product Details stays usable even if
         * Wishlist status cannot be loaded.
         */
      }
    }


    void loadWishlistStatus();


    return () => {
      cancelled =
        true;
    };
  }, [
    product,
  ]);


  /* ==========================================================
     CART COUNT
  ========================================================== */

  useEffect(() => {
    function syncCart() {
      setCartCount(
        getCartCount(),
      );
    }

    syncCart();

    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCart,
    );

    window.addEventListener(
      "storage",
      syncCart,
    );

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCart,
      );

      window.removeEventListener(
        "storage",
        syncCart,
      );
    };
  }, []);


  /* ==========================================================
     PRODUCT + CATALOG
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      try {
        setLoading(
          true,
        );

        setError(
          "",
        );

        const productResult =
          await getProductBySlug(
            slug,
          );

        if (cancelled) {
          return;
        }

        setProduct(
          productResult,
        );

        const [
          categoryResult,
          brandResult,
        ] =
          await Promise.allSettled([
            getCategories(),
            getBrands(),
          ]);

        if (cancelled) {
          return;
        }

        if (
          categoryResult.status ===
          "fulfilled"
        ) {
          setCategories(
            categoryResult.value,
          );
        }

        if (
          brandResult.status ===
          "fulfilled"
        ) {
          setBrands(
            brandResult.value,
          );
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        setProduct(
          null,
        );

        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load this product.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
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
    slug,
  ]);


  /* ==========================================================
     GARAGE + COMPATIBILITY
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadCompatibility() {
      if (
        !product
      ) {
        return;
      }

      const token =
        getAccessToken();

      if (!token) {
        if (
          !cancelled
        ) {
          setActiveVehicle(
            null,
          );

          setCompatible(
            null,
          );

          setCompatibilityError(
            "",
          );
        }

        return;
      }

      try {
        setCompatibilityLoading(
          true,
        );

        setCompatibilityError(
          "",
        );

        const vehicles =
          await getVehicles(
            token,
          );

        if (cancelled) {
          return;
        }

        const active =
          vehicles.find(
            (vehicle) =>
              vehicle.is_active,
          ) ?? null;

        setActiveVehicle(
          active,
        );

        if (!active) {
          setCompatible(
            null,
          );

          return;
        }

        const compatibleProducts =
          await getCompatibleProducts(
            token,
            active.id,
          );

        if (cancelled) {
          return;
        }

        setCompatible(
          compatibleProducts.some(
            (item) =>
              item.id ===
              product.id,
          ),
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setCompatible(
          null,
        );

        setCompatibilityError(
          err instanceof ApiError
            ? err.message
            : "Unable to check vehicle compatibility.",
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

    void loadCompatibility();

    return () => {
      cancelled =
        true;
    };
  }, [
    product,
  ]);


  /* ==========================================================
     LOOKUPS
  ========================================================== */

  const brand =
    useMemo(
      () =>
        brands.find(
          (item) =>
            item.id ===
            product?.brand_id,
        ) ?? null,
      [
        brands,
        product,
      ],
    );

  const category =
    useMemo(
      () =>
        categories.find(
          (item) =>
            item.id ===
            product?.category_id,
        ) ?? null,
      [
        categories,
        product,
      ],
    );

  const subcategory =
    useMemo(() => {
      if (
        !category ||
        !product
      ) {
        return null;
      }

      return (
        category.subcategories.find(
          (item) =>
            item.slug ===
            product.subcategory_slug,
        ) ?? null
      );
    }, [
      category,
      product,
    ]);


  /* ==========================================================
     SEARCH
  ========================================================== */

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const value =
      search.trim();

    if (!value) {
      router.push(
        "/shop",
      );

      return;
    }

    router.push(
      `/shop?search=${encodeURIComponent(
        value,
      )}`,
    );
  }


  /* ==========================================================
     WISHLIST ACTION
  ========================================================== */

  async function toggleWishlist() {
    if (
      !product ||
      wishlistBusy
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


    try {
      setWishlistBusy(
        true,
      );

      setWishlistError(
        "",
      );


      if (
        isWishlisted
      ) {
        await removeWishlistProduct(
          token,
          product.id,
        );


        setIsWishlisted(
          false,
        );

      } else {
        await addWishlistProduct(
          token,
          product.id,
        );


        setIsWishlisted(
          true,
        );
      }

    } catch (
      wishlistActionError
    ) {
      setWishlistError(
        wishlistActionError instanceof
          Error
          ? wishlistActionError.message
          : "Unable to update wishlist.",
      );

    } finally {
      setWishlistBusy(
        false,
      );
    }
  }


  /* ==========================================================
     ADD TO CART
  ========================================================== */

  function handleAddToCart() {
    if (
      !product ||
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

    const safeQuantity =
      Math.min(
        quantity,
        product.stock_quantity,
      );

    for (
      let index = 0;
      index <
      safeQuantity;
      index += 1
    ) {
      addToCart(
        product,
      );
    }

    setCartCount(
      getCartCount(),
    );

    setAdded(
      true,
    );

    window.setTimeout(
      () => {
        setAdded(
          false,
        );
      },
      1200,
    );
  }


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7f9]">
        <Navbar
          cartCount={
            cartCount
          }
          search={
            search
          }
          setSearch={
            setSearch
          }
          onSearch={
            handleSearch
          }
        />

        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-[#667085]">
            <Loader2 className="h-5 w-5 animate-spin" />

            Loading product...
          </div>
        </div>
      </main>
    );
  }


  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error ||
    !product
  ) {
    return (
      <main className="min-h-screen bg-[#f6f7f9]">
        <Navbar
          cartCount={
            cartCount
          }
          search={
            search
          }
          setSearch={
            setSearch
          }
          onSearch={
            handleSearch
          }
        />

        <div className="mx-auto max-w-[1180px] px-5 py-20">
          <div className="rounded-[6px] border border-[#e4e7ec] bg-white px-8 py-14 text-center">
            <PackageSearch className="mx-auto h-10 w-10 text-[#98a2b3]" />

            <h1 className="mt-4 text-xl font-bold text-[#101828]">
              Product unavailable
            </h1>

            <p className="mt-2 text-sm text-[#667085]">
              {error ||
                "This product could not be found."}
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-[4px] bg-[#e31b2d] px-5 text-xs font-bold text-white transition hover:bg-[#c81424]"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }


  const effectivePrice =
    product.sale_price ??
    product.price;

  const hasSale =
    product.sale_price !==
      null &&
    product.sale_price <
      product.price;


  const discountPercent =
    hasSale &&
    product.price >
      0
      ? Math.round(
          (
            (
              product.price -
              effectivePrice
            ) /
            product.price
          ) *
            100,
        )
      : 0;

  const outOfStock =
    product.stock_quantity <=
    0;

  const image =
    product.images[0]?.trim() ||
    getReferenceImage(
      product,
    );

  const referenceImage =
    !product.images[0]?.trim() &&
    Boolean(
      image,
    );


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f4f7] text-[#101828]">
      <Navbar
        cartCount={
          cartCount
        }
        search={
          search
        }
        setSearch={
          setSearch
        }
        onSearch={
          handleSearch
        }
      />


      {/* ====================================================
          CINEMATIC PRODUCT STAGE
      ==================================================== */}

      <section className="relative overflow-hidden bg-[#061827] pb-14 pt-7 text-white lg:pb-20 lg:pt-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.26)_1px,transparent_1px)] [background-size:72px_72px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[260px] -top-[250px] h-[720px] w-[720px] rounded-full bg-[#e31b2d]/15 blur-[130px]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-[340px] left-[8%] h-[620px] w-[760px] rounded-full bg-[#3274a8]/10 blur-[150px]"
        />


        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [
                    -80,
                    70,
                    -80,
                  ],

                  opacity: [
                    0.18,
                    0.48,
                    0.18,
                  ],
                }
          }
          transition={{
            duration:
              10,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          }}
          className="absolute bottom-[12%] left-[4%] h-[3px] w-[62%] rotate-[-7deg] bg-gradient-to-r from-transparent via-[#e31b2d]/60 to-transparent blur-[2px]"
        />


        <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
          {/* BREADCRUMB */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    x:
                      -20,
                  }
            }
            animate={{
              x:
                0,
            }}
            transition={{
              duration:
                0.5,
            }}
            className="flex flex-wrap items-center gap-2 text-[8px] font-semibold text-[#8194a4]"
          >
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />

              Marketplace
            </Link>

            <ChevronRight className="h-3 w-3 text-[#536979]" />

            <span>
              {category?.name ??
                "Parts"}
            </span>

            <ChevronRight className="h-3 w-3 text-[#536979]" />

            <span className="text-[#d3dce4]">
              {subcategory?.name ??
                formatSlug(
                  product.subcategory_slug,
                )}
            </span>
          </motion.div>


          <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_minmax(430px,0.88fr)] xl:items-start">
            {/* ==================================================
                IMAGE STAGE
            ================================================== */}

            <motion.section
              initial={
                reduceMotion
                  ? false
                  : {
                      x:
                        -35,

                      scale:
                        0.985,
                    }
              }
              animate={{
                x:
                  0,

                scale:
                  1,
              }}
              transition={{
                duration:
                  0.72,

                ease:
                  "easeOut",
              }}
              className="relative overflow-hidden rounded-[24px] border border-white/[0.10] bg-white shadow-[0_34px_90px_rgba(0,0,0,.24)]"
            >
              <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#f8fafb_52%,#edf1f4_100%)] p-8 sm:min-h-[610px] sm:p-12">
                <div
                  aria-hidden="true"
                  className="absolute h-[470px] w-[470px] rounded-full border border-[#d8dee4]/55"
                />

                <div
                  aria-hidden="true"
                  className="absolute h-[350px] w-[350px] rounded-full border border-[#e3e7eb]"
                />

                <motion.div
                  aria-hidden="true"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          rotate:
                            360,
                        }
                  }
                  transition={{
                    duration:
                      30,

                    repeat:
                      Infinity,

                    ease:
                      "linear",
                  }}
                  className="absolute h-[540px] w-[540px] rounded-full border border-dashed border-[#cfd6dc]/45"
                />


                <div className="absolute left-5 top-5 z-20 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#dce2e7] bg-white/90 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.12em] text-[#667085] shadow-sm backdrop-blur">
                    {brand?.name ??
                      "VEHNEXA"}
                  </span>


                  {hasSale && (
                    <span className="rounded-full bg-[#e31b2d] px-3 py-1.5 text-[7px] font-black text-white shadow-[0_6px_18px_rgba(227,27,45,.18)]">
                      SAVE {discountPercent}%
                    </span>
                  )}
                </div>


                {image ? (
                  <motion.div
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            scale:
                              1.045,

                            rotate:
                              -0.8,
                          }
                    }
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            y: [
                              0,
                              -7,
                              0,
                            ],
                          }
                    }
                    transition={{
                      y: {
                        duration:
                          5.5,

                        repeat:
                          Infinity,

                        ease:
                          "easeInOut",
                      },
                    }}
                    className="relative z-10 flex h-full w-full items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}

                    <img
                      src={
                        image
                      }
                      alt={
                        product.name
                      }
                      className="max-h-[470px] max-w-[92%] object-contain drop-shadow-[0_28px_30px_rgba(15,23,42,.14)] sm:max-h-[520px]"
                    />
                  </motion.div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-[20px] border border-[#e1e5e9] bg-white text-[#aab3bd] shadow-sm">
                      <PackageSearch className="h-8 w-8" />
                    </span>

                    <p className="mt-4 text-[10px] font-semibold text-[#98a2b3]">
                      Image unavailable
                    </p>
                  </div>
                )}


                {referenceImage && (
                  <span className="absolute bottom-5 left-5 z-20 rounded-full border border-[#dce2e7] bg-white/90 px-3 py-1.5 text-[7px] font-bold text-[#667085] shadow-sm backdrop-blur">
                    Reference image
                  </span>
                )}


                <span className="absolute bottom-5 right-5 z-20 rounded-full border border-[#dce2e7] bg-white/90 px-3 py-1.5 text-[7px] font-bold text-[#667085] shadow-sm backdrop-blur">
                  SKU {product.sku}
                </span>
              </div>


              <div className="grid border-t border-[#e7ebef] bg-[#fafbfc] sm:grid-cols-3">
                <ProductStageMetric
                  label="Category"
                  value={
                    category?.name ??
                    "Automotive Part"
                  }
                />

                <ProductStageMetric
                  label="Availability"
                  value={
                    outOfStock
                      ? "Out of stock"
                      : `${product.stock_quantity} in stock`
                  }
                />

                <ProductStageMetric
                  label="Customer rating"
                  value={`${product.rating_average.toFixed(
                    1,
                  )} / 5`}
                />
              </div>
            </motion.section>


            {/* ==================================================
                PURCHASE PANEL
            ================================================== */}

            <motion.aside
              initial={
                reduceMotion
                  ? false
                  : {
                      x:
                        35,

                      scale:
                        0.985,
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
                  0.08,

                duration:
                  0.72,

                ease:
                  "easeOut",
              }}
              className="xl:sticky xl:top-[90px]"
            >
              <div className="overflow-hidden rounded-[24px] border border-white/[0.10] bg-white/[0.065] shadow-[0_34px_90px_rgba(0,0,0,.20)] backdrop-blur-xl">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-1.5">
                      <Sparkles className="h-3 w-3 text-[#ff4b5a]" />

                      <span className="text-[7px] font-black uppercase tracking-[0.14em] text-[#b9c7d2]">
                        PRODUCT DETAIL
                      </span>
                    </div>


                    <span
                      className={
                        outOfStock
                          ? "rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-1.5 text-[7px] font-black text-[#a8b5c0]"
                          : "rounded-full border border-[#5cc791]/20 bg-[#5cc791]/10 px-3 py-1.5 text-[7px] font-black text-[#70dca5]"
                      }
                    >
                      {outOfStock
                        ? "UNAVAILABLE"
                        : "IN STOCK"}
                    </span>
                  </div>


                  <p className="mt-7 text-[9px] font-black uppercase tracking-[0.14em] text-[#8397a7]">
                    {brand?.name ??
                      "VEHNEXA"}
                  </p>


                  <h1 className="mt-2 text-[35px] font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-[44px]">
                    {
                      product.name
                    }
                  </h1>


                  <div className="mt-5 flex flex-wrap items-center gap-2 text-[9px]">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/10 px-2.5 py-1.5 font-bold text-[#f7d071]">
                      <Star className="h-3.5 w-3.5 fill-[#f4b740] text-[#f4b740]" />

                      {product.rating_average.toFixed(
                        1,
                      )}
                    </span>


                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(
                          "reviews",
                        );


                        window.setTimeout(
                          () => {
                            document
                              .getElementById(
                                "reviews",
                              )
                              ?.scrollIntoView({
                                behavior:
                                  "smooth",

                                block:
                                  "start",
                              });
                          },
                          0,
                        );
                      }}
                      className="text-[#a9b8c4] transition hover:text-white"
                    >
                      {product.review_count}{" "}
                      reviews
                    </button>


                    <span className="text-[#526a7b]">
                      ?
                    </span>

                    <span className="font-semibold text-[#a9b8c4]">
                      SKU {product.sku}
                    </span>
                  </div>


                  <div className="mt-6">
                    <CompatibilityBadge
                      vehicle={
                        activeVehicle
                      }
                      compatible={
                        compatible
                      }
                      loading={
                        compatibilityLoading
                      }
                      error={
                        compatibilityError
                      }
                    />
                  </div>


                  <div className="mt-7 flex flex-wrap items-end gap-3">
                    <span className="text-[42px] font-black leading-none tracking-[-0.055em] text-white sm:text-[48px]">
                      $
                      {effectivePrice.toFixed(
                        2,
                      )}
                    </span>


                    {hasSale && (
                      <span className="pb-1 text-[12px] font-semibold text-[#6f8495] line-through">
                        $
                        {product.price.toFixed(
                          2,
                        )}
                      </span>
                    )}
                  </div>


                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={
                        outOfStock
                          ? "h-2 w-2 rounded-full bg-[#778998]"
                          : product.stock_quantity <=
                              10
                            ? "h-2 w-2 rounded-full bg-[#f1a434]"
                            : "h-2 w-2 rounded-full bg-[#59d49a]"
                      }
                    />


                    <span
                      className={
                        outOfStock
                          ? "text-[9px] font-bold text-[#8798a6]"
                          : product.stock_quantity <=
                              10
                            ? "text-[9px] font-bold text-[#f2b65f]"
                            : "text-[9px] font-bold text-[#72dba8]"
                      }
                    >
                      {outOfStock
                        ? "Currently unavailable"
                        : product.stock_quantity <=
                            10
                          ? `Only ${product.stock_quantity} left in stock`
                          : `${product.stock_quantity} available now`}
                    </span>
                  </div>


                  <div className="my-7 h-px bg-white/[0.09]" />


                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#768b9b]">
                    Quantity
                  </p>


                  <div className="mt-3 grid gap-3 sm:grid-cols-[132px_1fr]">
                    <div className="flex h-12 items-center rounded-[9px] border border-white/[0.12] bg-black/10">
                      <button
                        type="button"
                        onClick={() => {
                          setQuantity(
                            (
                              current,
                            ) =>
                              Math.max(
                                1,
                                current -
                                  1,
                              ),
                          );
                        }}
                        disabled={
                          quantity <=
                          1
                        }
                        className="flex h-full w-10 items-center justify-center text-[#a7b6c2] transition hover:text-white disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>


                      <span className="flex-1 text-center text-[13px] font-black text-white">
                        {
                          quantity
                        }
                      </span>


                      <button
                        type="button"
                        onClick={() => {
                          setQuantity(
                            (
                              current,
                            ) =>
                              Math.min(
                                product.stock_quantity,
                                current +
                                  1,
                              ),
                          );
                        }}
                        disabled={
                          outOfStock ||
                          quantity >=
                            product.stock_quantity
                        }
                        className="flex h-full w-10 items-center justify-center text-[#a7b6c2] transition hover:text-white disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
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
                                1.015,
                            }
                          : undefined
                      }
                      whileTap={
                        !outOfStock &&
                        !reduceMotion
                          ? {
                              scale:
                                0.985,
                            }
                          : undefined
                      }
                      onClick={
                        handleAddToCart
                      }
                      className={`flex h-12 items-center justify-center gap-2 rounded-[9px] px-5 text-[10px] font-black text-white shadow-lg transition ${
                        outOfStock
                          ? "cursor-not-allowed bg-[#526372]"
                          : added
                            ? "bg-[#16804a]"
                            : "bg-[#e31b2d] shadow-[#e31b2d]/15 hover:bg-[#c81424]"
                      }`}
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
                                0.8,
                            }}
                            animate={{
                              scale:
                                1,
                            }}
                            exit={{
                              scale:
                                0.8,
                            }}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-4 w-4" />

                            Added to cart
                          </motion.span>
                        ) : (
                          <motion.span
                            key="cart"
                            initial={{
                              scale:
                                0.9,
                            }}
                            animate={{
                              scale:
                                1,
                            }}
                            exit={{
                              scale:
                                0.9,
                            }}
                            className="flex items-center gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />

                            Add to cart
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>


                  <motion.button
                    type="button"
                    onClick={() =>
                      void toggleWishlist()
                    }
                    disabled={
                      wishlistBusy
                    }
                    aria-pressed={
                      isWishlisted
                    }
                    whileTap={
                      reduceMotion
                        ? undefined
                        : {
                            scale:
                              0.985,
                          }
                    }
                    className={
                      isWishlisted
                        ? "mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-[#ff5361]/35 bg-[#e31b2d]/10 text-[9px] font-bold text-[#ff6470] transition disabled:opacity-60"
                        : "mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-white/[0.12] bg-white/[0.04] text-[9px] font-bold text-[#c7d2db] transition hover:border-[#e31b2d]/35 hover:bg-[#e31b2d]/10 hover:text-white disabled:opacity-60"
                    }
                  >
                    <Heart
                      className={
                        isWishlisted
                          ? "h-4 w-4 fill-current"
                          : "h-4 w-4"
                      }
                    />


                    {wishlistBusy
                      ? "Updating..."
                      : isWishlisted
                        ? "Saved to wishlist"
                        : "Save to wishlist"}
                  </motion.button>


                  {wishlistError && (
                    <p className="mt-3 rounded-[8px] border border-[#ef5a66]/20 bg-[#e31b2d]/10 px-3 py-2 text-[8px] leading-4 text-[#ff8a94]">
                      {
                        wishlistError
                      }
                    </p>
                  )}


                  <div className="mt-7 grid grid-cols-2 gap-2 border-t border-white/[0.09] pt-6">
                    <DarkInfoCard
                      label="Warranty"
                      value={
                        product.warranty ||
                        "Not specified"
                      }
                    />

                    <DarkInfoCard
                      label="Part number"
                      value={
                        product.part_number
                      }
                    />
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>


      {/* ====================================================
          PRODUCT SIGNALS
      ==================================================== */}

      <section className="border-b border-[#e0e5e9] bg-white">
        <div className="mx-auto grid max-w-[1480px] sm:grid-cols-3">
          <ProductSignal
            icon={
              PackageCheck
            }
            eyebrow="CATALOG STOCK"
            title={
              outOfStock
                ? "Currently unavailable"
                : `${product.stock_quantity} units listed`
            }
            description="Inventory status comes directly from the current Vehnexa catalog record."
          />


          <ProductSignal
            icon={
              CarFront
            }
            eyebrow="VEHICLE CONTEXT"
            title={
              activeVehicle
                ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
                : "Garage-ready fitment"
            }
            description={
              activeVehicle
                ? "This product can be checked against your active Garage vehicle."
                : "Sign in and select an active vehicle when you want compatibility context."
            }
          />


          <ProductSignal
            icon={
              BadgeCheck
            }
            eyebrow="CUSTOMER FEEDBACK"
            title={`${product.review_count} customer ${
              product.review_count ===
              1
                ? "review"
                : "reviews"
            }`}
            description="Review submission follows Vehnexa's purchase-eligibility rules."
          />
        </div>
      </section>


      {/* ====================================================
          INFORMATION
      ==================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
              PRODUCT INFORMATION
            </p>

            <h2 className="mt-3 text-[34px] font-black tracking-[-0.045em] text-[#101828] sm:text-[42px]">
              Everything around this part.
            </h2>

            <p className="mt-3 max-w-[680px] text-[10px] leading-5 text-[#667085]">
              Explore the product description,
              catalog specifications, Garage
              fitment context and customer
              feedback without leaving the
              product page.
            </p>
          </div>


          <Link
            href="/shop"
            className="group inline-flex h-10 items-center gap-2 self-start rounded-[8px] border border-[#d6dce2] bg-white px-4 text-[8px] font-bold text-[#344054] transition hover:border-[#e31b2d]/30 hover:text-[#e31b2d] lg:self-auto"
          >
            Back to marketplace

            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </Link>
        </div>


        <section
          id="reviews"
          className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#dce2e7] bg-white shadow-[0_16px_50px_rgba(15,23,42,.055)]"
        >
          <div className="border-b border-[#e8ecef] bg-[#fafbfc] p-2 sm:p-3">
            <div className="flex overflow-x-auto rounded-[12px] bg-[#f1f3f5] p-1.5">
              <TabButton
                active={
                  activeTab ===
                  "overview"
                }
                onClick={() =>
                  setActiveTab(
                    "overview",
                  )
                }
              >
                Overview
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  "specifications"
                }
                onClick={() =>
                  setActiveTab(
                    "specifications",
                  )
                }
              >
                Specifications
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  "fitment"
                }
                onClick={() =>
                  setActiveTab(
                    "fitment",
                  )
                }
              >
                Fitment
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  "reviews"
                }
                onClick={() =>
                  setActiveTab(
                    "reviews",
                  )
                }
              >
                Reviews

                {product.review_count >
                  0 && (
                  <span className="ml-1.5 rounded-full bg-[#e7eaee] px-1.5 py-0.5 text-[7px] font-black text-[#667085]">
                    {
                      product.review_count
                    }
                  </span>
                )}
              </TabButton>
            </div>
          </div>


          <div className="p-6 sm:p-8 lg:p-10">
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.div
                key={
                  activeTab
                }
                initial={
                  reduceMotion
                    ? false
                    : {
                        y:
                          16,

                        scale:
                          0.995,
                      }
                }
                animate={{
                  y:
                    0,

                  scale:
                    1,
                }}
                exit={
                  reduceMotion
                    ? undefined
                    : {
                        y:
                          -8,

                        scale:
                          0.997,
                      }
                }
                transition={{
                  duration:
                    0.26,
                }}
              >
                {activeTab ===
                  "overview" && (
                  <OverviewTab
                    product={
                      product
                    }
                  />
                )}


                {activeTab ===
                  "specifications" && (
                  <SpecificationsTab
                    product={
                      product
                    }
                  />
                )}


                {activeTab ===
                  "fitment" && (
                  <FitmentTab
                    vehicle={
                      activeVehicle
                    }
                    compatible={
                      compatible
                    }
                    loading={
                      compatibilityLoading
                    }
                    error={
                      compatibilityError
                    }
                  />
                )}


                {activeTab ===
                  "reviews" && (
                  <ReviewsTab
                    product={
                      product
                    }
                    onProductUpdated={(
                      updatedProduct,
                    ) =>
                      setProduct(
                        updatedProduct,
                      )
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>


        <div className="relative mt-12 overflow-hidden rounded-[20px] bg-[#071b2d] px-6 py-9 text-white shadow-[0_25px_70px_rgba(7,27,45,.16)] sm:px-9 lg:px-11">
          <div
            aria-hidden="true"
            className="absolute -right-[100px] -top-[150px] h-[400px] w-[400px] rounded-full bg-[#e31b2d]/15 blur-[90px]"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-[#ff5a67]">
                KEEP EXPLORING
              </p>

              <h3 className="mt-2 text-[27px] font-black tracking-[-0.04em] sm:text-[34px]">
                Need another component?
              </h3>

              <p className="mt-2 max-w-[620px] text-[9px] leading-5 text-[#9fb0bd]">
                Return to the marketplace to
                compare more parts, or open My
                Garage to change the vehicle used
                for compatibility context.
              </p>
            </div>


            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-5 text-[8px] font-black text-white transition hover:bg-[#c91625]"
              >
                Browse parts

                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/account/garage"
                className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-white/[0.13] bg-white/[0.05] px-5 text-[8px] font-black text-white transition hover:bg-white/[0.09]"
              >
                <CarFront className="h-3.5 w-3.5" />

                My Garage
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


/* ============================================================
   PRODUCT EXPERIENCE SUPPORT
============================================================ */

function ProductStageMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="border-b border-[#e7ebef] px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">
        {
          label
        }
      </p>

      <p className="mt-1.5 line-clamp-1 text-[10px] font-bold text-[#344054]">
        {
          value
        }
      </p>
    </div>
  );
}


function DarkInfoCard({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[10px] border border-white/[0.08] bg-black/10 p-3">
      <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#687f90]">
        {
          label
        }
      </p>

      <p className="mt-1.5 line-clamp-2 text-[9px] font-bold text-[#dce5ec]">
        {
          value
        }
      </p>
    </div>
  );
}


function ProductSignal({
  icon:
    Icon,
  eyebrow,
  title,
  description,
}: {
  icon:
    typeof PackageCheck;

  eyebrow:
    string;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="group flex gap-4 border-b border-[#edf0f2] px-5 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-8">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e0e5e9] bg-[#f5f7f9] text-[#596b7a] transition duration-300 group-hover:border-[#efc8cc] group-hover:bg-[#fff0f1] group-hover:text-[#e31b2d]">
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div>
        <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#98a2b3]">
          {
            eyebrow
          }
        </p>

        <p className="mt-1 text-[11px] font-black tracking-[-0.015em] text-[#101828]">
          {
            title
          }
        </p>

        <p className="mt-1.5 text-[8px] leading-4 text-[#7b8794]">
          {
            description
          }
        </p>
      </div>
    </div>
  );
}


function VehnexaMark() {
  return (
    <div
      className="relative h-[25px] w-[30px] shrink-0"
      aria-hidden="true"
    >
      <span
        className="absolute left-0 top-[2px] h-[18px] w-[12px] bg-[#f03a45]"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 66% 100%, 42% 100%)",

          transform:
            "skewX(7deg)",
        }}
      />

      <span
        className="absolute left-[8px] top-[5px] h-[18px] w-[13px] bg-[#f08c2e]"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 52% 100%, 30% 100%)",

          transform:
            "skewX(-4deg)",
        }}
      />

      <span
        className="absolute right-0 top-[2px] h-[20px] w-[16px] bg-[#d9e1e8]"
        style={{
          clipPath:
            "polygon(12% 0, 100% 0, 53% 100%, 0 100%)",

          transform:
            "skewX(-7deg)",
        }}
      />
    </div>
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function Navbar({
  cartCount,
  search,
  setSearch,
  onSearch,
}: {
  cartCount:
    number;

  search:
    string;

  setSearch: (
    value: string,
  ) => void;

  onSearch: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
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
      <div className="mx-auto flex h-[66px] max-w-[1480px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
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


        <nav className="ml-8 hidden h-full items-center gap-8 lg:flex">
          <ProductTopNavLink
            href="/shop"
            label="Shop"
            active
          />

          <ProductTopNavLink
            href="/account/garage"
            label="My Garage"
          />

          <ProductTopNavLink
            href="/ai-mechanic"
            label="AI Mechanic"
          />

          <ProductTopNavLink
            href="/#resources"
            label="Resources"
          />
        </nav>


        <form
          onSubmit={
            onSearch
          }
          className="ml-auto hidden h-9 w-full max-w-[290px] items-center rounded-[8px] border border-white/[0.10] bg-white/[0.055] px-3 backdrop-blur md:flex"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[#93a5b3]" />

          <input
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search parts..."
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-[9px] font-medium text-white outline-none placeholder:text-[#718696]"
          />
        </form>


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
    </motion.header>
  );
}


function ProductTopNavLink({
  href,
  label,
  active = false,
}: {
  href:
    string;

  label:
    string;

  active?:
    boolean;
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


/* ============================================================
   COMPATIBILITY BADGE
============================================================ */

function CompatibilityBadge({
  vehicle,
  compatible,
  loading,
  error,
}: {
  vehicle:
    | Vehicle
    | null;

  compatible:
    | boolean
    | null;

  loading:
    boolean;

  error:
    string;
}) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-[9px] border border-[#d8e1e8] bg-white/95 px-3.5 py-2.5 text-[8px] font-bold text-[#667085] shadow-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#416b91]" />

        Checking vehicle fitment...
      </div>
    );
  }


  if (error) {
    return (
      <div className="inline-flex items-center gap-2 rounded-[9px] border border-[#f0c8cc] bg-[#fff2f3] px-3.5 py-2.5 text-[8px] font-bold text-[#b42318]">
        <ShieldCheck className="h-3.5 w-3.5" />

        Compatibility unavailable
      </div>
    );
  }


  if (!vehicle) {
    return (
      <Link
        href="/account/garage"
        className="inline-flex items-center gap-2 rounded-[9px] border border-[#cfe0ed] bg-[#f4f9fd] px-3.5 py-2.5 text-[8px] font-bold text-[#416b91] transition hover:border-[#9ec2df] hover:bg-white"
      >
        <CarFront className="h-3.5 w-3.5" />

        Select a vehicle to check fitment

        <ArrowRight className="h-3 w-3" />
      </Link>
    );
  }


  if (compatible) {
    return (
      <div className="inline-flex items-center gap-2 rounded-[9px] border border-[#aee3c4] bg-[#ecfdf3] px-3.5 py-2.5 text-[8px] font-black text-[#16804a] shadow-sm">
        <BadgeCheck className="h-3.5 w-3.5" />

        Fits your {vehicle.year}{" "}
        {vehicle.make}{" "}
        {vehicle.model}
      </div>
    );
  }


  return (
    <div className="inline-flex items-start gap-2 rounded-[9px] border border-[#ecd9a6] bg-[#fffbeb] px-3.5 py-2.5 text-[8px] font-bold leading-4 text-[#8a6415]">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />

      <span>
        Not marked compatible with your{" "}
        {vehicle.year}{" "}
        {vehicle.make}{" "}
        {vehicle.model} in Vehnexa demo fitment data
      </span>
    </div>
  );
}


/* ============================================================
   TABS
============================================================ */

function TabButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`relative flex h-10 shrink-0 items-center justify-center rounded-[9px] px-4 text-[9px] font-bold transition ${
        active
          ? "bg-white text-[#101828] shadow-[0_4px_14px_rgba(15,23,42,.08)]"
          : "text-[#667085] hover:bg-white/60 hover:text-[#344054]"
      }`}
    >
      {
        children
      }

      {active && (
        <motion.span
          layoutId="product-detail-active-tab"
          className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[#e31b2d]"
        />
      )}
    </button>
  );
}


/* ============================================================
   OVERVIEW
============================================================ */

function OverviewTab({
  product,
}: {
  product:
    Product;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#e31b2d]">
          OVERVIEW
        </p>

        <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-[#101828]">
          About this part
        </h2>

        <p className="mt-5 max-w-[720px] whitespace-pre-wrap text-[11px] leading-6 text-[#5f6c79]">
          {product.description ||
            "No product description is available."}
        </p>
      </div>


      <div className="grid gap-3 sm:grid-cols-2">
        <QuickInfo
          label="Warranty"
          value={
            product.warranty ||
            "Not specified"
          }
        />

        <QuickInfo
          label="Part number"
          value={
            product.part_number
          }
        />

        <QuickInfo
          label="SKU"
          value={
            product.sku
          }
        />

        <QuickInfo
          label="Availability"
          value={
            product.stock_quantity >
            0
              ? `${product.stock_quantity} in stock`
              : "Out of stock"
          }
        />
      </div>
    </div>
  );
}


/* ============================================================
   SPECIFICATIONS
============================================================ */

function SpecificationsTab({
  product,
}: {
  product:
    Product;
}) {
  const entries =
    Object.entries(
      product.specifications ??
        {},
    );


  return (
    <div>
      <div className="max-w-[720px]">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#e31b2d]">
          SPECIFICATIONS
        </p>

        <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-[#101828]">
          Catalog details
        </h2>

        <p className="mt-3 text-[10px] leading-5 text-[#667085]">
          Technical information stored on the
          current Vehnexa product record.
        </p>
      </div>


      {entries.length ===
      0 ? (
        <div className="mt-7 rounded-[14px] border border-dashed border-[#d4dae0] bg-[#fafbfc] px-6 py-10 text-center">
          <p className="text-[10px] font-semibold text-[#667085]">
            No additional specifications are available for this product.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(
            ([
              key,
              value,
            ]) => (
              <div
                key={
                  key
                }
                className="group rounded-[13px] border border-[#e0e5e9] bg-[#fafbfc] p-4 transition hover:border-[#d0d7dd] hover:bg-white hover:shadow-[0_10px_30px_rgba(15,23,42,.05)]"
              >
                <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">
                  {formatSlug(
                    key,
                  )}
                </p>

                <p className="mt-2 break-words text-[10px] font-bold leading-5 text-[#344054]">
                  {formatSpecificationValue(
                    value,
                  )}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}


/* ============================================================
   FITMENT
============================================================ */

function FitmentTab({
  vehicle,
  compatible,
  loading,
  error,
}: {
  vehicle:
    | Vehicle
    | null;

  compatible:
    | boolean
    | null;

  loading:
    boolean;

  error:
    string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#e31b2d]">
          VEHICLE FITMENT
        </p>

        <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-[#101828]">
          Check it against your Garage.
        </h2>

        <p className="mt-4 max-w-[520px] text-[10px] leading-5 text-[#667085]">
          Vehnexa checks this product against
          the active vehicle saved in My Garage.
          This gives you catalog context before
          you continue with a purchase.
        </p>

        <div className="mt-6">
          <CompatibilityBadge
            vehicle={
              vehicle
            }
            compatible={
              compatible
            }
            loading={
              loading
            }
            error={
              error
            }
          />
        </div>
      </div>


      <div className="relative overflow-hidden rounded-[18px] border border-[#d6e2ec] bg-[linear-gradient(135deg,#f5f9fc_0%,#edf5fb_100%)] p-6 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 h-60 w-60 rounded-full border border-[#4d86b8]/10"
        />

        <div
          aria-hidden="true"
          className="absolute -right-3 -top-6 h-36 w-36 rounded-full border border-[#4d86b8]/10"
        />


        {vehicle ? (
          <div className="relative">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] border border-[#c8dced] bg-white text-[#346aa5] shadow-sm">
                <CarFront className="h-6 w-6" />
              </span>

              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#64809d]">
                  ACTIVE VEHICLE
                </p>

                <p className="mt-1.5 text-[18px] font-black tracking-[-0.025em] text-[#183b5d]">
                  {vehicle.year}{" "}
                  {vehicle.make}{" "}
                  {vehicle.model}
                </p>

                <p className="mt-2 text-[9px] font-semibold text-[#667f96]">
                  {vehicle.engine}{" "}
                  ?{" "}
                  {
                    vehicle.transmission
                  }
                </p>
              </div>
            </div>


            <Link
              href="/account/garage"
              className="mt-7 inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#b9cee0] bg-white px-4 text-[8px] font-bold text-[#346aa5] transition hover:border-[#346aa5] hover:bg-[#346aa5] hover:text-white"
            >
              Change active vehicle

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="relative py-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-[12px] border border-[#d6e0e8] bg-white text-[#708496]">
              <CarFront className="h-6 w-6" />
            </span>

            <h3 className="mt-5 text-[17px] font-black text-[#183b5d]">
              No active vehicle selected
            </h3>

            <p className="mt-2 max-w-[430px] text-[9px] leading-5 text-[#667f96]">
              Add or select a vehicle in My
              Garage to make fitment context
              available on product pages.
            </p>

            <Link
              href="/account/garage"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#183b5d] px-4 text-[8px] font-bold text-white"
            >
              Open My Garage

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>


      <p className="text-[8px] leading-4 text-[#98a2b3] lg:col-span-2">
        Vehicle compatibility shown in this development catalog is based on Vehnexa demo fitment data and is not OEM-certified. Always verify fitment before installation.
      </p>
    </div>
  );
}


/* ============================================================
   REVIEWS
============================================================ */

function ReviewsTab({
  product,
  onProductUpdated,
}: {
  product:
    Product;

  onProductUpdated:
    (
      product:
        Product,
    ) =>
      void;
}) {
  const [
    reviews,
    setReviews,
  ] = useState<
    Review[]
  >([]);


  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(
    true,
  );


  const [
    reviewsError,
    setReviewsError,
  ] = useState(
    "",
  );


  const [
    eligibility,
    setEligibility,
  ] = useState<
    ReviewEligibility | null
  >(
    null,
  );


  const [
    eligibilityLoading,
    setEligibilityLoading,
  ] = useState(
    false,
  );


  const [
    eligibilityError,
    setEligibilityError,
  ] = useState(
    "",
  );


  const [
    signedIn,
    setSignedIn,
  ] = useState(
    false,
  );


  const [
    rating,
    setRating,
  ] = useState(
    0,
  );


  const [
    comment,
    setComment,
  ] = useState(
    "",
  );


  const [
    submitting,
    setSubmitting,
  ] = useState(
    false,
  );


  const [
    submitError,
    setSubmitError,
  ] = useState(
    "",
  );


  const [
    success,
    setSuccess,
  ] = useState(
    "",
  );


  useEffect(() => {
    let cancelled =
      false;


    const token =
      getAccessToken();


    /*
     * Authentication comes from localStorage, which is an
     * external browser system. Defer the React state sync so
     * we do not synchronously set state in the effect body.
     */
    const authTimer =
      window.setTimeout(
        () => {
          if (
            cancelled
          ) {
            return;
          }


          setSignedIn(
            Boolean(
              token,
            ),
          );


          if (!token) {
            setEligibility(
              null,
            );

            setEligibilityError(
              "",
            );

            setEligibilityLoading(
              false,
            );
          }
        },
        0,
      );


    async function loadReviews() {
      try {
        setReviewsLoading(
          true,
        );

        setReviewsError(
          "",
        );


        const result =
          await getProductReviews(
            product.id,
          );


        if (
          cancelled
        ) {
          return;
        }


        setReviews(
          result,
        );

      } catch (
        loadError
      ) {
        if (
          !cancelled
        ) {
          setReviewsError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load reviews.",
          );
        }

      } finally {
        if (
          !cancelled
        ) {
          setReviewsLoading(
            false,
          );
        }
      }
    }


    void loadReviews();


    if (token) {
      const accessToken =
        token;


      async function loadEligibility() {
        try {
          setEligibilityLoading(
            true,
          );

          setEligibilityError(
            "",
          );


          const result =
            await getReviewEligibility(
              accessToken,
              product.id,
            );


          if (
            cancelled
          ) {
            return;
          }


          setEligibility(
            result,
          );

        } catch (
          loadError
        ) {
          if (
            !cancelled
          ) {
            setEligibility(
              null,
            );


            setEligibilityError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to check review eligibility.",
            );
          }

        } finally {
          if (
            !cancelled
          ) {
            setEligibilityLoading(
              false,
            );
          }
        }
      }


      void loadEligibility();
    }


    return () => {
      cancelled =
        true;


      window.clearTimeout(
        authTimer,
      );
    };
  }, [
    product.id,
  ]);


  async function submitReview(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    const token =
      getAccessToken();


    if (!token) {
      setSubmitError(
        "Please sign in before submitting a review.",
      );

      return;
    }


    if (
      rating <
        1 ||
      rating >
        5
    ) {
      setSubmitError(
        "Please select a rating from 1 to 5 stars.",
      );

      return;
    }


    const normalizedComment =
      comment.trim();


    if (
      normalizedComment.length <
      2
    ) {
      setSubmitError(
        "Please write a short review before submitting.",
      );

      return;
    }


    try {
      setSubmitting(
        true,
      );

      setSubmitError(
        "",
      );

      setSuccess(
        "",
      );


      const created =
        await createReview(
          token,
          {
            product_id:
              product.id,

            rating:
              rating,

            comment:
              normalizedComment,
          },
        );


      setReviews(
        (
          current,
        ) => [
          created,
          ...current,
        ],
      );


      setEligibility({
        eligible:
          false,

        reason:
          "You already reviewed this product.",

        review_id:
          created.id,
      });


      setRating(
        0,
      );

      setComment(
        "",
      );


      setSuccess(
        "Thank you. Your review has been published.",
      );


      try {
        const refreshedProduct =
          await getProductBySlug(
            product.slug,
          );


        onProductUpdated(
          refreshedProduct,
        );

      } catch {
        /*
         * The submitted review is already saved.
         * A failed rating refresh must not make the
         * customer think submission failed.
         */
      }

    } catch (
      submitReviewError
    ) {
      setSubmitError(
        submitReviewError instanceof
          Error
          ? submitReviewError.message
          : "Unable to submit review.",
      );

    } finally {
      setSubmitting(
        false,
      );
    }
  }


  return (
    <div className="grid gap-10 xl:grid-cols-[340px_1fr]">
      <aside>
        <h2 className="text-[15px] font-bold text-[#101828]">
          Customer reviews
        </h2>


        <div className="mt-4 rounded-[14px] border border-[#e0e5e9] bg-[#fafbfc] p-5">
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-bold tracking-[-0.04em] text-[#101828]">
              {
                product.rating_average.toFixed(
                  1,
                )
              }
            </span>

            <span className="pb-1 text-[10px] text-[#667085]">
              / 5
            </span>
          </div>


          <div className="mt-2 flex gap-1">
            {[
              1,
              2,
              3,
              4,
              5,
            ].map(
              (
                star,
              ) => (
                <Star
                  key={
                    star
                  }
                  className={
                    star <=
                    Math.round(
                      product.rating_average,
                    )
                      ? "h-4 w-4 fill-[#f4b740] text-[#f4b740]"
                      : "h-4 w-4 text-[#d0d5dd]"
                  }
                />
              ),
            )}
          </div>


          <p className="mt-3 text-[10px] text-[#667085]">
            Based on{" "}
            {
              product.review_count
            }{" "}
            {
              product.review_count ===
              1
                ? "review"
                : "reviews"
            }
          </p>
        </div>


        <div className="mt-6">
          <h3 className="text-[12px] font-bold text-[#101828]">
            Write a review
          </h3>


          {!signedIn && (
            <div className="mt-3 rounded-[6px] border border-[#dfe3e8] bg-[#f8fafc] p-4">
              <p className="text-[10px] leading-5 text-[#667085]">
                Sign in to review products you have purchased and received.
              </p>

              <Link
                href="/login"
                className="mt-3 inline-flex h-9 items-center justify-center rounded-[4px] bg-[#071b2d] px-4 text-[9px] font-bold text-white"
              >
                Sign in to review
              </Link>
            </div>
          )}


          {signedIn &&
            eligibilityLoading && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[#667085]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />

              Checking purchase eligibility...
            </div>
          )}


          {signedIn &&
            !eligibilityLoading &&
            eligibilityError && (
            <div className="mt-3 rounded-[6px] border border-[#fecdca] bg-[#fff4f5] p-4 text-[9px] leading-5 text-[#b42318]">
              {
                eligibilityError
              }
            </div>
          )}


          {signedIn &&
            !eligibilityLoading &&
            !eligibilityError &&
            eligibility &&
            !eligibility.eligible && (
            <div className="mt-3 rounded-[6px] border border-[#e4e7ec] bg-[#fafbfc] p-4">
              <p className="text-[10px] leading-5 text-[#667085]">
                {
                  eligibility.reason ??
                  "This product is not currently eligible for review."
                }
              </p>
            </div>
          )}


          {signedIn &&
            eligibility?.eligible && (
            <form
              onSubmit={
                submitReview
              }
              className="mt-4"
            >
              <p className="text-[9px] font-semibold text-[#475467]">
                Your rating
              </p>


              <div className="mt-2 flex gap-1">
                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                ].map(
                  (
                    star,
                  ) => (
                    <button
                      key={
                        star
                      }
                      type="button"
                      onClick={() =>
                        setRating(
                          star,
                        )
                      }
                      aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                      className="rounded-[4px] p-1 transition hover:bg-[#fff8e6]"
                    >
                      <Star
                        className={
                          star <=
                          rating
                            ? "h-6 w-6 fill-[#f4b740] text-[#f4b740]"
                            : "h-6 w-6 text-[#d0d5dd]"
                        }
                      />
                    </button>
                  ),
                )}
              </div>


              <label className="mt-4 block">
                <span className="text-[9px] font-semibold text-[#475467]">
                  Your review
                </span>

                <textarea
                  value={
                    comment
                  }
                  onChange={(
                    event,
                  ) =>
                    setComment(
                      event.target.value,
                    )
                  }
                  maxLength={
                    2000
                  }
                  rows={
                    5
                  }
                  placeholder="How did this part perform?"
                  className="mt-2 w-full resize-none rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-3 text-[10px] leading-5 text-[#344054] outline-none transition focus:border-[#e31b2d]/50 focus:ring-4 focus:ring-[#e31b2d]/[0.05]"
                />

                <span className="mt-1 block text-right text-[8px] text-[#98a2b3]">
                  {
                    comment.length
                  }
                  /2000
                </span>
              </label>


              {submitError && (
                <p className="mt-3 text-[9px] leading-4 text-[#b42318]">
                  {
                    submitError
                  }
                </p>
              )}


              <button
                type="submit"
                disabled={
                  submitting
                }
                className="mt-4 flex h-11 w-full items-center justify-center rounded-[9px] bg-[#e31b2d] px-4 text-[9px] font-black text-white transition hover:bg-[#c81424] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {
                  submitting
                    ? "Submitting..."
                    : "Submit review"
                }
              </button>
            </form>
          )}


          {success && (
            <div className="mt-4 rounded-[6px] border border-[#abefc6] bg-[#ecfdf3] p-4 text-[9px] font-medium leading-5 text-[#067647]">
              {
                success
              }
            </div>
          )}
        </div>
      </aside>


      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#101828]">
              Verified customer feedback
            </h3>

            <p className="mt-1 text-[10px] text-[#667085]">
              Reviews are accepted after a delivered purchase.
            </p>
          </div>
        </div>


        {reviewsLoading && (
          <div className="mt-5 space-y-3">
            {[
              1,
              2,
              3,
            ].map(
              (
                item,
              ) => (
                <div
                  key={
                    item
                  }
                  className="h-[120px] animate-pulse rounded-[6px] bg-[#f2f4f7]"
                />
              ),
            )}
          </div>
        )}


        {!reviewsLoading &&
          reviewsError && (
          <div className="mt-5 rounded-[6px] border border-[#fecdca] bg-[#fff4f5] p-4 text-[9px] text-[#b42318]">
            {
              reviewsError
            }
          </div>
        )}


        {!reviewsLoading &&
          !reviewsError &&
          reviews.length ===
            0 && (
          <div className="mt-5 rounded-[6px] border border-dashed border-[#d0d5dd] bg-[#fafbfc] px-5 py-10 text-center">
            <Star className="mx-auto h-7 w-7 text-[#98a2b3]" />

            <p className="mt-3 text-[11px] font-bold text-[#344054]">
              No reviews yet
            </p>

            <p className="mt-1 text-[9px] text-[#667085]">
              Be the first verified customer to review this product.
            </p>
          </div>
        )}


        {!reviewsLoading &&
          !reviewsError &&
          reviews.length >
            0 && (
          <div className="mt-5 divide-y divide-[#eaecf0] overflow-hidden rounded-[14px] border border-[#e0e5e9] bg-white">
            {reviews.map(
              (
                review,
              ) => (
                <article
                  key={
                    review.id
                  }
                  className="p-5 transition hover:bg-[#fafbfc]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-[#101828]">
                        {
                          review.customer_name
                        }
                      </p>


                      {review.verified_purchase && (
                        <span className="mt-2 inline-flex rounded-full border border-[#abefc6] bg-[#ecfdf3] px-2 py-1 text-[7px] font-bold uppercase tracking-[0.05em] text-[#067647]">
                          Verified purchase
                        </span>
                      )}
                    </div>


                    <time className="text-[8px] text-[#98a2b3]">
                      {
                        formatReviewDate(
                          review.created_at,
                        )
                      }
                    </time>
                  </div>


                  <div className="mt-3 flex gap-0.5">
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                    ].map(
                      (
                        star,
                      ) => (
                        <Star
                          key={
                            star
                          }
                          className={
                            star <=
                            review.rating
                              ? "h-3.5 w-3.5 fill-[#f4b740] text-[#f4b740]"
                              : "h-3.5 w-3.5 text-[#d0d5dd]"
                          }
                        />
                      ),
                    )}
                  </div>


                  <p className="mt-3 whitespace-pre-wrap text-[11px] leading-6 text-[#475467]">
                    {
                      review.comment
                    }
                  </p>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}


function formatReviewDate(
  value: string,
): string {
  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }


  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "2-digit",

      year:
        "numeric",
    },
  ).format(
    date,
  );
}


/* ============================================================
   QUICK INFO
============================================================ */

function QuickInfo({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="group min-h-[105px] rounded-[14px] border border-[#e0e5e9] bg-[#fafbfc] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#d0d7dd] hover:bg-white hover:shadow-[0_10px_30px_rgba(15,23,42,.05)]">
      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">
        {
          label
        }
      </p>

      <p className="mt-3 break-words text-[11px] font-black leading-5 text-[#344054]">
        {
          value
        }
      </p>
    </div>
  );
}


/* ============================================================
   HELPERS
============================================================ */

function formatSlug(
  value: string,
) {
  return value
    .replace(
      /[-_]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}


function formatSpecificationValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not specified";
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    return String(
      value,
    );
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    return value
      .map(
        (item) =>
          String(
            item,
          ),
      )
      .join(", ");
  }

  if (
    typeof value ===
    "object"
  ) {
    try {
      return JSON.stringify(
        value,
      );
    } catch {
      return "Not specified";
    }
  }

  return String(
    value,
  );
}


function getReferenceImage(
  product: Product,
): string | null {
  const text = [
    product.name,
    product.description,
    product.sku,
    product.part_number,
    product.subcategory_slug,
  ]
    .join(
      " ",
    )
    .toLowerCase();

  const rules: {
    keywords: string[];
    image: string;
  }[] = [
    {
      keywords: [
        "brake pad",
      ],
      image:
        "/product-parts/brake-pad.svg",
    },
    {
      keywords: [
        "brake rotor",
      ],
      image:
        "/product-parts/brake-rotor.svg",
    },
    {
      keywords: [
        "brake caliper",
      ],
      image:
        "/product-parts/brake-caliper.svg",
    },
    {
      keywords: [
        "wheel speed sensor",
        "abs sensor",
      ],
      image:
        "/product-parts/abs-wheel-speed-sensor.svg",
    },
    {
      keywords: [
        "brake hose",
      ],
      image:
        "/product-parts/brake-hose.svg",
    },
    {
      keywords: [
        "brake fluid",
      ],
      image:
        "/product-parts/brake-fluid.svg",
    },
    {
      keywords: [
        "master cylinder",
      ],
      image:
        "/product-parts/brake-master-cylinder.svg",
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
        "strut assembly",
        "gas strut",
      ],
      image:
        "/product-parts/strut-assembly.jpg",
    },
    {
      keywords: [
        "control arm",
      ],
      image:
        "/product-parts/control-arm.jpg",
    },
    {
      keywords: [
        "wheel hub bearing",
        "wheel bearing assembly",
      ],
      image:
        "/product-parts/wheel-hub-bearing.jpg",
    },
    {
      keywords: [
        "outer tie rod",
      ],
      image:
        "/product-parts/outer-tie-rod.jpg",
    },
    {
      keywords: [
        "inner tie rod",
      ],
      image:
        "/product-parts/inner-tie-rod.svg",
    },
    {
      keywords: [
        "power steering pressure hose",
        "power steering hose",
      ],
      image:
        "/product-parts/power-steering-pressure-hose.jpg",
    },
    {
      keywords: [
        "power steering pump",
      ],
      image:
        "/product-parts/power-steering-pump.jpg",
    },
  ];

  const match =
    rules.find(
      (rule) =>
        rule.keywords.some(
          (keyword) =>
            text.includes(
              keyword,
            ),
        ),
    );

  return (
    match?.image ??
    null
  );
}