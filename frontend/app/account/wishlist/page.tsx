"use client";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";
import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  motion,
} from "framer-motion";

import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Heart,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingDown,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  ApiError,
  getCurrentUser,
  type UserPublic,
} from "@/lib/api";

import {
  getAccessToken,
  removeAccessToken,
} from "@/lib/auth";

import {
  addToCart,
  CART_UPDATED_EVENT,
  getCartCount,
} from "@/lib/cart";

import {
  getEffectivePrice,
  type Product,
} from "@/lib/products";

import {
  getWishlist,
  removeWishlistProduct,
} from "@/lib/wishlist";


export default function WishlistPage() {
  const router =
    useRouter();


  const [
    user,
    setUser,
  ] =
    useState<UserPublic | null>(
      null,
    );


  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      [],
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    error,
    setError,
  ] =
    useState(
      "",
    );


  const [
    message,
    setMessage,
  ] =
    useState(
      "",
    );


  const [
    removingId,
    setRemovingId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    cartCount,
    setCartCount,
  ] =
    useState(
      0,
    );


  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    const token =
      getAccessToken();


    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }


    const accessToken =
      token;


    let cancelled =
      false;


    async function loadPage() {
      try {
        const currentUser =
          await getCurrentUser(
            accessToken,
          );


        if (cancelled) {
          return;
        }


        setUser(
          currentUser,
        );

        setCartCount(
          getCartCount(),
        );


        try {
          const wishlist =
            await Promise.race([
              getWishlist(
                accessToken,
              ),

              new Promise<Product[]>(
                (
                  _resolve,
                  reject,
                ) => {
                  window.setTimeout(
                    () => {
                      reject(
                        new Error(
                          "Wishlist request timed out.",
                        ),
                      );
                    },
                    10000,
                  );
                },
              ),
            ]);


          if (cancelled) {
            return;
          }


          setProducts(
            wishlist,
          );
        } catch (wishlistError) {
          if (cancelled) {
            return;
          }


          setProducts(
            [],
          );

          setError(
            wishlistError instanceof
              ApiError
              ? wishlistError.message
              : wishlistError instanceof
                    Error
                ? wishlistError.message
                : "Unable to load wishlist.",
          );
        }
      } catch (loadError) {
        if (
          loadError instanceof ApiError &&
          (
            loadError.status === 401 ||
            loadError.status === 403
          )
        ) {
          removeAccessToken();

          router.replace(
            "/login",
          );

          return;
        }


        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Unable to load wishlist.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(
            false,
          );
        }
      }
    }


    void loadPage();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
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
     USER
  ========================================================== */

  const displayName =
    useMemo(() => {
      if (!user) {
        return "Customer";
      }


      return (
        `${user.first_name ?? ""} ${user.last_name ?? ""}`
          .trim() ||
        "Customer"
      );
    }, [
      user,
    ]);


  const initials =
    useMemo(() => {
      if (!user) {
        return "V";
      }


      return (
        `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
          .toUpperCase() ||
        "V"
      );
    }, [
      user,
    ]);


  /* ==========================================================
     REAL WISHLIST METRICS
  ========================================================== */

  const inStockCount =
    useMemo(
      () =>
        products.filter(
          (
            product,
          ) =>
            product.stock_quantity >
            0,
        ).length,
      [
        products,
      ],
    );


  const saleCount =
    useMemo(
      () =>
        products.filter(
          (
            product,
          ) =>
            product.sale_price !==
            null,
        ).length,
      [
        products,
      ],
    );


  const collectionValue =
    useMemo(
      () =>
        products.reduce(
          (
            total,
            product,
          ) =>
            total +
            getEffectivePrice(
              product,
            ),
          0,
        ),
      [
        products,
      ],
    );


  /* ==========================================================
     REMOVE
  ========================================================== */

  async function removeProduct(
    product: Product,
  ) {
    const token =
      getAccessToken();


    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }


    try {
      setRemovingId(
        product.id,
      );

      setError(
        "",
      );

      setMessage(
        "",
      );


      await removeWishlistProduct(
        token,
        product.id,
      );


      setProducts(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              product.id,
          ),
      );


      setMessage(
        "Product removed from wishlist.",
      );
    } catch (removeError) {
      setError(
        removeError instanceof ApiError
          ? removeError.message
          : "Unable to remove product.",
      );
    } finally {
      setRemovingId(
        null,
      );
    }
  }


  /* ==========================================================
     CART
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


    addToCart(
      product,
    );


    setCartCount(
      getCartCount(),
    );


    setMessage(
      "Product added to cart.",
    );

    setError(
      "",
    );
  }


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7f9] text-[#0b1520]">
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#061827]/95 text-white shadow-[0_8px_40px_rgba(2,12,22,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#e31b2d] font-black italic text-white shadow-[0_0_30px_rgba(227,27,45,0.28)]">
              <span className="relative z-10">
                V
              </span>

              <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
            </div>


            <div>
              <div className="text-[15px] font-black tracking-[-0.02em]">
                Vehnexa
              </div>

              <div className="text-[7px] font-semibold uppercase tracking-[0.28em] text-[#8ba0b4]">
                Drive smarter
              </div>
            </div>
          </Link>


          <nav className="ml-12 hidden items-center gap-8 xl:flex">
            <NavbarLink
              href="/shop"
              label="Shop"
            />

            <NavbarLink
              href="/account/garage"
              label="My Garage"
            />

            <NavbarLink
              href="/ai-mechanic"
              label="AI Mechanic"
            />

            <NavbarLink
              href="/orders"
              label="Orders"
            />
          </nav>


          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              aria-label="Search parts"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[#c4ced7] transition hover:bg-white/[0.06] hover:text-white sm:flex"
            >
              <Search className="h-[17px] w-[17px]" />
            </Link>


            <Link
              href="/cart"
              aria-label={`Cart with ${cartCount} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#c4ced7] transition hover:bg-white/[0.06] hover:text-white"
            >
              <ShoppingBag className="h-[17px] w-[17px]" />


              {cartCount > 0 && (
                <span className="absolute right-[1px] top-[1px] flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[8px] font-black leading-none text-white ring-2 ring-[#061827]">
                  {cartCount >
                  99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>


            <NavbarNotificationBell />


            <Link
              href="/account"
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
            >
              <UserRound className="h-[17px] w-[17px]" />
            </Link>


            <CustomerLogoutButton />
          </div>
        </div>
      </header>


      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-12%] top-[-45%] h-[660px] w-[660px] rounded-full bg-[#e31b2d]/[0.13] blur-[130px]" />

          <div className="absolute right-[-10%] top-[10%] h-[520px] w-[520px] rounded-full bg-[#2563eb]/[0.08] blur-[120px]" />

          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
              backgroundSize:
                "54px 54px",
            }}
          />


          <motion.div
            aria-hidden="true"
            animate={{
              x: [
                "-20%",
                "120%",
              ],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-[43%] h-px w-[34%] bg-gradient-to-r from-transparent via-[#ff394a] to-transparent opacity-70 shadow-[0_0_22px_rgba(255,57,74,0.75)]"
          />
        </div>


        <div className="relative mx-auto max-w-[1480px] px-4 pb-20 pt-18 sm:px-6 sm:pb-24 sm:pt-22 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <motion.div
              initial={{
                opacity: 0,
                y: 24,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.65,
              }}
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-[#ff394a]" />

                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff5967]">
                  Saved collection
                </span>
              </div>


              <h1 className="max-w-[920px] text-[55px] font-black leading-[0.92] tracking-[-0.06em] sm:text-[72px] lg:text-[88px] xl:text-[98px]">
                Save it now.
                <span className="block text-[#ff394a]">
                  Drive it later.
                </span>
              </h1>


              <p className="mt-8 max-w-[690px] text-[14px] leading-7 text-[#9fb0c0] sm:text-[15px]">
                Keep the parts that matter in one focused collection. Return when you are ready, inspect real stock and pricing, then move a saved part directly into your cart.
              </p>


              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex h-13 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-[0_16px_38px_rgba(227,27,45,0.24)] transition hover:bg-[#f32639]"
                >
                  Explore marketplace

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>


                <Link
                  href="/cart"
                  className="inline-flex h-13 items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] px-7 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-white/[0.08]"
                >
                  <ShoppingBag className="h-4 w-4" />

                  View cart
                </Link>
              </div>
            </motion.div>


            <motion.div
              initial={{
                opacity: 0,
                y: 26,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: 0.7,
                delay: 0.08,
              }}
              className="relative"
            >
              <div className="absolute inset-0 translate-y-8 rounded-[32px] bg-[#e31b2d]/10 blur-3xl" />


              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.055] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#91a6b8]">
                      Collection status
                    </p>

                    <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em]">
                      {loading
                        ? "Loading saved parts..."
                        : products.length ===
                            0
                          ? "Ready for your first save."
                          : `${products.length} ${
                              products.length ===
                              1
                                ? "part"
                                : "parts"
                            } waiting.`}
                    </h2>
                  </div>


                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#e31b2d] text-white shadow-[0_12px_30px_rgba(227,27,45,0.26)]">
                    <Heart className="h-5 w-5 fill-current" />
                  </div>
                </div>


                <div className="mt-9 grid grid-cols-3 gap-3">
                  <HeroStat
                    value={
                      loading
                        ? "—"
                        : String(
                            inStockCount,
                          )
                    }
                    label="In stock"
                  />

                  <HeroStat
                    value={
                      loading
                        ? "—"
                        : String(
                            saleCount,
                          )
                    }
                    label="On sale"
                  />

                  <HeroStat
                    value={
                      loading
                        ? "—"
                        : String(
                            cartCount,
                          )
                    }
                    label="In cart"
                  />
                </div>


                <div className="mt-7 flex items-start gap-3 border-t border-white/[0.08] pt-6">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5967]" />

                  <p className="text-[10px] leading-5 text-[#9fb0c0]">
                    Stock, prices and product details shown here come from the products currently saved in your real wishlist.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ======================================================
          METRICS
      ====================================================== */}

      <section className="border-b border-[#e4e8ec] bg-white">
        <div className="mx-auto grid max-w-[1480px] divide-y divide-[#edf0f2] px-4 sm:px-6 md:grid-cols-4 md:divide-x md:divide-y-0 lg:px-8">
          <MetricStrip
            icon={
              Heart
            }
            value={
              loading
                ? "—"
                : String(
                    products.length,
                  )
            }
            label="Saved parts"
            detail="Products currently in your wishlist"
          />


          <MetricStrip
            icon={
              CheckCircle2
            }
            value={
              loading
                ? "—"
                : String(
                    inStockCount,
                  )
            }
            label="Available now"
            detail="Saved products currently in stock"
          />


          <MetricStrip
            icon={
              Tag
            }
            value={
              loading
                ? "—"
                : String(
                    saleCount,
                  )
            }
            label="Sale priced"
            detail="Saved products with a sale price"
          />


          <MetricStrip
            icon={
              ShoppingBag
            }
            value={
              loading
                ? "—"
                : formatMoney(
                    collectionValue,
                  )
            }
            label="Collection value"
            detail="Sum of current effective prices"
          />
        </div>
      </section>


      {/* ======================================================
          FEEDBACK
      ====================================================== */}

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-7 rounded-2xl border border-[#f1b9bf] bg-[#fff2f3] px-5 py-4 text-[11px] font-semibold text-[#a3202c]"
          >
            {error}
          </motion.div>
        )}


        {message && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-7 flex items-center gap-3 rounded-2xl border border-[#bde6ce] bg-[#effbf4] px-5 py-4 text-[11px] font-semibold text-[#087443]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            {message}
          </motion.div>
        )}
      </div>


      {/* ======================================================
          ACCOUNT BODY
      ====================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* SIDEBAR */}

          <aside>
            <div className="sticky top-[100px] overflow-hidden rounded-[24px] border border-[#e0e5e9] bg-white shadow-[0_18px_50px_rgba(20,35,50,0.055)]">
              <div className="border-b border-[#edf0f2] p-6">
                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-[#071b2d] text-[16px] font-black text-white shadow-[0_12px_30px_rgba(7,27,45,0.16)]">
                  {initials}
                </div>


                <h2 className="mt-5 truncate text-[15px] font-black tracking-[-0.025em]">
                  {displayName}
                </h2>


                <p className="mt-1 truncate text-[9px] text-[#7d8995]">
                  {user?.email ??
                    "Customer account"}
                </p>
              </div>


              <div className="p-3">
                <ProfileLink
                  href="/account"
                  icon={
                    CircleUserRound
                  }
                  label="Overview"
                />

                <ProfileLink
                  href="/orders"
                  icon={
                    Package
                  }
                  label="Orders"
                />

                <ProfileLink
                  href="/account/garage"
                  icon={
                    ShieldCheck
                  }
                  label="My Garage"
                />

                <ProfileLink
                  href="/account/addresses"
                  icon={
                    MapPin
                  }
                  label="Addresses"
                />


                <div className="relative my-1 flex min-h-12 items-center gap-3 overflow-hidden rounded-xl bg-[#fff0f2] px-4 text-[10px] font-black text-[#df1e30]">
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#e31b2d]" />

                  <Heart className="h-4 w-4" />

                  Wishlist
                </div>


                <ProfileLink
                  href="/account/notifications"
                  icon={
                    Bell
                  }
                  label="Notifications"
                />
              </div>


              <div className="border-t border-[#edf0f2] p-4">
                <Link
                  href="/shop"
                  className="group flex items-center justify-between rounded-xl bg-[#071b2d] px-4 py-4 text-white transition hover:bg-[#0b263d]"
                >
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#8da2b4]">
                      Marketplace
                    </div>

                    <div className="mt-1 text-[10px] font-black">
                      Continue shopping
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </aside>


          {/* CONTENT */}

          <div className="min-w-0">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#e31b2d]">
                  <Heart className="h-4 w-4 fill-current" />

                  Saved marketplace
                </div>

                <h2 className="mt-3 text-[34px] font-black tracking-[-0.045em] sm:text-[44px]">
                  Parts worth keeping.
                </h2>

                <p className="mt-3 max-w-[700px] text-[12px] leading-6 text-[#697682]">
                  Revisit saved products, check their current stock and price, open the full product page, or move an available part directly to your cart.
                </p>
              </div>


              <Link
                href="/shop"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#dce2e6] bg-white px-6 text-[9px] font-black uppercase tracking-[0.1em] text-[#394652] transition hover:border-[#c7d0d7] hover:bg-[#fafbfc]"
              >
                <Search className="h-4 w-4" />

                Find more parts
              </Link>
            </div>


            {/* ==================================================
                PRODUCTS
            ================================================== */}

            {loading ? (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                      className="h-[520px] animate-pulse rounded-[26px] border border-[#e3e7eb] bg-white"
                    />
                  ),
                )}
              </div>
            ) : products.length ===
              0 ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-8 flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-[30px] border border-dashed border-[#ccd4db] bg-white px-6 text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 scale-[2.1] rounded-full bg-[#e31b2d]/10 blur-2xl" />

                  <div className="relative flex h-[90px] w-[90px] items-center justify-center rounded-[26px] bg-[#071b2d] text-white shadow-[0_20px_50px_rgba(7,27,45,0.18)]">
                    <Heart className="h-9 w-9" />
                  </div>
                </div>


                <div className="mt-9 text-[9px] font-black uppercase tracking-[0.22em] text-[#e31b2d]">
                  Collection empty
                </div>

                <h3 className="mt-3 text-[30px] font-black tracking-[-0.045em]">
                  Find something worth saving.
                </h3>

                <p className="mt-4 max-w-[500px] text-[11px] leading-6 text-[#71808c]">
                  Browse the Vehnexa marketplace and save products you want to return to later.
                </p>


                <Link
                  href="/shop"
                  className="group mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[10px] font-black uppercase tracking-[0.09em] text-white shadow-[0_14px_32px_rgba(227,27,45,0.2)]"
                >
                  Browse marketplace

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.map(
                  (
                    product,
                    index,
                  ) => {
                    const price =
                      getEffectivePrice(
                        product,
                      );


                    const image =
                      product.images[0] ??
                      null;


                    const onSale =
                      product.sale_price !==
                      null;


                    const inStock =
                      product.stock_quantity >
                      0;


                    return (
                      <motion.article
                        key={
                          product.id
                        }
                        initial={{
                          opacity: 0,
                          y: 22,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            Math.min(
                              index *
                                0.05,
                              0.3,
                            ),
                        }}
                        whileHover={{
                          y: -6,
                        }}
                        className="group relative overflow-hidden rounded-[26px] border border-[#e0e5e9] bg-white shadow-[0_18px_55px_rgba(18,32,45,0.055)]"
                      >
                        {/* IMAGE */}

                        <div className="relative overflow-hidden border-b border-[#edf0f2] bg-[#f7f9fa]">
                          <Link
                            href={`/product/${product.slug}`}
                            className="block"
                          >
                            <div
                              className="h-[245px] bg-contain bg-center bg-no-repeat transition duration-500 group-hover:scale-[1.025]"
                              style={
                                image
                                  ? {
                                      backgroundImage:
                                        `url("${image}")`,
                                    }
                                  : undefined
                              }
                            >
                              {!image && (
                                <div className="flex h-full items-center justify-center">
                                  <Package className="h-14 w-14 text-[#c6ced5]" />
                                </div>
                              )}
                            </div>
                          </Link>


                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            {onSale && (
                              <span className="rounded-full bg-[#e31b2d] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                                Sale
                              </span>
                            )}

                            <span
                              className={
                                inStock
                                  ? "rounded-full border border-[#c7e9d4] bg-[#effbf4] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#087443]"
                                  : "rounded-full border border-[#f0c8cc] bg-[#fff2f3] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#b4232f]"
                              }
                            >
                              {inStock
                                ? "In stock"
                                : "Out of stock"}
                            </span>
                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              void removeProduct(
                                product,
                              )
                            }
                            disabled={
                              removingId ===
                              product.id
                            }
                            aria-label={`Remove ${product.name} from wishlist`}
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#e31b2d] shadow-[0_8px_24px_rgba(17,31,44,0.1)] backdrop-blur transition hover:bg-[#fff0f2] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingId ===
                            product.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#e31b2d]/30 border-t-[#e31b2d]" />
                            ) : (
                              <Heart className="h-4 w-4 fill-current" />
                            )}
                          </button>
                        </div>


                        {/* CONTENT */}

                        <div className="p-6">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-[8px] font-black uppercase tracking-[0.16em] text-[#929da7]">
                              {product.sku}
                            </p>


                            <div className="flex shrink-0 items-center gap-1.5 text-[8px] font-bold text-[#667480]">
                              <Star className="h-3 w-3 fill-[#e31b2d] text-[#e31b2d]" />

                              {product.rating_average.toFixed(
                                1,
                              )}

                              <span className="text-[#a2abb3]">
                                (
                                {
                                  product.review_count
                                }
                                )
                              </span>
                            </div>
                          </div>


                          <Link
                            href={`/product/${product.slug}`}
                            className="mt-3 block min-h-[52px] text-[15px] font-black leading-6 tracking-[-0.025em] text-[#13202b] transition hover:text-[#e31b2d]"
                          >
                            {product.name}
                          </Link>


                          <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#edf0f2] pt-5">
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8b96a0]">
                                Current price
                              </p>

                              <div className="mt-1 flex items-end gap-2">
                                <span className="text-[22px] font-black tracking-[-0.04em] text-[#101c27]">
                                  {formatMoney(
                                    price,
                                  )}
                                </span>

                                {onSale && (
                                  <span className="pb-1 text-[9px] font-semibold text-[#9ca6af] line-through">
                                    {formatMoney(
                                      product.price,
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>


                            {onSale && (
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0f2] text-[#e31b2d]">
                                <TrendingDown className="h-4 w-4" />
                              </div>
                            )}
                          </div>


                          <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleAddToCart(
                                  product,
                                )
                              }
                              disabled={
                                !inStock
                              }
                              className="group/cart flex h-12 items-center justify-center gap-2 rounded-xl bg-[#071b2d] px-4 text-[9px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#102b42] disabled:cursor-not-allowed disabled:bg-[#b8c0ca]"
                            >
                              <ShoppingCart className="h-4 w-4" />

                              {inStock
                                ? "Add to cart"
                                : "Unavailable"}
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                void removeProduct(
                                  product,
                                )
                              }
                              disabled={
                                removingId ===
                                product.id
                              }
                              aria-label={`Delete ${product.name} from wishlist`}
                              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d9dfe4] text-[#b4232f] transition hover:border-[#efc2c7] hover:bg-[#fff2f3] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>


                          <Link
                            href={`/product/${product.slug}`}
                            className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl text-[8px] font-black uppercase tracking-[0.1em] text-[#66737e] transition hover:bg-[#f7f9fa] hover:text-[#17232e]"
                          >
                            View product details

                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </motion.article>
                    );
                  },
                )}
              </div>
            )}


            {/* ==================================================
                INFO
            ================================================== */}

            {!loading &&
              products.length >
                0 && (
                <section className="mt-10 grid gap-5 md:grid-cols-3">
                  <InfoCard
                    icon={
                      Heart
                    }
                    title="Your collection"
                    description="Wishlist products stay together so you can return to the parts you already selected."
                  />

                  <InfoCard
                    icon={
                      ShoppingCart
                    }
                    title="Cart ready"
                    description="Any saved product that is currently in stock can be moved directly into your existing cart."
                  />

                  <InfoCard
                    icon={
                      ShieldCheck
                    }
                    title="Live product data"
                    description="Pricing and stock shown on this page come from the saved product records returned by Vehnexa."
                  />
                </section>
              )}


            {/* ==================================================
                CTA
            ================================================== */}

            <section className="relative mt-10 overflow-hidden rounded-[30px] bg-[#071b2d] px-7 py-10 text-white sm:px-10 sm:py-12">
              <div className="pointer-events-none absolute right-[-80px] top-[-120px] h-[320px] w-[320px] rounded-full bg-[#e31b2d]/20 blur-[90px]" />


              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.22em] text-[#ff5967]">
                    <Sparkles className="h-4 w-4" />

                    Keep exploring
                  </div>


                  <h3 className="mt-4 max-w-[680px] text-[32px] font-black leading-[1.02] tracking-[-0.045em] sm:text-[42px]">
                    Build a collection around
                    <span className="text-[#ff394a]">
                      {" "}
                      your next drive.
                    </span>
                  </h3>


                  <p className="mt-4 max-w-[620px] text-[11px] leading-6 text-[#9eb0bf]">
                    Continue through the marketplace, inspect full product details, and save the parts you want to revisit.
                  </p>
                </div>


                <Link
                  href="/shop"
                  className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[9px] font-black uppercase tracking-[0.1em] shadow-[0_14px_34px_rgba(227,27,45,0.22)]"
                >
                  Explore parts

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}


