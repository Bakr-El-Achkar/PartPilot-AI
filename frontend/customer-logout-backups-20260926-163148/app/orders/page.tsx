"use client";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingCart,
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
  CART_UPDATED_EVENT,
  getCartCount,
} from "@/lib/cart";

import {
  getOrders,
  type Order,
} from "@/lib/orders";


export default function OrdersPage() {
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
    orders,
    setOrders,
  ] =
    useState<Order[]>(
      [],
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  const [
    cartCount,
    setCartCount,
  ] =
    useState(0);


  const [
    search,
    setSearch,
  ] =
    useState("");


  /* ==========================================================
     CART COUNT
  ========================================================== */

  useEffect(() => {
    const sync =
      () => {
        setCartCount(
          getCartCount(),
        );
      };


    sync();


    window.addEventListener(
      CART_UPDATED_EVENT,
      sync,
    );


    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        sync,
      );
    };
  }, []);


  /* ==========================================================
     SUCCESS MESSAGE
  ========================================================== */

  useEffect(() => {
    const orderNumber =
      window.sessionStorage.getItem(
        "vehnexa_order_placed",
      );


    if (!orderNumber) {
      return;
    }


    window.sessionStorage.removeItem(
      "vehnexa_order_placed",
    );


    const timer =
      window.setTimeout(
        () => {
          setSuccessMessage(
            `Order ${orderNumber} was placed successfully.`,
          );
        },
        0,
      );


    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);


  /* ==========================================================
     LOAD ACCOUNT + ORDERS
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
        setLoading(
          true,
        );

        setError(
          "",
        );


        const [
          currentUser,
          orderResult,
        ] =
          await Promise.all([
            getCurrentUser(
              accessToken,
            ),

            getOrders(
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

        setOrders(
          orderResult,
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
              : "Unable to load your orders.",
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


  /* ==========================================================
     ACCOUNT PRESENTATION
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


      const first =
        user.first_name?.[
          0
        ] ??
        "";


      const last =
        user.last_name?.[
          0
        ] ??
        "";


      return (
        `${first}${last}`
          .toUpperCase() ||
        "V"
      );
    }, [
      user,
    ]);


  /* ==========================================================
     SEARCH
  ========================================================== */

  function submitSearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    const value =
      search.trim();


    router.push(
      value
        ? `/shop?search=${encodeURIComponent(
            value,
          )}`
        : "/shop",
    );
  }


  /* ==========================================================
     SIGN OUT
  ========================================================== */

  function signOut() {
    removeAccessToken();

    router.replace(
      "/login",
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#101828]">
      <OrdersNavbar
        search={
          search
        }
        setSearch={
          setSearch
        }
        submitSearch={
          submitSearch
        }
        cartCount={
          cartCount
        }
      />


      <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-[31px] font-bold tracking-[-0.035em]">
            Orders &amp; Profile
          </h1>


          <p className="mt-1.5 text-[12px] text-[#667085]">
            Track purchases, manage account details and review your vehicle-linked order history.
          </p>
        </div>


        {successMessage && (
          <div className="mt-6 rounded-[8px] border border-[#b7e4c7] bg-[#ecfdf3] px-4 py-3 text-[11px] font-medium text-[#087443]">
            {
              successMessage
            }
          </div>
        )}


        {error && (
          <div className="mt-6 rounded-[8px] border border-[#f1c7cc] bg-[#fff4f5] px-4 py-3 text-[11px] text-[#b4232f]">
            {
              error
            }
          </div>
        )}


        <div className="mt-8 grid gap-7 lg:grid-cols-[235px_1fr]">
          {/* ==================================================
              PROFILE SIDEBAR
          ================================================== */}

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


              {user?.email && (
                <p className="mt-1 max-w-[180px] truncate text-[8px] text-[#98a2b3]">
                  {
                    user.email
                  }
                </p>
              )}
            </div>


            <div className="mt-7 space-y-2">
              <SidebarActiveItem
                icon={
                  Package
                }
                label="Orders"
              />


              <SidebarLink
                href="/account"
                icon={
                  UserRound
                }
                label="Account details"
              />


              <SidebarLink
                href="/account/addresses"
                icon={
                  MapPin
                }
                label="Saved addresses"
              />


              <SidebarLink
                href="/account/wishlist"
                icon={
                  Heart
                }
                label="Wishlist"
              />


              <SidebarPlaceholder
                icon={
                  Bell
                }
                label="Notifications"
              />


              <button
                type="button"
                onClick={
                  signOut
                }
                className="flex h-11 w-full items-center gap-3 rounded-[7px] px-4 text-[10px] font-medium text-[#475467] transition hover:bg-[#f8f9fb]"
              >
                <LogOut className="h-4 w-4" />

                Sign out
              </button>
            </div>
          </aside>


          {/* ==================================================
              ORDERS
          ================================================== */}

          <section>
            <h2 className="text-[16px] font-bold">
              Recent orders
            </h2>


            {loading ? (
              <div className="mt-6 space-y-5">
                {Array.from({
                  length: 3,
                }).map(
                  (
                    _,
                    index,
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="h-[105px] animate-pulse rounded-[14px] border border-[#dfe3e8] bg-white"
                    />
                  ),
                )}
              </div>
            ) : orders.length ===
              0 ? (
              <div className="mt-6 flex min-h-[300px] flex-col items-center justify-center rounded-[16px] border border-[#dfe3e8] bg-white text-center">
                <Package className="h-9 w-9 text-[#b8c0ca]" />


                <h3 className="mt-4 text-[14px] font-bold">
                  No orders yet
                </h3>


                <p className="mt-2 text-[10px] text-[#667085]">
                  Your purchases will appear here after checkout.
                </p>


                <Link
                  href="/shop"
                  className="mt-5 rounded-[6px] bg-[#ef3d43] px-5 py-2.5 text-[10px] font-semibold text-white"
                >
                  Browse parts
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {orders.map(
                  (
                    order,
                  ) => {
                    return (
                      <article
                        key={
                          order.id
                        }
                        className="overflow-hidden rounded-[14px] border border-[#dfe3e8] bg-white"
                      >
                        <div className="grid gap-4 px-5 py-5 sm:grid-cols-[1.2fr_.8fr_.55fr_auto] sm:items-center">
                          <div>
                            <p className="text-[11px] font-bold text-[#344054]">
                              #
                              {
                                order.order_number
                              }
                            </p>


                            <p className="mt-3 text-[9px] text-[#667085]">
                              {
                                formatOrderDate(
                                  order.created_at,
                                )
                              }
                            </p>
                          </div>


                          <div>
                            <OrderStatusBadge
                              status={
                                order.status
                              }
                            />
                          </div>


                          <p className="text-[12px] font-bold">
                            $
                            {
                              order.total.toFixed(
                                2,
                              )
                            }
                          </p>


                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#e31b2d]"
                          >
                            View

                            <ChevronRight className="h-3 w-3" />
                          </Link>
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


      <footer className="mt-8 border-t border-[#182a3d] bg-[#071523]">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 text-[8px] uppercase tracking-[0.12em] text-[#8393a3] sm:px-6 lg:px-8">
          <span>
            Vehnexa
          </span>


          <span>
            Orders / Profile
          </span>
        </div>
      </footer>
    </main>
  );
}


/* ============================================================
   DATE
============================================================ */

function formatOrderDate(
  value: string,
) {
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
   STATUS
============================================================ */

function OrderStatusBadge({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    status.toLowerCase();


  let classes =
    "bg-[#eef2f6] text-[#475467]";


  if (
    normalized ===
    "processing"
  ) {
    classes =
      "bg-[#fff5d6] text-[#a15c00]";
  }


  if (
    normalized ===
    "shipped"
  ) {
    classes =
      "bg-[#e8f1ff] text-[#2458a6]";
  }


  if (
    normalized ===
    "delivered"
  ) {
    classes =
      "bg-[#dcfae6] text-[#087443]";
  }


  if (
    normalized ===
    "cancelled"
  ) {
    classes =
      "bg-[#fee4e2] text-[#b42318]";
  }


  const label =
    normalized
      .replaceAll(
        "_",
        " ",
      )
      .replace(
        /\b\w/g,
        (
          character,
        ) =>
          character.toUpperCase(),
      );


  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[8px] font-semibold ${classes}`}
    >
      {
        label
      }
    </span>
  );
}


/* ============================================================
   SIDEBAR
============================================================ */

function SidebarActiveItem({
  icon:
    Icon,
  label,
}: {
  icon:
    typeof Package;

  label:
    string;
}) {
  return (
    <div className="flex h-11 items-center gap-3 rounded-[7px] bg-[#fff0f1] px-4 text-[10px] font-semibold text-[#e31b2d]">
      <Icon className="h-4 w-4" />

      {
        label
      }
    </div>
  );
}


function SidebarLink({
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


function SidebarPlaceholder({
  icon:
    Icon,
  label,
}: {
  icon:
    typeof Package;

  label:
    string;
}) {
  return (
    <div className="flex h-11 items-center gap-3 rounded-[7px] px-4 text-[10px] font-medium text-[#475467]">
      <Icon className="h-4 w-4" />

      {
        label
      }
    </div>
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function OrdersNavbar({
  search,
  setSearch,
  submitSearch,
  cartCount,
}: {
  search:
    string;

  setSearch:
    (
      value:
        string,
    ) =>
      void;

  submitSearch:
    (
      event:
        FormEvent<HTMLFormElement>,
    ) =>
      void;

  cartCount:
    number;
}) {
  return (
    <header className="border-b border-[#e4e7ec] bg-white">
      <div className="mx-auto flex h-[70px] max-w-[1320px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#ef3d43]">
            <span className="text-[18px] font-black italic text-white">
              V
            </span>
          </div>


          <span className="text-[15px] font-bold tracking-[-0.02em]">
            Vehnexa
          </span>
        </Link>


        <nav className="ml-5 hidden h-full items-center gap-8 lg:flex">
          <TopLink
            href="/"
            label="Home"
          />


          <TopLink
            href="/shop"
            label="Shop"
          />


          <TopLink
            href="/account/garage"
            label="My Garage"
          />


          <TopLink
            href="/ai-mechanic"
            label="AI Mechanic"
          />


          <TopLink
            href="/orders"
            label="Orders"
            active
          />
        </nav>


        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={
              submitSearch
            }
            className="relative hidden lg:block"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />


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
              className="h-10 w-[205px] rounded-full border border-[#d8dde3] bg-[#f7f8fa] pl-9 pr-4 text-[10px] outline-none"
            />
          </form>


          <Link
            href="/checkout"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#f2f4f7]"
          >
            <ShoppingCart className="h-[16px] w-[16px]" />


            {cartCount >
              0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[8px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>


          <NavbarNotificationBell />

          <Link
            href="/account"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#071523] text-white"
          >
            <UserRound className="h-[15px] w-[15px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}


function TopLink({
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
      className={`relative flex h-full items-center text-[10px] font-medium ${
        active
          ? "text-[#e31b2d]"
          : "text-[#667085]"
      }`}
    >
      {
        label
      }


      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#e31b2d]" />
      )}
    </Link>
  );
}
