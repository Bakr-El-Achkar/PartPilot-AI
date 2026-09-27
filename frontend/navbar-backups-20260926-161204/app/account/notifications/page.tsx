"use client";

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
  ArrowLeft,
  Bell,
  CheckCheck,
  ExternalLink,
  Heart,
  Mail,
  MailCheck,
  MapPin,
  Megaphone,
  Package,
  ShieldCheck,
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


export default function CustomerNotificationsPage() {
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


    async function load() {
      try {
        const [
          currentUser,
          result,
        ] =
          await Promise.all([
            getCurrentUser(
              accessToken,
            ),

            getNotifications(
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


        if (
          !cancelled
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load notifications.",
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


    void load();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


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


  const filtered =
    useMemo(
      () =>
        notifications.filter(
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


  const displayName =
    user
      ? `${user.first_name} ${user.last_name}`.trim() ||
        "Customer"
      : "Customer";


  const initials =
    user
      ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
          .toUpperCase() ||
        "V"
      : "V";


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
        readError.status ===
          401
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
        readError.status ===
          401
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
            <Link href="/" className="text-[10px] text-[#667085]">
              Home
            </Link>

            <Link href="/shop" className="text-[10px] text-[#667085]">
              Shop
            </Link>

            <Link href="/account/garage" className="text-[10px] text-[#667085]">
              My Garage
            </Link>

            <Link href="/ai-mechanic" className="text-[10px] text-[#667085]">
              AI Mechanic
            </Link>

            <Link href="/orders" className="text-[10px] text-[#667085]">
              Orders
            </Link>
          </nav>


          <Link
            href="/account"
            aria-label="Account"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#071523] text-white"
          >
            <UserRound className="h-4 w-4" />
          </Link>
        </div>
      </header>


      <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#667085]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />

          Back to account
        </Link>


        <div className="mt-5 grid gap-7 lg:grid-cols-[235px_1fr]">
          <aside className="self-start rounded-[16px] border border-[#dfe3e8] bg-white p-5">
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

              <ProfileLink
                href="/account/wishlist"
                icon={
                  Heart
                }
                label="Wishlist"
              />

              <div className="flex h-11 items-center gap-3 rounded-[7px] bg-[#fff0f1] px-4 text-[10px] font-semibold text-[#e31b2d]">
                <Bell className="h-4 w-4" />

                Notifications
              </div>
            </div>
          </aside>


          <section className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#e31b2d]">
                  CUSTOMER INBOX
                </p>

                <h1 className="mt-2 text-[30px] font-bold tracking-[-0.035em]">
                  Notifications
                </h1>

                <p className="mt-2 text-[11px] text-[#667085]">
                  Account messages, updates and Vehnexa offers.
                </p>
              </div>


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
                  className="flex h-10 items-center justify-center gap-2 rounded-[7px] border border-[#d0d5dd] bg-white px-4 text-[9px] font-semibold text-[#344054] disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4" />

                  {
                    updatingAll
                      ? "Updating..."
                      : "Mark all as read"
                  }
                </button>
              )}
            </div>


            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Total"
                value={
                  notifications.length
                }
                icon={
                  Bell
                }
              />

              <MetricCard
                label="Unread"
                value={
                  unreadCount
                }
                icon={
                  Mail
                }
              />

              <MetricCard
                label="Read"
                value={
                  readCount
                }
                icon={
                  MailCheck
                }
              />
            </div>


            {error && (
              <div className="mt-5 rounded-[8px] border border-[#fecdca] bg-[#fff4f5] px-4 py-3 text-[9px] text-[#b42318]">
                {
                  error
                }
              </div>
            )}


            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <select
                value={
                  readFilter
                }
                onChange={
                  (
                    event,
                  ) =>
                    setReadFilter(
                      event.target.value as
                        ReadFilter,
                    )
                }
                className="h-10 rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[9px]"
              >
                <option value="all">
                  All read states
                </option>

                <option value="unread">
                  Unread
                </option>

                <option value="read">
                  Read
                </option>
              </select>


              <select
                value={
                  categoryFilter
                }
                onChange={
                  (
                    event,
                  ) =>
                    setCategoryFilter(
                      event.target.value as
                        CategoryFilter,
                    )
                }
                className="h-10 rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[9px]"
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
            </div>


            <div className="mt-4 overflow-hidden rounded-[14px] border border-[#dfe3e8] bg-white">
              {loading ? (
                <div className="space-y-3 p-5">
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
                        className="h-[94px] animate-pulse rounded-[8px] bg-[#f2f4f7]"
                      />
                    ),
                  )}
                </div>
              ) : filtered.length ===
                0 ? (
                <div className="px-6 py-16 text-center">
                  <Bell className="mx-auto h-9 w-9 text-[#b8c0ca]" />

                  <h2 className="mt-4 text-[13px] font-bold">
                    No notifications
                  </h2>

                  <p className="mt-2 text-[9px] text-[#667085]">
                    There are no notifications matching these filters.
                  </p>
                </div>
              ) : (
                <div>
                  {filtered.map(
                    (
                      notification,
                    ) => (
                      <article
                        key={
                          notification.id
                        }
                        className={
                          notification.is_read
                            ? "flex gap-4 border-b border-[#eaecf0] p-5 last:border-0"
                            : "flex gap-4 border-b border-[#eaecf0] bg-[#fffafb] p-5 last:border-0"
                        }
                      >
                        <CategoryIcon
                          category={
                            notification.category
                          }
                        />


                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-[11px] font-bold text-[#101828]">
                                  {
                                    notification.title
                                  }
                                </h3>

                                {!notification.is_read && (
                                  <span className="h-2 w-2 rounded-full bg-[#e31b2d]" />
                                )}
                              </div>


                              <p className="mt-2 whitespace-pre-wrap text-[9px] leading-5 text-[#667085]">
                                {
                                  notification.message
                                }
                              </p>
                            </div>


                            <span className="shrink-0 text-[8px] text-[#98a2b3]">
                              {
                                formatDateTime(
                                  notification.created_at,
                                )
                              }
                            </span>
                          </div>


                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <CategoryBadge
                              category={
                                notification.category
                              }
                            />


                            {!notification.is_read && (
                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  notification.id
                                }
                                onClick={() => {
                                  void markOne(
                                    notification,
                                  );
                                }}
                                className="text-[8px] font-semibold text-[#475467] hover:text-[#e31b2d] disabled:opacity-50"
                              >
                                {
                                  updatingId ===
                                  notification.id
                                    ? "Updating..."
                                    : "Mark as read"
                                }
                              </button>
                            )}


                            {notification.link &&
                              notification.link.startsWith(
                                "/",
                              ) && (
                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  notification.id
                                }
                                onClick={() => {
                                  void markOne(
                                    notification,
                                    true,
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 text-[8px] font-semibold text-[#e31b2d] disabled:opacity-50"
                              >
                                Open

                                <ExternalLink className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </div>
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


function MetricCard({
  label,
  value,
  icon:
    Icon,
}: {
  label:
    string;

  value:
    number;

  icon:
    typeof Bell;
}) {
  return (
    <div className="rounded-[12px] border border-[#dfe3e8] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">
            {
              label
            }
          </p>

          <p className="mt-2 text-[22px] font-bold">
            {
              value.toLocaleString()
            }
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f2f4f7]">
          <Icon className="h-4 w-4 text-[#667085]" />
        </div>
      </div>
    </div>
  );
}


function CategoryIcon({
  category,
}: {
  category:
    NotificationCategory;
}) {
  if (
    category ===
    "promotion"
  ) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#fff1f3] text-[#c01048]">
        <Megaphone className="h-4 w-4" />
      </div>
    );
  }


  if (
    category ===
    "account"
  ) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#eff4ff] text-[#3538cd]">
        <ShieldCheck className="h-4 w-4" />
      </div>
    );
  }


  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#f2f4f7] text-[#475467]">
      <Bell className="h-4 w-4" />
    </div>
  );
}


function CategoryBadge({
  category,
}: {
  category:
    NotificationCategory;
}) {
  const classes = {
    general:
      "bg-[#f2f4f7] text-[#475467]",

    account:
      "bg-[#eff4ff] text-[#3538cd]",

    promotion:
      "bg-[#fff1f3] text-[#c01048]",
  };


  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[7px] font-semibold capitalize ${classes[category]}`}
    >
      {
        category
      }
    </span>
  );
}


function formatDateTime(
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
    return "—";
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
        "2-digit",

      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}