/* ============================================================
   HELPERS
============================================================ */

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",
      currency:
        "USD",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}


function NavbarLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={
        href
      }
      className="relative py-2 text-[10px] font-bold text-[#b5c2cd] transition hover:text-white"
    >
      {label}
    </Link>
  );
}


function ProfileLink({
  href,
  icon:
    Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={
        href
      }
      className="group my-1 flex min-h-12 items-center gap-3 rounded-xl px-4 text-[10px] font-semibold text-[#596773] transition hover:bg-[#f5f7f9] hover:text-[#17232e]"
    >
      <Icon className="h-4 w-4 text-[#7b8792] transition group-hover:text-[#e31b2d]" />

      {label}
    </Link>
  );
}


function HeroStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4">
      <div className="text-[22px] font-black tracking-[-0.04em]">
        {value}
      </div>

      <div className="mt-1 text-[7px] font-black uppercase tracking-[0.16em] text-[#899dae]">
        {label}
      </div>
    </div>
  );
}


function MetricStrip({
  icon:
    Icon,
  value,
  label,
  detail,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[132px] items-center gap-4 px-2 py-6 md:px-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3f5f7] text-[#e31b2d]">
        <Icon className="h-4 w-4" />
      </div>


      <div className="min-w-0">
        <div className="truncate text-[18px] font-black tracking-[-0.035em]">
          {value}
        </div>

        <div className="mt-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-[#44515c]">
          {label}
        </div>

        <div className="mt-1 line-clamp-1 text-[7px] text-[#89949e]">
          {detail}
        </div>
      </div>
    </div>
  );
}


function InfoCard({
  icon:
    Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="rounded-[22px] border border-[#e1e6ea] bg-white p-6 shadow-[0_14px_40px_rgba(20,34,47,0.04)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f2] text-[#e31b2d]">
        <Icon className="h-4 w-4" />
      </div>


      <h3 className="mt-5 text-[13px] font-black tracking-[-0.02em]">
        {title}
      </h3>


      <p className="mt-2 text-[9px] leading-5 text-[#77848f]">
        {description}
      </p>
    </motion.div>
  );
}

