"use client";

import { CustomerNavbarBrand, CustomerNavbarLinks, CustomerNavbarCart } from "@/components/customer/CustomerNavbarParts";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";

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
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Heart,
  LayoutDashboard,
  MapPin,
  Package,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
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


  const reduceMotion =
    useReducedMotion();


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


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState(
      "all",
    );


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


  const normalizedOrders =
    [
      ...orders,
    ].sort(
      (
        a,
        b,
      ) =>
        new Date(
          b.created_at,
        ).getTime() -
        new Date(
          a.created_at,
        ).getTime(),
    );


  const filteredOrders =
    statusFilter ===
      "all"
      ? normalizedOrders
      : normalizedOrders.filter(
          (
            order,
          ) =>
            order.status.toLowerCase() ===
            statusFilter,
        );


  const deliveredCount =
    orders.filter(
      (
        order,
      ) =>
        order.status.toLowerCase() ===
        "delivered",
    ).length;


  const activeCount =
    orders.filter(
      (
        order,
      ) =>
        ![
          "delivered",
          "cancelled",
        ].includes(
          order.status.toLowerCase(),
        ),
    ).length;


  const totalOrderValue =
    orders.reduce(
      (
        total,
        order,
      ) =>
        total +
        order.total,
      0,
    );


  const statusOptions =
    [
      "all",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f4f7] text-[#101828]">
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


      {/* ====================================================
          ORDERS HERO
      ==================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.26)_1px,transparent_1px)] [background-size:72px_72px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[250px] -top-[280px] h-[760px] w-[760px] rounded-full bg-[#e31b2d]/15 blur-[130px]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-[340px] left-[10%] h-[650px] w-[800px] rounded-full bg-[#377eb8]/10 blur-[150px]"
        />


        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [
                    -90,
                    80,
                    -90,
                  ],

                  opacity: [
                    0.15,
                    0.48,
                    0.15,
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
          className="absolute bottom-[12%] left-[5%] h-[3px] w-[58%] rotate-[-7deg] bg-gradient-to-r from-transparent via-[#e31b2d]/60 to-transparent blur-[2px]"
        />


        <div className="relative mx-auto max-w-[1480px] px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-18 lg:pt-16">
          <div className="grid gap-12 xl:grid-cols-[minmax(0,0.92fr)_minmax(500px,1.08fr)] xl:items-center">
            <motion.div
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
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3.5 py-2 backdrop-blur">
                <PackageCheck className="h-3.5 w-3.5 text-[#ff4b5a]" />

                <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[#cad5dd]">
                  PURCHASE JOURNEY
                </span>
              </div>


              <p className="mt-7 text-[10px] font-black uppercase tracking-[0.15em] text-[#718798]">
                {displayName}
              </p>


              <h1 className="mt-2 text-[52px] font-black leading-[0.92] tracking-[-0.06em] sm:text-[68px] lg:text-[78px]">
                Every order.
                <br />

                <span className="text-[#ff394a]">
                  Every move.
                </span>
              </h1>


              <p className="mt-7 max-w-[650px] text-[12px] leading-6 text-[#a8b9c6] sm:text-[13px]">
                Follow every Vehnexa purchase
                from order placement through
                fulfillment, delivery and
                post-purchase product reviews.
              </p>


              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex h-12 items-center gap-2 rounded-[9px] bg-[#e31b2d] px-6 text-[9px] font-black text-white shadow-[0_12px_34px_rgba(227,27,45,.20)] transition hover:bg-[#c91625]"
                >
                  <ShoppingBag className="h-4 w-4" />

                  Continue shopping

                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </Link>


                <Link
                  href="/account"
                  className="inline-flex h-12 items-center gap-2 rounded-[9px] border border-white/[0.13] bg-white/[0.045] px-6 text-[9px] font-black text-white transition hover:bg-white/[0.09]"
                >
                  <LayoutDashboard className="h-4 w-4" />

                  Account overview
                </Link>
              </div>
            </motion.div>


            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      x:
                        45,

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
                  0.08,

                duration:
                  0.75,

                ease:
                  "easeOut",
              }}
              className="relative overflow-hidden rounded-[24px] border border-white/[0.11] bg-white/[0.055] p-6 shadow-[0_34px_90px_rgba(0,0,0,.20)] backdrop-blur-xl sm:p-7"
            >
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 h-[340px] w-[340px] rounded-full border border-white/[0.06]"
              />


              <div className="relative flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.10] bg-black/10 text-[14px] font-black text-white">
                  {
                    initials
                  }
                </span>


                <div className="min-w-0">
                  <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#718798]">
                    ORDER PROFILE
                  </p>

                  <h2 className="mt-1.5 truncate text-[19px] font-black text-white">
                    {
                      displayName
                    }
                  </h2>

                  <p className="mt-1 truncate text-[8px] text-[#8da1b1]">
                    {
                      user?.email
                    }
                  </p>
                </div>


                <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#60ce96]/20 bg-[#60ce96]/10 text-[#6edca4]">
                  <BadgeCheck className="h-4 w-4" />
                </span>
              </div>


              <div className="mt-7 grid grid-cols-2 gap-2">
                <OrdersHeroMetric
                  label="All orders"
                  value={
                    String(
                      orders.length,
                    )
                  }
                />

                <OrdersHeroMetric
                  label="Active"
                  value={
                    String(
                      activeCount,
                    )
                  }
                />

                <OrdersHeroMetric
                  label="Delivered"
                  value={
                    String(
                      deliveredCount,
                    )
                  }
                />

                <OrdersHeroMetric
                  label="Order value"
                  value={
                    formatCurrency(
                      totalOrderValue,
                    )
                  }
                />
              </div>


              <div className="mt-5 rounded-[11px] border border-white/[0.08] bg-black/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#e31b2d]/10 text-[#ff5966]">
                    <Truck className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#6d8293]">
                      CURRENT ACTIVITY
                    </p>

                    <p className="mt-1 text-[9px] font-bold text-[#dbe4eb]">
                      {activeCount >
                      0
                        ? `${activeCount} ${
                            activeCount ===
                            1
                              ? "order is"
                              : "orders are"
                          } still in progress`
                        : "No orders currently in progress"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ====================================================
          METRICS
      ==================================================== */}

      <section className="border-b border-[#e1e6ea] bg-white">
        <div className="mx-auto grid max-w-[1480px] sm:grid-cols-2 xl:grid-cols-4">
          <OrderMetric
            icon={
              Package
            }
            label="Total orders"
            value={
              String(
                orders.length,
              )
            }
            detail="All purchases"
          />

          <OrderMetric
            icon={
              CircleGauge
            }
            label="In progress"
            value={
              String(
                activeCount,
              )
            }
            detail="Open fulfillment"
          />

          <OrderMetric
            icon={
              CheckCircle2
            }
            label="Delivered"
            value={
              String(
                deliveredCount,
              )
            }
            detail="Completed orders"
          />

          <OrderMetric
            icon={
              ShoppingBag
            }
            label="Order value"
            value={
              formatCurrency(
                totalOrderValue,
              )
            }
            detail="Across all orders"
          />
        </div>
      </section>


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {successMessage && (
          <motion.div
            initial={{
              y:
                -10,
            }}
            animate={{
              y:
                0,
            }}
            className="mb-7 flex items-center gap-3 rounded-[12px] border border-[#b7e4c7] bg-[#ecfdf3] px-5 py-4 text-[#087443]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            <p className="text-[9px] font-bold">
              {
                successMessage
              }
            </p>
          </motion.div>
        )}


        {error && (
          <div className="mb-7 rounded-[12px] border border-[#f1c7cc] bg-[#fff4f5] px-5 py-4 text-[9px] text-[#b4232f]">
            {
              error
            }
          </div>
        )}


        <div className="grid gap-7 xl:grid-cols-[230px_minmax(0,1fr)]">
          <OrdersSidebar
            initials={
              initials
            }
            displayName={
              displayName
            }
            email={
              user?.email ??
              ""
            }
          />


          <div className="min-w-0">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
                  ORDER HISTORY
                </p>

                <h2 className="mt-3 text-[36px] font-black tracking-[-0.045em] text-[#101828] sm:text-[46px]">
                  Your purchase timeline.
                </h2>

                <p className="mt-4 max-w-[650px] text-[10px] leading-5 text-[#667085]">
                  Filter your order history by
                  status and open any purchase for
                  its items, delivery information
                  and payment summary.
                </p>
              </div>


              <span className="inline-flex h-10 self-start items-center gap-2 rounded-[8px] border border-[#dce2e7] bg-white px-4 text-[8px] font-bold text-[#596775] shadow-sm lg:self-auto">
                <PackageCheck className="h-3.5 w-3.5 text-[#e31b2d]" />

                {filteredOrders.length} visible
              </span>
            </div>


            {/* FILTERS */}

            <div className="mt-8 overflow-x-auto rounded-[14px] border border-[#dce2e7] bg-white p-2 shadow-[0_8px_28px_rgba(15,23,42,.035)]">
              <div className="flex min-w-max gap-1">
                {statusOptions.map(
                  (
                    status,
                  ) => (
                    <button
                      key={
                        status
                      }
                      type="button"
                      onClick={() =>
                        setStatusFilter(
                          status,
                        )
                      }
                      className={`relative h-10 rounded-[9px] px-4 text-[8px] font-black transition ${
                        statusFilter ===
                        status
                          ? "bg-[#071b2d] text-white"
                          : "text-[#667085] hover:bg-[#f6f8fa] hover:text-[#101828]"
                      }`}
                    >
                      {formatStatusLabel(
                        status,
                      )}

                      {statusFilter ===
                        status && (
                        <motion.span
                          layoutId="orders-filter-active"
                          className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[#e31b2d]"
                        />
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>


            {/* LIST */}

            {loading ? (
              <OrdersLoading />
            ) : filteredOrders.length ===
              0 ? (
              <OrdersEmpty
                filtered={
                  statusFilter !==
                  "all"
                }
              />
            ) : (
              <motion.div
                layout
                className="mt-7 space-y-5"
              >
                <AnimatePresence
                  mode="popLayout"
                >
                  {filteredOrders.map(
                    (
                      order,
                      index,
                    ) => (
                      <OrderCard
                        key={
                          order.id
                        }
                        order={
                          order
                        }
                        index={
                          index
                        }
                      />
                    ),
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   ORDER CARD
============================================================ */

function OrderCard({
  order,
  index,
}: {
  order:
    Order;

  index:
    number;
}) {
  const reduceMotion =
    useReducedMotion();


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
    <motion.article
      layout
      initial={
        reduceMotion
          ? false
          : {
              y:
                24,

              scale:
                0.99,
            }
      }
      animate={{
        y:
          0,

        scale:
          1,
      }}
      exit={{
        scale:
          0.97,

        opacity:
          0,
      }}
      transition={{
        delay:
          reduceMotion
            ? 0
            : Math.min(
                index *
                  0.05,
                0.25,
              ),

        duration:
          0.45,
      }}
      className="group overflow-hidden rounded-[18px] border border-[#dce2e7] bg-white shadow-[0_10px_34px_rgba(15,23,42,.04)] transition hover:border-[#cbd3da] hover:shadow-[0_20px_50px_rgba(15,23,42,.07)]"
    >
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_190px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[15px] font-black tracking-[-0.025em] text-[#101828]">
              #
              {
                order.order_number
              }
            </p>

            <OrderStatusBadge
              status={
                order.status
              }
            />


            {order.vehicle_id && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8e3eb] bg-[#f5f9fc] px-2.5 py-1 text-[6px] font-black text-[#416b91]">
                <CarFront className="h-3 w-3" />

                VEHICLE LINKED
              </span>
            )}
          </div>


          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[8px] text-[#7b8794]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />

              {formatOrderDate(
                order.created_at,
              )}
            </span>

            <span>
              {itemCount}{" "}
              {
                itemCount ===
                1
                  ? "item"
                  : "items"
              }
            </span>

            <span>
              {formatPaymentMethod(
                order.payment_method,
              )}
            </span>
          </div>


          <div className="mt-5 flex items-center gap-2">
            {order.items
              .slice(
                0,
                4,
              )
              .map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item.product_id
                    }
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-[#e6eaee] bg-[#f7f9fa]"
                    title={
                      item.name
                    }
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
                      <Package className="h-5 w-5 text-[#bcc5cd]" />
                    )}
                  </div>
                ),
              )}


            {order.items.length >
              4 && (
              <span className="flex h-12 w-12 items-center justify-center rounded-[9px] border border-[#e6eaee] bg-[#f7f9fa] text-[7px] font-black text-[#667085]">
                +
                {order.items.length -
                  4}
              </span>
            )}
          </div>
        </div>


        <div className="border-t border-[#edf0f2] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#98a2b3]">
            ORDER TOTAL
          </p>

          <p className="mt-1.5 text-[24px] font-black tracking-[-0.045em] text-[#101828]">
            {formatCurrency(
              order.total,
            )}
          </p>


          <Link
            href={`/orders/${order.id}`}
            className="group/link mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#071b2d] text-[8px] font-black text-white transition hover:bg-[#102d43]"
          >
            View order

            <ArrowRight className="h-3.5 w-3.5 transition group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>


      <OrderProgressStrip
        status={
          order.status
        }
      />
    </motion.article>
  );
}


/* ============================================================
   PROGRESS STRIP
============================================================ */

function OrderProgressStrip({
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


  const progress =
    getOrderProgress(
      normalized,
    );


  return (
    <div className="border-t border-[#edf0f2] bg-[#fafbfc] px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#98a2b3]">
          {cancelled
            ? "ORDER CLOSED"
            : "FULFILLMENT PROGRESS"}
        </p>

        <p
          className={
            cancelled
              ? "text-[7px] font-black text-[#c92a37]"
              : "text-[7px] font-black text-[#667085]"
          }
        >
          {cancelled
            ? "Cancelled"
            : `${progress}%`}
        </p>
      </div>


      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7ebee]">
        <motion.div
          animate={{
            width:
              cancelled
                ? "100%"
                : `${progress}%`,
          }}
          transition={{
            duration:
              0.7,
          }}
          className={
            cancelled
              ? "h-full bg-[#d92d20]"
              : "h-full bg-gradient-to-r from-[#e31b2d] to-[#61d49a]"
          }
        />
      </div>
    </div>
  );
}


/* ============================================================
   SIDEBAR
============================================================ */

function OrdersSidebar({
  initials,
  displayName,
  email,
}: {
  initials:
    string;

  displayName:
    string;

  email:
    string;
}) {
  return (
    <aside className="self-start overflow-hidden rounded-[17px] border border-[#dce2e7] bg-white shadow-[0_12px_38px_rgba(15,23,42,.045)] xl:sticky xl:top-[88px]">
      <div className="border-b border-[#edf0f2] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#071b2d] text-[12px] font-black text-white">
            {
              initials
            }
          </span>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-black text-[#101828]">
              {
                displayName
              }
            </p>

            <p className="mt-1 truncate text-[7px] text-[#98a2b3]">
              {
                email
              }
            </p>
          </div>
        </div>
      </div>


      <nav className="space-y-1 p-3">
        <OrdersNavLink
          icon={
            LayoutDashboard
          }
          label="Overview"
          href="/account"
        />

        <OrdersNavLink
          icon={
            Package
          }
          label="Orders"
          href="/orders"
          active
        />

        <OrdersNavLink
          icon={
            CarFront
          }
          label="My Garage"
          href="/account/garage"
        />

        <OrdersNavLink
          icon={
            MapPin
          }
          label="Addresses"
          href="/account/addresses"
        />

        <OrdersNavLink
          icon={
            Heart
          }
          label="Wishlist"
          href="/account/wishlist"
        />

        <OrdersNavLink
          icon={
            Bell
          }
          label="Notifications"
          href="/account/notifications"
        />
      </nav>


      <div className="border-t border-[#edf0f2] p-4">
        <Link
          href="/shop"
          className="group flex h-10 items-center justify-between rounded-[8px] bg-[#f6f8fa] px-3 text-[8px] font-bold text-[#475467] transition hover:bg-[#eef1f4]"
        >
          Continue shopping

          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </aside>
  );
}


function OrdersNavLink({
  icon:
    Icon,
  label,
  href,
  active =
    false,
}: {
  icon:
    LucideIcon;

  label:
    string;

  href:
    string;

  active?:
    boolean;
}) {
  return (
    <Link
      href={
        href
      }
      className={
        active
          ? "flex h-10 items-center gap-3 rounded-[8px] bg-[#fff0f1] px-3 text-[8px] font-black text-[#e31b2d]"
          : "flex h-10 items-center gap-3 rounded-[8px] px-3 text-[8px] font-bold text-[#596775] transition hover:bg-[#f6f8fa] hover:text-[#101828]"
      }
    >
      <Icon className="h-4 w-4" />

      {
        label
      }
    </Link>
  );
}


/* ============================================================
   METRICS
============================================================ */

function OrdersHeroMetric({
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
      <p className="text-[6px] font-black uppercase tracking-[0.11em] text-[#657b8c]">
        {
          label
        }
      </p>

      <p className="mt-1 truncate text-[16px] font-black text-white">
        {
          value
        }
      </p>
    </div>
  );
}


function OrderMetric({
  icon:
    Icon,
  label,
  value,
  detail,
}: {
  icon:
    LucideIcon;

  label:
    string;

  value:
    string;

  detail:
    string;
}) {
  return (
    <div className="group flex items-center gap-4 border-b border-[#edf0f2] px-5 py-6 last:border-b-0 sm:border-r xl:border-b-0 xl:last:border-r-0 lg:px-8">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e0e5e9] bg-[#f5f7f9] text-[#596b7a] transition duration-300 group-hover:border-[#efc8cc] group-hover:bg-[#fff0f1] group-hover:text-[#e31b2d]">
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">
          {
            label
          }
        </p>

        <p className="mt-1 truncate text-[20px] font-black tracking-[-0.035em] text-[#101828]">
          {
            value
          }
        </p>

        <p className="mt-0.5 truncate text-[7px] text-[#98a2b3]">
          {
            detail
          }
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   LOADING / EMPTY
============================================================ */

function OrdersLoading() {
  return (
    <div className="mt-7 space-y-5">
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
            className="h-[190px] animate-pulse rounded-[18px] border border-[#e0e5e9] bg-white"
          />
        ),
      )}
    </div>
  );
}


function OrdersEmpty({
  filtered,
}: {
  filtered:
    boolean;
}) {
  return (
    <div className="mt-7 flex min-h-[430px] items-center justify-center rounded-[20px] border border-[#dce2e7] bg-white px-6 py-12 text-center shadow-[0_10px_34px_rgba(15,23,42,.035)]">
      <div className="max-w-[420px]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#071b2d] text-white">
          <Package className="h-6 w-6" />
        </span>

        <h3 className="mt-5 text-[22px] font-black tracking-[-0.035em] text-[#101828]">
          {filtered
            ? "No orders in this status."
            : "No orders yet."}
        </h3>

        <p className="mt-3 text-[9px] leading-5 text-[#667085]">
          {filtered
            ? "Try another order-status filter to continue browsing your purchase history."
            : "Your Vehnexa purchases will appear here after checkout."}
        </p>

        {!filtered && (
          <Link
            href="/shop"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-5 text-[8px] font-black text-white"
          >
            Browse marketplace

            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
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
      className={`inline-flex rounded-full border px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.07em] ${classes}`}
    >
      {formatStatusLabel(
        status,
      )}
    </span>
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
        <CustomerNavbarBrand />


        <CustomerNavbarLinks />


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


        <CustomerNavbarCart count={cartCount} />


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




/* ============================================================
   HELPERS
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
    },
  ).format(
    date,
  );
}


function formatCurrency(
  value:
    number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD",
    },
  ).format(
    value,
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
  if (
    value ===
    "all"
  ) {
    return "All orders";
  }


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


function getOrderProgress(
  status:
    string,
) {
  if (
    status ===
    "delivered"
  ) {
    return 100;
  }


  if (
    status ===
    "shipped"
  ) {
    return 74;
  }


  if (
    status ===
    "processing"
  ) {
    return 45;
  }


  if (
    status ===
    "cancelled"
  ) {
    return 100;
  }


  return 22;
}
