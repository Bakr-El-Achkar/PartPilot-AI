"use client";

import { CustomerNavbarBrand, CustomerNavbarLinks, CustomerNavbarCart } from "@/components/customer/CustomerNavbarParts";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";

import {
  type ReactNode,
  useCallback,
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
  Check,
  CheckCheck,
  ChevronRight,
  CircleGauge,
  ExternalLink,
  Heart,
  Inbox,
  LayoutDashboard,
  Loader2,
  Mail,
  MailCheck,
  MapPin,
  Megaphone,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
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
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type CustomerNotification,
  type NotificationCategory,
} from "@/lib/notifications";


type ReadFilter =
  | "all"
  | "unread"
  | "read";


type CategoryFilter =
  | "all"
  | NotificationCategory;


/* ============================================================
   CUSTOMER NOTIFICATIONS
============================================================ */

export default function CustomerNotificationsPage() {
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
    notifications,
    setNotifications,
  ] =
    useState<CustomerNotification[]>(
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
    updatingAll,
    setUpdatingAll,
  ] =
    useState(
      false,
    );


  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    readFilter,
    setReadFilter,
  ] =
    useState<ReadFilter>(
      "all",
    );


  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState<CategoryFilter>(
      "all",
    );


  const [
    cartCount,
    setCartCount,
  ] =
    useState(
      0,
    );


  /* ==========================================================
     CART
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


    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCart,
      );
    };
  }, []);


  /* ==========================================================
     LOAD PAGE
  ========================================================== */

  const loadPage =
    useCallback(
      async () => {
        const token =
          getAccessToken();


        if (!token) {
          router.replace(
            "/login",
          );

          return;
        }


        try {
          setLoading(
            true,
          );

          setError(
            "",
          );


          const [
            currentUser,
            result,
          ] =
            await Promise.all([
              getCurrentUser(
                token,
              ),

              getNotifications(
                token,
              ),
            ]);


          setUser(
            currentUser,
          );


          setNotifications(
            result,
          );

        } catch (
          loadError
        ) {
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


          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load notifications.",
          );

        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        router,
      ],
    );


  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadPage();
        },
        0,
      );


    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    loadPage,
  ]);


  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const unreadCount =
    notifications.filter(
      (
        notification,
      ) =>
        !notification.is_read,
    ).length;


  const readCount =
    notifications.length -
    unreadCount;


  const linkedCount =
    notifications.filter(
      (
        notification,
      ) =>
        Boolean(
          notification.link &&
          notification.link.startsWith(
            "/",
          ),
        ),
    ).length;


  const generalCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.category ===
        "general",
    ).length;


  const accountCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.category ===
        "account",
    ).length;


  const promotionCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.category ===
        "promotion",
    ).length;


  const filtered =
    useMemo(
      () =>
        [
          ...notifications,
        ]
          .sort(
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
          )
          .filter(
            (
              notification,
            ) => {
              if (
                readFilter ===
                  "unread" &&
                notification.is_read
              ) {
                return false;
              }


              if (
                readFilter ===
                  "read" &&
                !notification.is_read
              ) {
                return false;
              }


              if (
                categoryFilter !==
                  "all" &&
                notification.category !==
                  categoryFilter
              ) {
                return false;
              }


              return true;
            },
          ),
      [
        notifications,
        readFilter,
        categoryFilter,
      ],
    );


  const latestNotification =
    useMemo(
      () =>
        [
          ...notifications,
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
        )[0] ??
        null,
      [
        notifications,
      ],
    );


  const displayName =
    user
      ? `${user.first_name} ${user.last_name}`.trim() ||
        "Customer"
      : "Customer";


  const initials =
    user
      ? `${user.first_name?.[0] ?? ""}${
          user.last_name?.[0] ?? ""
        }`
          .toUpperCase() ||
        "V"
      : "V";


  /* ==========================================================
     MARK ONE
  ========================================================== */

  async function markOne(
    notification:
      CustomerNotification,
    followLink =
      false,
  ) {
    const token =
      getAccessToken();


    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }


    let current =
      notification;


    try {
      setError(
        "",
      );


      if (
        !notification.is_read
      ) {
        setUpdatingId(
          notification.id,
        );


        current =
          await markNotificationRead(
            token,
            notification.id,
          );


        setNotifications(
          (
            items,
          ) =>
            items.map(
              (
                item,
              ) =>
                item.id ===
                current.id
                  ? current
                  : item,
            ),
        );
      }


      if (
        followLink &&
        current.link &&
        current.link.startsWith(
          "/",
        )
      ) {
        router.push(
          current.link,
        );
      }

    } catch (
      readError
    ) {
      if (
        readError instanceof
          ApiError &&
        (
          readError.status ===
            401 ||
          readError.status ===
            403
        )
      ) {
        removeAccessToken();

        router.replace(
          "/login",
        );

        return;
      }


      setError(
        readError instanceof
          Error
          ? readError.message
          : "Unable to update notification.",
      );

    } finally {
      setUpdatingId(
        null,
      );
    }
  }


  /* ==========================================================
     MARK ALL
  ========================================================== */

  async function markAll() {
    const token =
      getAccessToken();


    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }


    try {
      setUpdatingAll(
        true,
      );

      setError(
        "",
      );


      await markAllNotificationsRead(
        token,
      );


      const now =
        new Date()
          .toISOString();


      setNotifications(
        (
          items,
        ) =>
          items.map(
            (
              item,
            ) => ({
              ...item,

              is_read:
                true,

              read_at:
                item.read_at ??
                now,
            }),
          ),
      );

    } catch (
      readError
    ) {
      if (
        readError instanceof
          ApiError &&
        (
          readError.status ===
            401 ||
          readError.status ===
            403
        )
      ) {
        removeAccessToken();

        router.replace(
          "/login",
        );

        return;
      }


      setError(
        readError instanceof
          Error
          ? readError.message
          : "Unable to update notifications.",
      );

    } finally {
      setUpdatingAll(
        false,
      );
    }
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f4f7] text-[#101828]">
      <NotificationsNavbar
        cartCount={
          cartCount
        }
        bellKey={
          unreadCount
        }
      />


      {/* ======================================================
          HERO
      ====================================================== */}

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
            {/* LEFT */}

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
                <Sparkles className="h-3.5 w-3.5 text-[#ff4b5a]" />

                <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[#cad5dd]">
                  CUSTOMER INBOX
                </span>
              </div>


              <p className="mt-7 text-[10px] font-black uppercase tracking-[0.15em] text-[#718798]">
                {displayName}
              </p>


              <h1 className="mt-2 text-[52px] font-black leading-[0.92] tracking-[-0.06em] sm:text-[68px] lg:text-[78px]">
                Stay informed.
                <br />

                <span className="text-[#ff394a]">
                  Keep moving.
                </span>
              </h1>


              <p className="mt-7 max-w-[650px] text-[12px] leading-6 text-[#a8b9c6] sm:text-[13px]">
                Account messages, system updates
                and Vehnexa promotions live in one
                inbox with persistent read status
                across your customer experience.
              </p>


              <div className="mt-8 flex flex-wrap gap-3">
                {unreadCount >
                  0 && (
                  <motion.button
                    type="button"
                    disabled={
                      updatingAll
                    }
                    onClick={() => {
                      void markAll();
                    }}
                    whileTap={
                      reduceMotion
                        ? undefined
                        : {
                            scale:
                              0.98,
                          }
                    }
                    className="inline-flex h-12 items-center gap-2 rounded-[9px] bg-[#e31b2d] px-6 text-[9px] font-black text-white shadow-[0_12px_34px_rgba(227,27,45,.20)] transition hover:bg-[#c91625] disabled:opacity-60"
                  >
                    {updatingAll ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}

                    {updatingAll
                      ? "Updating inbox..."
                      : "Mark all as read"}
                  </motion.button>
                )}


                <Link
                  href="/account"
                  className="inline-flex h-12 items-center gap-2 rounded-[9px] border border-white/[0.13] bg-white/[0.045] px-6 text-[9px] font-black text-white transition hover:bg-white/[0.09]"
                >
                  <LayoutDashboard className="h-4 w-4" />

                  Account overview
                </Link>
              </div>
            </motion.div>


            {/* INBOX STATUS */}

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
                    INBOX STATUS
                  </p>

                  <h2 className="mt-1.5 text-[19px] font-black text-white">
                    {unreadCount >
                    0
                      ? `${unreadCount} ${
                          unreadCount ===
                          1
                            ? "message needs"
                            : "messages need"
                        } attention`
                      : "You are all caught up"}
                  </h2>

                  <p className="mt-1 text-[8px] text-[#8da1b1]">
                    {
                      user?.email
                    }
                  </p>
                </div>


                <motion.span
                  animate={
                    unreadCount >
                      0 &&
                    !reduceMotion
                      ? {
                          scale: [
                            1,
                            1.08,
                            1,
                          ],
                        }
                      : undefined
                  }
                  transition={{
                    duration:
                      2.5,

                    repeat:
                      Infinity,
                  }}
                  className={
                    unreadCount >
                    0
                      ? "ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#ff5966]/20 bg-[#e31b2d]/10 text-[#ff6673]"
                      : "ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#60ce96]/20 bg-[#60ce96]/10 text-[#6edca4]"
                  }
                >
                  {unreadCount >
                  0 ? (
                    <Mail className="h-4.5 w-4.5" />
                  ) : (
                    <MailCheck className="h-4.5 w-4.5" />
                  )}
                </motion.span>
              </div>


              <div className="mt-7 grid grid-cols-2 gap-2">
                <HeroMetric
                  label="Total"
                  value={
                    String(
                      notifications.length,
                    )
                  }
                />

                <HeroMetric
                  label="Unread"
                  value={
                    String(
                      unreadCount,
                    )
                  }
                />

                <HeroMetric
                  label="Read"
                  value={
                    String(
                      readCount,
                    )
                  }
                />

                <HeroMetric
                  label="Linked"
                  value={
                    String(
                      linkedCount,
                    )
                  }
                />
              </div>


              <div className="mt-5 rounded-[12px] border border-white/[0.08] bg-black/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#e31b2d]/10 text-[#ff5966]">
                    <Bell className="h-4 w-4" />
                  </span>


                  <div className="min-w-0">
                    <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#6d8293]">
                      LATEST MESSAGE
                    </p>

                    <p className="mt-1 line-clamp-1 text-[9px] font-bold text-[#dbe4eb]">
                      {latestNotification
                        ? latestNotification.title
                        : "No notifications yet"}
                    </p>

                    {latestNotification && (
                      <p className="mt-1 text-[7px] text-[#718798]">
                        {formatDateTime(
                          latestNotification.created_at,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ======================================================
          METRICS STRIP
      ====================================================== */}

      <section className="border-b border-[#e1e6ea] bg-white">
        <div className="mx-auto grid max-w-[1480px] sm:grid-cols-2 xl:grid-cols-4">
          <NotificationMetric
            icon={
              Bell
            }
            label="All messages"
            value={
              notifications.length
            }
            detail="Current inbox"
          />

          <NotificationMetric
            icon={
              Mail
            }
            label="Unread"
            value={
              unreadCount
            }
            detail="Needs attention"
          />

          <NotificationMetric
            icon={
              ShieldCheck
            }
            label="Account"
            value={
              accountCount
            }
            detail="Account updates"
          />

          <NotificationMetric
            icon={
              Megaphone
            }
            label="Promotions"
            value={
              promotionCount
            }
            detail="Vehnexa offers"
          />
        </div>
      </section>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {error && (
          <motion.div
            initial={{
              y:
                -8,
            }}
            animate={{
              y:
                0,
            }}
            className="mb-7 rounded-[12px] border border-[#f1c7cc] bg-[#fff4f5] px-5 py-4 text-[9px] text-[#b4232f]"
          >
            {
              error
            }
          </motion.div>
        )}


        <div className="grid gap-7 xl:grid-cols-[230px_minmax(0,1fr)]">
          <NotificationsSidebar
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
            {/* HEADING */}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
                  NOTIFICATION CENTER
                </p>

                <h2 className="mt-3 text-[36px] font-black tracking-[-0.045em] text-[#101828] sm:text-[46px]">
                  Your Vehnexa inbox.
                </h2>

                <p className="mt-4 max-w-[680px] text-[10px] leading-5 text-[#667085]">
                  Filter by read state or message
                  type, open linked experiences
                  directly, and keep your account
                  inbox organized.
                </p>
              </div>


              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() => {
                    void loadPage();
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d6dce2] bg-white px-4 text-[8px] font-bold text-[#475467] transition hover:bg-[#fafbfc] disabled:opacity-50"
                >
                  {loading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}

                  Refresh
                </button>


                {unreadCount >
                  0 && (
                  <button
                    type="button"
                    disabled={
                      updatingAll
                    }
                    onClick={() => {
                      void markAll();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#071b2d] px-4 text-[8px] font-black text-white transition hover:bg-[#102d43] disabled:opacity-50"
                  >
                    {updatingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}

                    Mark all read
                  </button>
                )}
              </div>
            </div>


            {/* ==================================================
                CATEGORY EXPLORER
            ================================================== */}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <CategoryFilterCard
                category="general"
                label="General"
                description="General Vehnexa messages"
                count={
                  generalCount
                }
                active={
                  categoryFilter ===
                  "general"
                }
                icon={
                  Bell
                }
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter ===
                      "general"
                      ? "all"
                      : "general",
                  )
                }
              />


              <CategoryFilterCard
                category="account"
                label="Account"
                description="Customer and account updates"
                count={
                  accountCount
                }
                active={
                  categoryFilter ===
                  "account"
                }
                icon={
                  ShieldCheck
                }
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter ===
                      "account"
                      ? "all"
                      : "account",
                  )
                }
              />


              <CategoryFilterCard
                category="promotion"
                label="Promotions"
                description="Offers from Vehnexa"
                count={
                  promotionCount
                }
                active={
                  categoryFilter ===
                  "promotion"
                }
                icon={
                  Megaphone
                }
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter ===
                      "promotion"
                      ? "all"
                      : "promotion",
                  )
                }
              />
            </div>


            {/* ==================================================
                FILTER BAR
            ================================================== */}

            <div className="mt-6 rounded-[15px] border border-[#dce2e7] bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,.035)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex overflow-x-auto rounded-[10px] bg-[#f3f5f7] p-1.5">
                  {(
                    [
                      "all",
                      "unread",
                      "read",
                    ] as ReadFilter[]
                  ).map(
                    (
                      value,
                    ) => (
                      <button
                        key={
                          value
                        }
                        type="button"
                        onClick={() =>
                          setReadFilter(
                            value,
                          )
                        }
                        className={`relative h-9 shrink-0 rounded-[8px] px-4 text-[8px] font-black transition ${
                          readFilter ===
                          value
                            ? "bg-white text-[#101828] shadow-[0_4px_14px_rgba(15,23,42,.08)]"
                            : "text-[#667085] hover:text-[#101828]"
                        }`}
                      >
                        {value ===
                        "all"
                          ? "All messages"
                          : value ===
                              "unread"
                            ? `Unread (${unreadCount})`
                            : `Read (${readCount})`}


                        {readFilter ===
                          value && (
                          <motion.span
                            layoutId="notification-read-filter"
                            className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[#e31b2d]"
                          />
                        )}
                      </button>
                    ),
                  )}
                </div>


                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-black uppercase tracking-[0.10em] text-[#98a2b3]">
                    CATEGORY
                  </span>

                  <div className="relative">
                    <select
                      value={
                        categoryFilter
                      }
                      onChange={(
                        event,
                      ) =>
                        setCategoryFilter(
                          event.target
                            .value as
                            CategoryFilter,
                        )
                      }
                      className="h-9 appearance-none rounded-[8px] border border-[#d6dce2] bg-white pl-3 pr-8 text-[8px] font-bold text-[#475467] outline-none"
                    >
                      <option value="all">
                        All categories
                      </option>

                      <option value="general">
                        General
                      </option>

                      <option value="account">
                        Account
                      </option>

                      <option value="promotion">
                        Promotion
                      </option>
                    </select>

                    <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-[#98a2b3]" />
                  </div>
                </div>
              </div>


              <div className="mt-3 flex items-center justify-between border-t border-[#edf0f2] pt-3">
                <p className="text-[7px] font-semibold text-[#98a2b3]">
                  Showing{" "}
                  <span className="font-black text-[#475467]">
                    {
                      filtered.length
                    }
                  </span>{" "}
                  {
                    filtered.length ===
                    1
                      ? "notification"
                      : "notifications"
                  }
                </p>


                {(readFilter !==
                  "all" ||
                  categoryFilter !==
                    "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setReadFilter(
                        "all",
                      );

                      setCategoryFilter(
                        "all",
                      );
                    }}
                    className="text-[7px] font-black text-[#e31b2d]"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>


            {/* ==================================================
                INBOX
            ================================================== */}

            <section className="mt-6 overflow-hidden rounded-[20px] border border-[#dce2e7] bg-white shadow-[0_12px_40px_rgba(15,23,42,.045)]">
              <div className="flex items-center justify-between gap-5 border-b border-[#edf0f2] px-5 py-5 sm:px-6">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#e31b2d]">
                    MESSAGE TIMELINE
                  </p>

                  <h3 className="mt-1 text-[15px] font-black text-[#101828]">
                    Notifications
                  </h3>
                </div>


                <span
                  className={
                    unreadCount >
                    0
                      ? "inline-flex items-center gap-1.5 rounded-full border border-[#f1c4c8] bg-[#fff1f2] px-3 py-1.5 text-[7px] font-black text-[#c92a37]"
                      : "inline-flex items-center gap-1.5 rounded-full border border-[#b9e4ca] bg-[#ecfdf3] px-3 py-1.5 text-[7px] font-black text-[#16804a]"
                  }
                >
                  {unreadCount >
                  0 ? (
                    <Mail className="h-3 w-3" />
                  ) : (
                    <MailCheck className="h-3 w-3" />
                  )}

                  {unreadCount >
                  0
                    ? `${unreadCount} UNREAD`
                    : "ALL READ"}
                </span>
              </div>


              {loading &&
              notifications.length ===
                0 ? (
                <NotificationsLoading />
              ) : filtered.length ===
                0 ? (
                <EmptyInbox
                  hasNotifications={
                    notifications.length >
                    0
                  }
                  filtered={
                    readFilter !==
                      "all" ||
                    categoryFilter !==
                      "all"
                  }
                />
              ) : (
                <motion.div
                  layout
                  className="relative"
                >
                  <div
                    aria-hidden="true"
                    className="absolute bottom-8 left-[39px] top-8 hidden w-px bg-[#edf0f2] sm:block"
                  />


                  <AnimatePresence
                    mode="popLayout"
                  >
                    {filtered.map(
                      (
                        notification,
                        index,
                      ) => (
                        <NotificationCard
                          key={
                            notification.id
                          }
                          notification={
                            notification
                          }
                          index={
                            index
                          }
                          updating={
                            updatingId ===
                            notification.id
                          }
                          onMarkRead={
                            markOne
                          }
                          onOpen={
                            (
                              item,
                            ) =>
                              markOne(
                                item,
                                true,
                              )
                          }
                        />
                      ),
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>


            {/* ==================================================
                FOOTER CTA
            ================================================== */}

            <div className="relative mt-8 overflow-hidden rounded-[20px] bg-[#071b2d] p-7 text-white shadow-[0_24px_70px_rgba(7,27,45,.14)] sm:p-9">
              <div
                aria-hidden="true"
                className="absolute -right-[110px] -top-[160px] h-[420px] w-[420px] rounded-full bg-[#e31b2d]/15 blur-[100px]"
              />


              <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.15em] text-[#ff5b68]">
                    VEHICLE + MARKETPLACE + ACCOUNT
                  </p>

                  <h3 className="mt-2 text-[27px] font-black tracking-[-0.04em] sm:text-[34px]">
                    Notifications connect the experience.
                  </h3>

                  <p className="mt-3 max-w-[650px] text-[9px] leading-5 text-[#9fb0bd]">
                    Internal notification links can
                    move you directly into the
                    relevant Vehnexa customer
                    experience while preserving
                    your inbox read state.
                  </p>
                </div>


                <Link
                  href="/account"
                  className="group inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-[8px] bg-[#e31b2d] px-5 text-[8px] font-black text-white transition hover:bg-[#c91625] lg:self-auto"
                >
                  Account overview

                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


/* ============================================================
   NOTIFICATION CARD
============================================================ */

function NotificationCard({
  notification,
  index,
  updating,
  onMarkRead,
  onOpen,
}: {
  notification:
    CustomerNotification;

  index:
    number;

  updating:
    boolean;

  onMarkRead: (
    notification:
      CustomerNotification,
  ) => Promise<void>;

  onOpen: (
    notification:
      CustomerNotification,
  ) => Promise<void>;
}) {
  const reduceMotion =
    useReducedMotion();


  const hasInternalLink =
    Boolean(
      notification.link &&
      notification.link.startsWith(
        "/",
      ),
    );


  return (
    <motion.article
      layout
      initial={
        reduceMotion
          ? false
          : {
              y:
                20,

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
      exit={{
        scale:
          0.98,

        opacity:
          0,
      }}
      transition={{
        delay:
          reduceMotion
            ? 0
            : Math.min(
                index *
                  0.035,
                0.22,
              ),

        duration:
          0.4,
      }}
      className={
        notification.is_read
          ? "relative border-b border-[#edf0f2] bg-white p-5 last:border-b-0 sm:pl-6 sm:pr-6"
          : "relative border-b border-[#edf0f2] bg-[linear-gradient(90deg,#fff5f6_0%,#ffffff_28%)] p-5 last:border-b-0 sm:pl-6 sm:pr-6"
      }
    >
      {!notification.is_read && (
        <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#e31b2d]" />
      )}


      <div className="flex gap-4">
        <div className="relative z-10 hidden sm:block">
          <CategoryIcon
            category={
              notification.category
            }
            unread={
              !notification.is_read
            }
          />
        </div>


        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="sm:hidden">
                  <CategoryIcon
                    category={
                      notification.category
                    }
                    unread={
                      !notification.is_read
                    }
                  />
                </div>


                <h4
                  className={
                    notification.is_read
                      ? "text-[12px] font-bold text-[#344054]"
                      : "text-[12px] font-black text-[#101828]"
                  }
                >
                  {
                    notification.title
                  }
                </h4>


                {!notification.is_read && (
                  <span className="h-2 w-2 rounded-full bg-[#e31b2d]" />
                )}
              </div>


              <p className="mt-2 max-w-[800px] whitespace-pre-wrap text-[9px] leading-5 text-[#667085]">
                {
                  notification.message
                }
              </p>
            </div>


            <div className="shrink-0 lg:text-right">
              <p className="text-[7px] font-semibold text-[#98a2b3]">
                {formatDateTime(
                  notification.created_at,
                )}
              </p>


              {notification.is_read &&
                notification.read_at && (
                <p className="mt-1 text-[6px] font-semibold text-[#b0b8c0]">
                  Read{" "}
                  {formatDateTime(
                    notification.read_at,
                  )}
                </p>
              )}
            </div>
          </div>


          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CategoryBadge
              category={
                notification.category
              }
            />


            <span className="rounded-full border border-[#e2e6ea] bg-[#f8f9fa] px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.06em] text-[#7b8794]">
              {
                notification.source
              }
            </span>


            {!notification.is_read && (
              <button
                type="button"
                disabled={
                  updating
                }
                onClick={() => {
                  void onMarkRead(
                    notification,
                  );
                }}
                className="ml-1 inline-flex items-center gap-1.5 text-[7px] font-black text-[#475467] transition hover:text-[#e31b2d] disabled:opacity-50"
              >
                {updating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}

                {updating
                  ? "Updating"
                  : "Mark read"}
              </button>
            )}


            {hasInternalLink && (
              <button
                type="button"
                disabled={
                  updating
                }
                onClick={() => {
                  void onOpen(
                    notification,
                  );
                }}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-[#d7dde3] bg-white px-3 text-[7px] font-black text-[#344054] transition hover:border-[#e31b2d]/35 hover:text-[#e31b2d] disabled:opacity-50"
              >
                Open

                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}


/* ============================================================
   CATEGORY FILTER CARD
============================================================ */

function CategoryFilterCard({
  label,
  description,
  count,
  active,
  icon:
    Icon,
  onClick,
}: {
  category:
    NotificationCategory;

  label:
    string;

  description:
    string;

  count:
    number;

  active:
    boolean;

  icon:
    LucideIcon;

  onClick:
    () => void;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
    <motion.button
      type="button"
      onClick={
        onClick
      }
      whileHover={
        reduceMotion
          ? undefined
          : {
              y:
                -4,
            }
      }
      className={
        active
          ? "group flex min-h-[125px] flex-col rounded-[14px] border border-[#efbdc2] bg-[#fff5f6] p-4 text-left shadow-[0_10px_30px_rgba(227,27,45,.07)]"
          : "group flex min-h-[125px] flex-col rounded-[14px] border border-[#dce2e7] bg-white p-4 text-left shadow-[0_8px_26px_rgba(15,23,42,.03)] transition hover:border-[#cbd3da] hover:shadow-[0_16px_38px_rgba(15,23,42,.06)]"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={
            active
              ? "flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#e31b2d] text-white"
              : "flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#071b2d] text-white transition group-hover:bg-[#e31b2d]"
          }
        >
          <Icon className="h-4 w-4" />
        </span>


        <span className="text-[20px] font-black tracking-[-0.035em] text-[#101828]">
          {
            count
          }
        </span>
      </div>


      <div className="mt-auto pt-4">
        <p className="text-[10px] font-black text-[#101828]">
          {
            label
          }
        </p>

        <p className="mt-1 text-[7px] leading-4 text-[#7b8794]">
          {
            description
          }
        </p>
      </div>
    </motion.button>
  );
}


/* ============================================================
   METRICS
============================================================ */

function HeroMetric({
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

      <p className="mt-1 truncate text-[17px] font-black text-white">
        {
          value
        }
      </p>
    </div>
  );
}


function NotificationMetric({
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
    number;

  detail:
    string;
}) {
  return (
    <div className="group flex items-center gap-4 border-b border-[#edf0f2] px-5 py-6 last:border-b-0 sm:border-r xl:border-b-0 xl:last:border-r-0 lg:px-8">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e0e5e9] bg-[#f5f7f9] text-[#596b7a] transition duration-300 group-hover:border-[#efc8cc] group-hover:bg-[#fff0f1] group-hover:text-[#e31b2d]">
        <Icon className="h-[18px] w-[18px]" />
      </span>


      <div>
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">
          {
            label
          }
        </p>

        <p className="mt-1 text-[20px] font-black tracking-[-0.035em] text-[#101828]">
          {
            value
          }
        </p>

        <p className="mt-0.5 text-[7px] text-[#98a2b3]">
          {
            detail
          }
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   CATEGORY VISUALS
============================================================ */

function CategoryIcon({
  category,
  unread,
}: {
  category:
    NotificationCategory;

  unread:
    boolean;
}) {
  const Icon =
    category ===
      "promotion"
      ? Megaphone
      : category ===
          "account"
        ? ShieldCheck
        : Bell;


  const classes =
    category ===
      "promotion"
      ? unread
        ? "border-[#f3c4cf] bg-[#fff1f3] text-[#c01048]"
        : "border-[#f0dbe1] bg-[#fff7f8] text-[#b04468]"
      : category ===
          "account"
        ? unread
          ? "border-[#cdd9ff] bg-[#eff4ff] text-[#3538cd]"
          : "border-[#dde3fa] bg-[#f7f8ff] text-[#6670b5]"
        : unread
          ? "border-[#dbe0e5] bg-[#f2f4f7] text-[#344054]"
          : "border-[#e4e7ea] bg-[#f8f9fa] text-[#667085]";


  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border ${classes}`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}


function CategoryBadge({
  category,
}: {
  category:
    NotificationCategory;
}) {
  const classes =
    {
      general:
        "border-[#dce2e7] bg-[#f4f6f8] text-[#667085]",

      account:
        "border-[#cdd9ff] bg-[#eff4ff] text-[#3538cd]",

      promotion:
        "border-[#f3c4cf] bg-[#fff1f3] text-[#c01048]",
    }[category];


  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.06em] ${classes}`}
    >
      {
        category
      }
    </span>
  );
}


/* ============================================================
   SIDEBAR
============================================================ */

function NotificationsSidebar({
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
        <SidebarLink
          icon={
            LayoutDashboard
          }
          label="Overview"
          href="/account"
        />

        <SidebarLink
          icon={
            Package
          }
          label="Orders"
          href="/orders"
        />

        <SidebarLink
          icon={
            CircleGauge
          }
          label="My Garage"
          href="/account/garage"
        />

        <SidebarLink
          icon={
            MapPin
          }
          label="Addresses"
          href="/account/addresses"
        />

        <SidebarLink
          icon={
            Heart
          }
          label="Wishlist"
          href="/account/wishlist"
        />

        <SidebarLink
          icon={
            Bell
          }
          label="Notifications"
          href="/account/notifications"
          active
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


function SidebarLink({
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
   EMPTY / LOADING
============================================================ */

function NotificationsLoading() {
  return (
    <div className="space-y-1 p-5">
      {[
        1,
        2,
        3,
        4,
      ].map(
        (
          item,
        ) => (
          <div
            key={
              item
            }
            className="h-[125px] animate-pulse rounded-[12px] bg-[#f3f5f7]"
          />
        ),
      )}
    </div>
  );
}


function EmptyInbox({
  hasNotifications,
  filtered,
}: {
  hasNotifications:
    boolean;

  filtered:
    boolean;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
    <div className="flex min-h-[430px] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-[430px]">
        <motion.span
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
            duration:
              4,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#071b2d] text-white shadow-[0_16px_38px_rgba(7,27,45,.15)]"
        >
          {hasNotifications ? (
            <Search className="h-6 w-6" />
          ) : (
            <Inbox className="h-6 w-6" />
          )}
        </motion.span>


        <h3 className="mt-5 text-[22px] font-black tracking-[-0.035em] text-[#101828]">
          {filtered
            ? "Nothing matches these filters."
            : "Your inbox is clear."}
        </h3>


        <p className="mt-3 text-[9px] leading-5 text-[#667085]">
          {filtered
            ? "Change or reset the read-state and category filters to see more notifications."
            : "Account messages, updates and Vehnexa promotions will appear here when available."}
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function NotificationsNavbar({
  cartCount,
  bellKey,
}: {
  cartCount:
    number;

  bellKey:
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
        <CustomerNavbarBrand />


        <CustomerNavbarLinks />


        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/shop"
            aria-label="Search parts"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
          >
            <Search className="h-[16px] w-[16px]" />
          </Link>


          <CustomerNavbarCart count={cartCount} />


          <NavbarNotificationBell
            key={`notification-bell-${bellKey}`}
          />


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
      </div>
    </motion.header>
  );
}


/* ============================================================
   TOP NAV
============================================================ */



/* ============================================================
   LOGO
============================================================ */



/* ============================================================
   DATE
============================================================ */

function formatDateTime(
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
    return "—";
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
