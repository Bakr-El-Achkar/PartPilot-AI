"use client";

import Link from "next/link";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CreditCard,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  Star,
  UserRound,
} from "lucide-react";

import {
  ApiError,
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
  getOrder,
  type Order,
} from "@/lib/orders";


export default function OrderDetailsPage() {
  const router =
    useRouter();


  const params =
    useParams<{
      orderId: string;
    }>();


  const orderId =
    params.orderId;


  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null,
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
    const syncCart =
      () => {
        setCartCount(
          getCartCount(),
        );
      };


    syncCart();


    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCart,
    );


    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCart,
      );
    };
  }, []);


  /* ==========================================================
     LOAD ORDER
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


    async function loadOrder() {
      try {
        const result =
          await getOrder(
            accessToken,
            orderId,
          );


        if (
          cancelled
        ) {
          return;
        }


        setOrder(
          result,
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
              : "Unable to load this order.",
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


    void loadOrder();


    return () => {
      cancelled =
        true;
    };
  }, [
    orderId,
    router,
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
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f6f8]">
        <OrderNavbar
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


        <section className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6">
          <div className="h-5 w-40 animate-pulse rounded bg-[#e4e7ec]" />


          <div className="mt-7 h-[170px] animate-pulse rounded-[16px] bg-white" />


          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_.8fr]">
            <div className="h-[390px] animate-pulse rounded-[16px] bg-white" />

            <div className="h-[390px] animate-pulse rounded-[16px] bg-white" />
          </div>
        </section>
      </main>
    );
  }


  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error ||
    !order
  ) {
    return (
      <main className="min-h-screen bg-[#f4f6f8]">
        <OrderNavbar
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


        <section className="mx-auto max-w-[900px] px-4 py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-[#98a2b3]" />


          <h1 className="mt-5 text-[22px] font-bold">
            Order unavailable
          </h1>


          <p className="mt-2 text-[11px] text-[#667085]">
            {error ||
              "This order could not be found."}
          </p>


          <Link
            href="/orders"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-[7px] bg-[#e31b2d] px-5 text-[10px] font-semibold text-white"
          >
            Back to orders
          </Link>
        </section>
      </main>
    );
  }


  const itemCount =
    order.items.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.quantity,
      0,
    );


  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#101828]">
      <OrderNavbar
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


      <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-8 sm:px-6">
        {/* ====================================================
            BACK
        ==================================================== */}

        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#667085] transition hover:text-[#e31b2d]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />

          Back to orders
        </Link>


        {/* ====================================================
            ORDER HEADER
        ==================================================== */}

        <section className="mt-5 rounded-[16px] border border-[#dfe3e8] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#98a2b3]">
                Order
              </p>


              <h1 className="mt-2 text-[28px] font-bold tracking-[-0.035em] text-[#101828]">
                #
                {
                  order.order_number
                }
              </h1>


              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[9px] text-[#667085]">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />

                  {
                    formatOrderDate(
                      order.created_at,
                    )
                  }
                </span>


                <span>
                  {itemCount}{" "}
                  {itemCount ===
                  1
                    ? "item"
                    : "items"}
                </span>


                {order.vehicle_id && (
                  <span className="inline-flex items-center gap-2">
                    <CarFront className="h-3.5 w-3.5" />

                    Vehicle-linked order
                  </span>
                )}
              </div>
            </div>


            <OrderStatusBadge
              status={
                order.status
              }
            />
          </div>
        </section>


        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_.8fr]">
          {/* ==================================================
              ITEMS
          ================================================== */}

          <section className="rounded-[16px] border border-[#dfe3e8] bg-white p-6">
            <h2 className="text-[16px] font-bold">
              Order items
            </h2>


            <div className="mt-5">
              {order.items.map(
                (
                  item,
                  index,
                ) => (
                  <article
                    key={
                      item.product_id
                    }
                    className={`grid gap-4 py-5 sm:grid-cols-[72px_1fr_auto] sm:items-center ${
                      index >
                      0
                        ? "border-t border-[#eaecf0]"
                        : ""
                    }`}
                  >
                    <Link
                      href={
                        `/product/${item.slug}`
                      }
                      className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[8px] bg-[#f2f4f7]"
                    >
                      {item.image_url ? (
                        <div
                          role="img"
                          aria-label={
                            item.name
                          }
                          className="h-full w-full bg-contain bg-center bg-no-repeat"
                          style={{
                            backgroundImage:
                              `url("${item.image_url}")`,
                          }}
                        />
                      ) : (
                        <Package className="h-8 w-8 text-[#c1c9d2]" />
                      )}
                    </Link>


                    <div>
                      <Link
                        href={
                          `/product/${item.slug}`
                        }
                        className="text-[12px] font-bold text-[#202936] transition hover:text-[#e31b2d]"
                      >
                        {
                          item.name
                        }
                      </Link>


                      <p className="mt-2 text-[9px] text-[#98a2b3]">
                        SKU{" "}
                        {
                          item.sku
                        }
                      </p>


                      <p className="mt-2 text-[9px] text-[#667085]">
                        Qty{" "}
                        {
                          item.quantity
                        }{" "}

                        × $

                        {
                          item.unit_price.toFixed(
                            2,
                          )
                        }
                      </p>
                    </div>


                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <p className="text-[13px] font-bold sm:text-right">
                        $
                        {
                          item.line_total.toFixed(
                            2,
                          )
                        }
                      </p>


                      {order.status.toLowerCase() ===
                        "delivered" && (
                        <Link
                          href={`/product/${item.slug}#reviews`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#d0d5dd] bg-white px-3 text-[8px] font-semibold text-[#344054] transition hover:border-[#e31b2d] hover:text-[#e31b2d]"
                        >
                          <Star className="h-3 w-3" />

                          Review product
                        </Link>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>


          {/* ==================================================
              SUMMARY
          ================================================== */}

          <aside className="space-y-6">
            <section className="rounded-[16px] border border-[#dfe3e8] bg-white p-6">
              <h2 className="text-[16px] font-bold">
                Order summary
              </h2>


              <div className="mt-6 space-y-5">
                <SummaryRow
                  label="Subtotal"
                  value={`$${order.subtotal.toFixed(
                    2,
                  )}`}
                />


                <SummaryRow
                  label="Delivery"
                  value={`$${order.delivery_fee.toFixed(
                    2,
                  )}`}
                />


                <SummaryRow
                  label="Discount"
                  value={
                    order.discount >
                    0
                      ? `-$${order.discount.toFixed(
                          2,
                        )}`
                      : "$0.00"
                  }
                />
              </div>


              <div className="mt-6 flex items-end justify-between border-t border-[#e4e7ec] pt-5">
                <span className="text-[11px] font-bold">
                  Total
                </span>


                <span className="text-[23px] font-bold tracking-[-0.04em]">
                  $
                  {
                    order.total.toFixed(
                      2,
                    )
                  }
                </span>
              </div>
            </section>


            {/* ================================================
                DELIVERY
            ================================================ */}

            <section className="rounded-[16px] border border-[#dfe3e8] bg-white p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f2f4f7] text-[#667085]">
                  <MapPin className="h-4 w-4" />
                </span>


                <div>
                  <p className="text-[10px] font-bold">
                    Shipping address
                  </p>


                  <p className="mt-2 whitespace-pre-line text-[9px] leading-5 text-[#667085]">
                    {
                      order.shipping_address
                    }
                  </p>
                </div>
              </div>
            </section>


            {/* ================================================
                PAYMENT
            ================================================ */}

            <section className="rounded-[16px] border border-[#dfe3e8] bg-white p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f2f4f7] text-[#667085]">
                  <CreditCard className="h-4 w-4" />
                </span>


                <div>
                  <p className="text-[10px] font-bold">
                    Payment
                  </p>


                  <p className="mt-2 text-[9px] text-[#667085]">
                    Cash on delivery
                  </p>


                  <span className="mt-3 inline-flex rounded-full bg-[#fff5d6] px-2.5 py-1 text-[8px] font-semibold capitalize text-[#a15c00]">
                    {
                      order.payment_status
                    }
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}


/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-[9px] text-[#667085]">
        {
          label
        }
      </span>


      <span className="text-[10px] font-semibold">
        {
          value
        }
      </span>
    </div>
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
      className={`inline-flex self-start rounded-full px-3 py-1.5 text-[8px] font-semibold ${classes}`}
    >
      {
        label
      }
    </span>
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

      hour:
        "numeric",

      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function OrderNavbar({
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
            aria-label={`Cart with ${cartCount} items`}
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


          <Link
            href="/account"
            aria-label="Account"
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
