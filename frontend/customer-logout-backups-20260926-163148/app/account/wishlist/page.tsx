"use client";

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
  Heart,
  MapPin,
  Package,
  ShoppingCart,
  Trash2,
  UserRound,
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
        const [
          currentUser,
          wishlist,
        ] =
          await Promise.all([
            getCurrentUser(
              accessToken,
            ),

            getWishlist(
              accessToken,
            ),
          ]);


        if (
          cancelled
        ) {
          return;
        }


        setUser(
          currentUser,
        );

        setProducts(
          wishlist,
        );

        setCartCount(
          getCartCount(),
        );

      } catch (loadError) {
        if (
          loadError instanceof
            ApiError &&
          (
            loadError.status ===
              401 ||
            loadError.status ===
              403
          )
        ) {
          removeAccessToken();

          router.replace(
            "/login",
          );

          return;
        }


        if (
          !cancelled
        ) {
          setError(
            loadError instanceof
              ApiError
              ? loadError.message
              : "Unable to load wishlist.",
          );
        }

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


    void loadPage();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


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
        removeError instanceof
          ApiError
          ? removeError.message
          : "Unable to remove product.",
      );

    } finally {
      setRemovingId(
        null,
      );
    }
  }


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
    <main className="min-h-screen bg-[#f4f6f8] text-[#101828]">
      <header className="border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto flex h-[70px] max-w-[1320px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#ef3d43] text-[18px] font-black italic text-white">
              V
            </div>

            <span className="text-[15px] font-bold">
              Vehnexa
            </span>
          </Link>


          <nav className="ml-8 hidden h-full items-center gap-8 lg:flex">
            <Link
              href="/"
              className="text-[10px] text-[#667085]"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="text-[10px] text-[#667085]"
            >
              Shop
            </Link>

            <Link
              href="/account/garage"
              className="text-[10px] text-[#667085]"
            >
              My Garage
            </Link>

            <Link
              href="/ai-mechanic"
              className="text-[10px] text-[#667085]"
            >
              AI Mechanic
            </Link>

            <Link
              href="/orders"
              className="text-[10px] text-[#667085]"
            >
              Orders
            </Link>
          </nav>


          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/checkout"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#475467] hover:bg-[#f2f4f7]"
              aria-label="Cart"
            >
              <ShoppingCart className="h-4 w-4" />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef3d43] px-1 text-[7px] font-bold text-white">
                  {
                    cartCount
                  }
                </span>
              )}
            </Link>


            <NavbarNotificationBell />

            <Link
              href="/account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#071523] text-white"
              aria-label="Account"
            >
              <UserRound className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>


      <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-[31px] font-bold tracking-[-0.035em]">
            Wishlist
          </h1>

          <p className="mt-1.5 text-[12px] text-[#667085]">
            Save parts you are interested in and return to them whenever you are ready to buy.
          </p>
        </div>


        {error && (
          <div className="mt-6 rounded-[8px] border border-[#f1c7cc] bg-[#fff4f5] px-4 py-3 text-[10px] text-[#b4232f]">
            {
              error
            }
          </div>
        )}


        {message && (
          <div className="mt-6 rounded-[8px] border border-[#b7e4c7] bg-[#ecfdf3] px-4 py-3 text-[10px] text-[#087443]">
            {
              message
            }
          </div>
        )}


        <div className="mt-8 grid gap-7 lg:grid-cols-[235px_1fr]">
          <aside className="min-h-[535px] rounded-[16px] border border-[#dfe3e8] bg-white p-5">
            <div className="flex flex-col items-center py-2 text-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#071523] text-[17px] font-bold text-white">
                {
                  initials
                }
              </div>


              <h2 className="mt-4 text-[14px] font-bold">
                {
                  displayName
                }
              </h2>


              <p className="mt-1 text-[9px] text-[#667085]">
                Customer account
              </p>
            </div>


            <div className="mt-7 space-y-2">
              <ProfileLink
                href="/orders"
                icon={
                  Package
                }
                label="Orders"
              />


              <ProfileLink
                href="/account"
                icon={
                  UserRound
                }
                label="Account details"
              />


              <ProfileLink
                href="/account/addresses"
                icon={
                  MapPin
                }
                label="Saved addresses"
              />


              <div className="flex h-11 items-center gap-3 rounded-[7px] bg-[#fff0f1] px-4 text-[10px] font-semibold text-[#e31b2d]">
                <Heart className="h-4 w-4" />

                Wishlist
              </div>
            </div>
          </aside>


          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[16px] font-bold">
                Saved products
              </h2>


              {!loading && (
                <span className="text-[9px] text-[#667085]">
                  {products.length}{" "}
                  {products.length === 1
                    ? "item"
                    : "items"}
                </span>
              )}
            </div>


            {loading ? (
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                      className="h-[330px] animate-pulse rounded-[16px] bg-white"
                    />
                  ),
                )}
              </div>
            ) : products.length ===
              0 ? (
              <div className="mt-5 flex min-h-[330px] flex-col items-center justify-center rounded-[16px] border border-[#dfe3e8] bg-white px-6 text-center">
                <Heart className="h-10 w-10 text-[#b8c0ca]" />


                <h3 className="mt-4 text-[14px] font-bold">
                  Your wishlist is empty
                </h3>


                <p className="mt-2 max-w-[340px] text-[10px] leading-5 text-[#667085]">
                  Browse the marketplace and save parts you may want to purchase later.
                </p>


                <Link
                  href="/shop"
                  className="mt-5 rounded-[7px] bg-[#ef3d43] px-5 py-2.5 text-[10px] font-semibold text-white"
                >
                  Browse parts
                </Link>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map(
                  (
                    product,
                  ) => {
                    const price =
                      getEffectivePrice(
                        product,
                      );


                    const image =
                      product.images[0] ??
                      null;


                    return (
                      <article
                        key={
                          product.id
                        }
                        className="overflow-hidden rounded-[16px] border border-[#dfe3e8] bg-white"
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          className="block"
                        >
                          <div
                            className="h-[165px] bg-[#f7f8fa] bg-contain bg-center bg-no-repeat"
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
                                <Package className="h-10 w-10 text-[#c6ccd4]" />
                              </div>
                            )}
                          </div>
                        </Link>


                        <div className="p-5">
                          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                            {
                              product.sku
                            }
                          </p>


                          <Link
                            href={`/product/${product.slug}`}
                            className="mt-2 block min-h-[38px] text-[12px] font-bold leading-5 hover:text-[#e31b2d]"
                          >
                            {
                              product.name
                            }
                          </Link>


                          <div className="mt-4 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[15px] font-bold">
                                $
                                {
                                  price.toFixed(
                                    2,
                                  )
                                }
                              </p>


                              {product.sale_price !==
                                null && (
                                <p className="mt-1 text-[8px] text-[#98a2b3] line-through">
                                  $
                                  {
                                    product.price.toFixed(
                                      2,
                                    )
                                  }
                                </p>
                              )}
                            </div>


                            <span
                              className={
                                product.stock_quantity >
                                0
                                  ? "text-[8px] font-semibold text-[#087443]"
                                  : "text-[8px] font-semibold text-[#b42318]"
                              }
                            >
                              {product.stock_quantity >
                              0
                                ? "In stock"
                                : "Out of stock"}
                            </span>
                          </div>


                          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleAddToCart(
                                  product,
                                )
                              }
                              disabled={
                                product.stock_quantity <=
                                0
                              }
                              className="flex h-10 items-center justify-center gap-2 rounded-[7px] bg-[#071523] text-[9px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b8c0ca]"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />

                              Add to cart
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
                              aria-label="Remove from wishlist"
                              className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-[#d0d5dd] text-[#b42318] hover:bg-[#fff5f5] disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}


function ProfileLink({
  href,
  icon:
    Icon,
  label,
}: {
  href:
    string;

  icon:
    typeof Package;

  label:
    string;
}) {
  return (
    <Link
      href={
        href
      }
      className="flex h-11 items-center gap-3 rounded-[7px] px-4 text-[10px] font-medium text-[#475467] transition hover:bg-[#f8f9fb]"
    >
      <Icon className="h-4 w-4" />

      {
        label
      }
    </Link>
  );
}
