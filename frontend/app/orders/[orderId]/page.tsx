"use client";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

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
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  CircleGauge,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
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


  const reduceMotion =
    useReducedMotion();


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
    <main className="min-h-screen overflow-x-hidden bg-[#f2f4f7] text-[#101828]">
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


      {/* ====================================================
          ORDER HERO
      ==================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.26)_1px,transparent_1px)] [background-size:72px_72px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[240px] -top-[250px] h-[720px] w-[720px] rounded-full bg-[#e31b2d]/15 blur-[130px]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-[350px] left-[8%] h-[650px] w-[800px] rounded-full bg-[#377eb8]/10 blur-[150px]"
        />


        <div className="relative mx-auto max-w-[1480px] px-4 pb-12 pt-9 sm:px-6 lg:px-8 lg:pb-16">
          <Link
            href="/orders"
            className="group inline-flex items-center gap-2 text-[8px] font-bold text-[#8599a9] transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />

            Back to orders
          </Link>


          <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-end">
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      x:
                        -32,
                    }
              }
              animate={{
                x:
                  0,
              }}
              transition={{
                duration:
                  0.65,
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3.5 py-2 backdrop-blur">
                  <PackageCheck className="h-3.5 w-3.5 text-[#ff4b5a]" />

                  <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[#cad5dd]">
                    ORDER DETAIL
                  </span>
                </div>


                <OrderStatusBadge
                  status={
                    order.status
                  }
                  dark
                />
              </div>


              <p className="mt-7 text-[9px] font-black uppercase tracking-[0.15em] text-[#718798]">
                ORDER NUMBER
              </p>


              <h1 className="mt-2 text-[46px] font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-[62px]">
                #
                {
                  order.order_number
                }
              </h1>


              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[9px] font-semibold text-[#9aadb9]">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />

                  {formatOrderDate(
                    order.created_at,
                  )}
                </span>


                <span className="inline-flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" />

                  {itemCount}{" "}
                  {
                    itemCount ===
                    1
                      ? "item"
                      : "items"
                  }
                </span>


                {order.vehicle_id && (
                  <span className="inline-flex items-center gap-2">
                    <CarFront className="h-3.5 w-3.5" />

                    Vehicle-linked order
                  </span>
                )}
              </div>
            </motion.div>


            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      x:
                        35,

                      scale:
                        0.98,
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
                  0.68,
              }}
              className="rounded-[20px] border border-white/[0.10] bg-white/[0.055] p-6 backdrop-blur-xl"
            >
              <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#718798]">
                ORDER TOTAL
              </p>

              <p className="mt-2 text-[42px] font-black tracking-[-0.055em] text-white">
                $
                {order.total.toFixed(
                  2,
                )}
              </p>


              <div className="mt-5 grid grid-cols-2 gap-2">
                <DarkOrderMetric
                  label="Payment"
                  value={
                    formatPaymentMethod(
                      order.payment_method,
                    )
                  }
                />

                <DarkOrderMetric
                  label="Payment status"
                  value={
                    formatStatusLabel(
                      order.payment_status,
                    )
                  }
                />
              </div>
            </motion.div>
          </div>


          <div className="mt-10">
            <OrderJourney
              status={
                order.status
              }
            />
          </div>
        </div>
      </section>


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* ==================================================
              ITEMS
          ================================================== */}

          <div className="space-y-7">
            <section className="overflow-hidden rounded-[20px] border border-[#dce2e7] bg-white shadow-[0_12px_40px_rgba(15,23,42,.045)]">
              <div className="flex items-center justify-between gap-5 border-b border-[#edf0f2] px-6 py-5">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#e31b2d]">
                    PURCHASED PARTS
                  </p>

                  <h2 className="mt-1 text-[16px] font-black text-[#101828]">
                    Order items
                  </h2>
                </div>

                <span className="text-[8px] font-bold text-[#98a2b3]">
                  {
                    itemCount
                  }{" "}
                  {
                    itemCount ===
                    1
                      ? "item"
                      : "items"
                  }
                </span>
              </div>


              <div className="divide-y divide-[#edf0f2]">
                {order.items.map(
                  (
                    item,
                  ) => (
                    <motion.article
                      key={
                        item.product_id
                      }
                      whileHover={
                        reduceMotion
                          ? undefined
                          : {
                              x:
                                4,
                            }
                      }
                      className="grid gap-5 p-6 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <Link
                        href={`/product/${item.slug}`}
                        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[12px] border border-[#e7ebee] bg-[#f6f8fa]"
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
                          <Package className="h-8 w-8 text-[#c0c8d0]" />
                        )}
                      </Link>


                      <div className="min-w-0">
                        <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#98a2b3]">
                          SKU{" "}
                          {
                            item.sku
                          }
                        </p>

                        <Link
                          href={`/product/${item.slug}`}
                          className="mt-1 block text-[14px] font-black leading-5 tracking-[-0.02em] text-[#101828] transition hover:text-[#e31b2d]"
                        >
                          {
                            item.name
                          }
                        </Link>


                        <div className="mt-3 flex flex-wrap gap-3 text-[8px] font-semibold text-[#667085]">
                          <span>
                            Qty{" "}
                            {
                              item.quantity
                            }
                          </span>

                          <span>
                            ?
                          </span>

                          <span>
                            $
                            {item.unit_price.toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      </div>


                      <div className="sm:text-right">
                        <p className="text-[16px] font-black text-[#101828]">
                          $
                          {item.line_total.toFixed(
                            2,
                          )}
                        </p>


                        {order.status.toLowerCase() ===
                          "delivered" && (
                          <Link
                            href={`/product/${item.slug}#reviews`}
                            className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#d7dde3] bg-white px-3 text-[7px] font-black text-[#475467] transition hover:border-[#e31b2d]/40 hover:text-[#e31b2d]"
                          >
                            <Star className="h-3.5 w-3.5" />

                            Review product
                          </Link>
                        )}
                      </div>
                    </motion.article>
                  ),
                )}
              </div>
            </section>


            {/* DELIVERY + PAYMENT */}

            <div className="grid gap-5 lg:grid-cols-2">
              <InfoPanel
                icon={
                  MapPin
                }
                eyebrow="DELIVERY"
                title="Shipping address"
              >
                <p className="whitespace-pre-line text-[9px] leading-5 text-[#667085]">
                  {
                    order.shipping_address
                  }
                </p>
              </InfoPanel>


              <InfoPanel
                icon={
                  CreditCard
                }
                eyebrow="PAYMENT"
                title={
                  formatPaymentMethod(
                    order.payment_method,
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-[#667085]">
                    Status
                  </span>

                  <span className="rounded-full border border-[#ead9ad] bg-[#fffaeb] px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.06em] text-[#9b6b11]">
                    {formatStatusLabel(
                      order.payment_status,
                    )}
                  </span>
                </div>
              </InfoPanel>
            </div>


            {/* CONTEXT */}

            <div className="relative overflow-hidden rounded-[18px] bg-[#071b2d] p-7 text-white">
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#e31b2d]/15 blur-[70px]"
              />


              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#ff5966]">
                    CONTINUE YOUR JOURNEY
                  </p>

                  <h3 className="mt-2 text-[22px] font-black tracking-[-0.035em]">
                    Need another part?
                  </h3>

                  <p className="mt-2 max-w-[560px] text-[8px] leading-4 text-[#9fb0bd]">
                    Return to the marketplace or
                    use My Garage to keep vehicle
                    context attached to your search.
                  </p>
                </div>


                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/shop"
                    className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-4 text-[7px] font-black text-white"
                  >
                    Shop parts

                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <Link
                    href="/account/garage"
                    className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-white/[0.12] bg-white/[0.05] px-4 text-[7px] font-black text-white"
                  >
                    <CarFront className="h-3.5 w-3.5" />

                    My Garage
                  </Link>
                </div>
              </div>
            </div>
          </div>


          {/* ==================================================
              SUMMARY
          ================================================== */}

          <aside className="self-start space-y-5 xl:sticky xl:top-[88px]">
            <section className="overflow-hidden rounded-[20px] border border-[#dce2e7] bg-white shadow-[0_14px_44px_rgba(15,23,42,.055)]">
              <div className="bg-[#071b2d] p-5 text-white">
                <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#718798]">
                  PAYMENT SUMMARY
                </p>

                <h2 className="mt-1 text-[16px] font-black">
                  Order total
                </h2>
              </div>


              <div className="p-5">
                <div className="space-y-4">
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


                <div className="mt-6 flex items-end justify-between border-t border-[#e7ebef] pt-5">
                  <span className="text-[9px] font-black text-[#667085]">
                    Total
                  </span>

                  <span className="text-[28px] font-black tracking-[-0.045em] text-[#101828]">
                    $
                    {order.total.toFixed(
                      2,
                    )}
                  </span>
                </div>
              </div>
            </section>


            <OrderSummarySignal
              icon={
                ShieldCheck
              }
              label="Order status"
              value={
                formatStatusLabel(
                  order.status,
                )
              }
            />

            <OrderSummarySignal
              icon={
                CreditCard
              }
              label="Payment"
              value={
                formatStatusLabel(
                  order.payment_status,
                )
              }
            />

            <OrderSummarySignal
              icon={
                CarFront
              }
              label="Vehicle context"
              value={
                order.vehicle_id
                  ? "Linked to vehicle"
                  : "No vehicle linked"
              }
            />
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
      <span className="text-[8px] font-semibold text-[#667085]">
        {
          label
        }
      </span>

      <span className="text-[9px] font-black text-[#344054]">
        {
          value
        }
      </span>
    </div>
  );
}


/* ============================================================
   ORDER JOURNEY
============================================================ */

function OrderJourney({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    status.toLowerCase();


  const cancelled =
    normalized ===
    "cancelled";


  const currentStep =
    normalized ===
      "delivered"
      ? 3
      : normalized ===
          "shipped"
        ? 2
        : normalized ===
            "processing"
          ? 1
          : 0;


  const steps =
    [
      {
        label:
          "Placed",

        icon:
          PackageCheck,
      },
      {
        label:
          "Processing",

        icon:
          CircleGauge,
      },
      {
        label:
          "Shipped",

        icon:
          Truck,
      },
      {
        label:
          "Delivered",

        icon:
          CheckCircle2,
      },
    ];


  if (
    cancelled
  ) {
    return (
      <div className="rounded-[15px] border border-[#ff7480]/20 bg-[#e31b2d]/10 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e31b2d] text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#ff8b94]">
              ORDER JOURNEY
            </p>

            <p className="mt-1 text-[10px] font-black text-white">
              This order was cancelled.
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="rounded-[16px] border border-white/[0.09] bg-white/[0.045] p-5 backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-4">
        {steps.map(
          (
            step,
            index,
          ) => {
            const Icon =
              step.icon;


            const complete =
              index <=
              currentStep;


            return (
              <div
                key={
                  step.label
                }
                className="relative"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      complete
                        ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#61d49a]/10 text-[#70dca5]"
                        : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-white/[0.09] text-[#657b8c]"
                    }
                  >
                    {complete ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </span>


                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.08em] text-[#718798]">
                      STEP{" "}
                      {
                        index +
                        1
                      }
                    </p>

                    <p
                      className={
                        complete
                          ? "mt-1 text-[9px] font-black text-white"
                          : "mt-1 text-[9px] font-bold text-[#718798]"
                      }
                    >
                      {
                        step.label
                      }
                    </p>
                  </div>
                </div>


                {index <
                  steps.length -
                    1 && (
                  <span
                    aria-hidden="true"
                    className={
                      index <
                      currentStep
                        ? "absolute left-[18px] top-[43px] h-4 w-px bg-[#61d49a]/40 sm:left-[calc(100%-4px)] sm:top-[18px] sm:h-px sm:w-8"
                        : "absolute left-[18px] top-[43px] h-4 w-px bg-white/[0.08] sm:left-[calc(100%-4px)] sm:top-[18px] sm:h-px sm:w-8"
                    }
                  />
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}


/* ============================================================
   INFO PANEL
============================================================ */

function InfoPanel({
  icon:
    Icon,
  eyebrow,
  title,
  children,
}: {
  icon:
    typeof MapPin;

  eyebrow:
    string;

  title:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-[17px] border border-[#dce2e7] bg-white p-5 shadow-[0_10px_32px_rgba(15,23,42,.035)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#f3f5f7] text-[#596b7a]">
          <Icon className="h-4 w-4" />
        </span>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#e31b2d]">
            {
              eyebrow
            }
          </p>

          <h3 className="mt-1 text-[11px] font-black text-[#101828]">
            {
              title
            }
          </h3>
        </div>
      </div>


      <div className="mt-5">
        {
          children
        }
      </div>
    </section>
  );
}


/* ============================================================
   SUMMARY SIGNAL
============================================================ */

function OrderSummarySignal({
  icon:
    Icon,
  label,
  value,
}: {
  icon:
    typeof ShieldCheck;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#dce2e7] bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,.03)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#f4f6f8] text-[#596b7a]">
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#98a2b3]">
          {
            label
          }
        </p>

        <p className="mt-1 truncate text-[9px] font-black text-[#344054]">
          {
            value
          }
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   DARK METRIC
============================================================ */

function DarkOrderMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[9px] border border-white/[0.07] bg-black/10 p-3">
      <p className="text-[6px] font-black uppercase tracking-[0.11em] text-[#657b8c]">
        {
          label
        }
      </p>

      <p className="mt-1 truncate text-[8px] font-bold text-[#dbe4eb]">
        {
          value
        }
      </p>
    </div>
  );
}


/* ============================================================
   STATUS
============================================================ */

function OrderStatusBadge({
  status,
  dark =
    false,
}: {
  status:
    string;

  dark?:
    boolean;
}) {
  const normalized =
    status.toLowerCase();


  if (
    dark
  ) {
    if (
      normalized ===
      "delivered"
    ) {
      return (
        <span className="inline-flex rounded-full border border-[#66d49b]/20 bg-[#66d49b]/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.08em] text-[#75dfaa]">
          Delivered
        </span>
      );
    }


    if (
      normalized ===
      "cancelled"
    ) {
      return (
        <span className="inline-flex rounded-full border border-[#ff6673]/20 bg-[#e31b2d]/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.08em] text-[#ff7b86]">
          Cancelled
        </span>
      );
    }


    return (
      <span className="inline-flex rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.08em] text-[#c8d3dc]">
        {formatStatusLabel(
          status,
        )}
      </span>
    );
  }


  let classes =
    "border-[#dce2e7] bg-[#f4f6f8] text-[#667085]";


  if (
    normalized ===
    "processing"
  ) {
    classes =
      "border-[#ead9ad] bg-[#fffaeb] text-[#9b6b11]";
  }


  if (
    normalized ===
    "shipped"
  ) {
    classes =
      "border-[#c7dcf0] bg-[#eff6fc] text-[#346aa5]";
  }


  if (
    normalized ===
    "delivered"
  ) {
    classes =
      "border-[#b7e4c8] bg-[#ecfdf3] text-[#16804a]";
  }


  if (
    normalized ===
    "cancelled"
  ) {
    classes =
      "border-[#f3c4c8] bg-[#fff1f2] text-[#c92a37]";
  }


  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.07em] ${classes}`}
    >
      {formatStatusLabel(
        status,
      )}
    </span>
  );
}


/* ============================================================
   DATE / FORMAT
============================================================ */

function formatOrderDate(
  value:
    string,
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
        "numeric",

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


function formatPaymentMethod(
  value:
    string,
) {
  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}


function formatStatusLabel(
  value:
    string,
) {
  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
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
          className="flex shrink-0 items-center gap-2.5"
        >
          <VehnexaMark />

          <span className="text-[14px] font-black tracking-[-0.025em] text-white">
            Vehnexa
          </span>
        </Link>


        <nav className="ml-8 hidden h-full items-center gap-8 lg:flex">
          <OrderTopNavLink
            href="/shop"
            label="Shop"
          />

          <OrderTopNavLink
            href="/account/garage"
            label="My Garage"
          />

          <OrderTopNavLink
            href="/ai-mechanic"
            label="AI Mechanic"
          />

          <OrderTopNavLink
            href="/orders"
            label="Orders"
            active
          />
        </nav>


        <form
          onSubmit={
            submitSearch
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
          aria-label={`Cart with ${cartCount} items`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
        >
          <ShoppingCart className="h-[16px] w-[16px]" />

          {cartCount >
            0 && (
            <span className="absolute right-0 top-0 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[7px] font-black text-white">
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
          title="Account"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
        >
          <UserRound className="h-[16px] w-[16px]" />
        </Link>


        <CustomerLogoutButton />
      </div>
    </motion.header>
  );
}


function OrderTopNavLink({
  href,
  label,
  active =
    false,
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
   MARK
============================================================ */

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
