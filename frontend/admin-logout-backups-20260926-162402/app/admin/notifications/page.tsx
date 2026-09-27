"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Bell,
  Bot,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Mail,
  MailCheck,
  Megaphone,
  Package,
  Plus,
  Search,
  Send,
  Shapes,
  ShoppingBag,
  Star,
  Tags,
  Users,
  X,
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
  createAdminNotification,
  getAdminNotifications,
  getAdminUsers,
  type AdminNotification,
  type AdminNotificationCategory,
  type AdminUser,
} from "@/lib/admin";


type ReadFilter =
  | "all"
  | "unread"
  | "read";


type CategoryFilter =
  | "all"
  | AdminNotificationCategory;


type Audience =
  | "user"
  | "all_customers";


const PAGE_SIZE =
  50;


export default function AdminNotificationsPage() {
  const router =
    useRouter();


  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<UserPublic | null>(
      null,
    );


  const [
    notifications,
    setNotifications,
  ] =
    useState<AdminNotification[]>(
      [],
    );


  const [
    users,
    setUsers,
  ] =
    useState<AdminUser[]>(
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
    success,
    setSuccess,
  ] =
    useState(
      "",
    );


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
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
    currentPage,
    setCurrentPage,
  ] =
    useState(
      1,
    );


  const [
    composerOpen,
    setComposerOpen,
  ] =
    useState(
      false,
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
        const me =
          await getCurrentUser(
            accessToken,
          );


        if (
          cancelled
        ) {
          return;
        }


        if (
          me.role !==
          "admin"
        ) {
          router.replace(
            "/",
          );

          return;
        }


        const [
          notificationResult,
          userResult,
        ] =
          await Promise.all([
            getAdminNotifications(
              accessToken,
            ),

            getAdminUsers(
              accessToken,
            ),
          ]);


        if (
          cancelled
        ) {
          return;
        }


        setCurrentUser(
          me,
        );

        setNotifications(
          notificationResult,
        );

        setUsers(
          userResult,
        );

      } catch (
        loadError
      ) {
        handleAuthError(
          loadError,
          router,
        );


        if (
          !cancelled &&
          !(
            loadError instanceof
              ApiError &&
            (
              loadError.status ===
                401 ||
              loadError.status ===
                403
            )
          )
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


  const promotionCount =
    notifications.filter(
      (
        notification,
      ) =>
        notification.category ===
        "promotion",
    ).length;


  const eligibleCustomers =
    useMemo(
      () =>
        users
          .filter(
            (
              user,
            ) =>
              user.role ===
                "customer" &&
              user.is_active,
          )
          .sort(
            (
              left,
              right,
            ) =>
              left.email.localeCompare(
                right.email,
              ),
          ),
      [
        users,
      ],
    );


  const filteredNotifications =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLowerCase();


        return notifications.filter(
          (
            notification,
          ) => {
            if (
              readFilter ===
                "read" &&
              !notification.is_read
            ) {
              return false;
            }


            if (
              readFilter ===
                "unread" &&
              notification.is_read
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


            if (!needle) {
              return true;
            }


            return [
              notification.id,
              notification.user_id,
              notification.recipient_name,
              notification.recipient_email,
              notification.title,
              notification.message,
              notification.category,
              notification.link ??
                "",
            ].some(
              (
                value,
              ) =>
                value
                  .toLowerCase()
                  .includes(
                    needle,
                  ),
            );
          },
        );
      },
      [
        notifications,
        search,
        readFilter,
        categoryFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredNotifications.length /
          PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      currentPage,
      totalPages,
    );


  const pageNotifications =
    filteredNotifications.slice(
      (
        safePage -
        1
      ) *
        PAGE_SIZE,
      safePage *
        PAGE_SIZE,
    );


  const adminName =
    currentUser
      ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
      : "Administrator";


  async function handleCreated(
    created:
      AdminNotification[],
  ) {
    setNotifications(
      (
        current,
      ) => [
        ...created,
        ...current,
      ],
    );


    setSuccess(
      created.length ===
      1
        ? "Notification sent to 1 recipient."
        : `Notification sent to ${created.length} recipients.`,
    );


    setComposerOpen(
      false,
    );


    setCurrentPage(
      1,
    );
  }


  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#101828]">
      <div className="flex min-h-screen">
        <AdminSidebar />


        <section className="min-w-0 flex-1">
          <header className="flex h-[70px] items-center justify-between border-b border-[#e4e7ec] bg-white px-5 sm:px-8">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                Admin Console
              </p>

              <p className="mt-1 text-[12px] font-semibold text-[#344054]">
                {
                  adminName
                }
              </p>
            </div>


            <Link
              href="/"
              className="flex items-center gap-2 rounded-[7px] border border-[#d0d5dd] bg-white px-4 py-2 text-[9px] font-semibold"
            >
              <ExternalLink className="h-3.5 w-3.5" />

              Store
            </Link>
          </header>


          <div className="mx-auto max-w-[1450px] p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-[28px] font-bold tracking-[-0.035em]">
                  Notifications
                </h1>

                <p className="mt-2 text-[11px] text-[#667085]">
                  Send customer notifications and inspect delivery and read status.
                </p>
              </div>


              <button
                type="button"
                onClick={() => {
                  setSuccess(
                    "",
                  );

                  setComposerOpen(
                    true,
                  );
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-[7px] bg-[#071523] px-4 text-[9px] font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />

                Send notification
              </button>
            </div>


            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total deliveries"
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

              <MetricCard
                label="Promotions"
                value={
                  promotionCount
                }
                icon={
                  Megaphone
                }
              />
            </section>


            {error && (
              <div className="mt-5 rounded-[8px] border border-[#fecdca] bg-[#fff4f5] px-4 py-3 text-[10px] text-[#b42318]">
                {
                  error
                }
              </div>
            )}


            {success && (
              <div className="mt-5 rounded-[8px] border border-[#abefc6] bg-[#ecfdf3] px-4 py-3 text-[10px] text-[#067647]">
                {
                  success
                }
              </div>
            )}


            <div className="mt-7 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[390px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />

                <input
                  value={
                    search
                  }
                  onChange={
                    (
                      event,
                    ) => {
                      setSearch(
                        event.target.value,
                      );

                      setCurrentPage(
                        1,
                      );
                    }
                  }
                  placeholder="Search recipient, title or message..."
                  className="h-10 w-full rounded-[7px] border border-[#d0d5dd] bg-white pl-9 pr-3 text-[10px] outline-none"
                />
              </div>


              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={
                    categoryFilter
                  }
                  onChange={
                    (
                      event,
                    ) => {
                      setCategoryFilter(
                        event.target.value as
                          CategoryFilter,
                      );

                      setCurrentPage(
                        1,
                      );
                    }
                  }
                  className="h-10 rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px]"
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


                <select
                  value={
                    readFilter
                  }
                  onChange={
                    (
                      event,
                    ) => {
                      setReadFilter(
                        event.target.value as
                          ReadFilter,
                      );

                      setCurrentPage(
                        1,
                      );
                    }
                  }
                  className="h-10 rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px]"
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
              </div>
            </div>


            <div className="mt-4 overflow-hidden rounded-[14px] border border-[#dfe3e8] bg-white">
              {loading ? (
                <div className="space-y-3 p-5">
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
                        className="h-[76px] animate-pulse rounded-[8px] bg-[#f2f4f7]"
                      />
                    ),
                  )}
                </div>
              ) : pageNotifications.length ===
                0 ? (
                <div className="px-6 py-16 text-center">
                  <Bell className="mx-auto h-8 w-8 text-[#98a2b3]" />

                  <p className="mt-4 text-[12px] font-semibold">
                    No notifications found
                  </p>

                  <p className="mt-1 text-[9px] text-[#667085]">
                    Send a notification or change the current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#eaecf0] bg-[#fafbfc] text-left">
                        <TableHeading>
                          Recipient
                        </TableHeading>

                        <TableHeading>
                          Notification
                        </TableHeading>

                        <TableHeading>
                          Category
                        </TableHeading>

                        <TableHeading>
                          Status
                        </TableHeading>

                        <TableHeading>
                          Link
                        </TableHeading>

                        <TableHeading>
                          Sent
                        </TableHeading>
                      </tr>
                    </thead>


                    <tbody>
                      {pageNotifications.map(
                        (
                          notification,
                        ) => (
                          <tr
                            key={
                              notification.id
                            }
                            className="border-b border-[#eaecf0] last:border-0 hover:bg-[#fafbfc]"
                          >
                            <TableCell>
                              <p className="font-semibold text-[#101828]">
                                {
                                  notification.recipient_name
                                }
                              </p>

                              <p className="mt-1 max-w-[190px] truncate text-[8px] text-[#98a2b3]">
                                {
                                  notification.recipient_email ||
                                  notification.user_id
                                }
                              </p>
                            </TableCell>


                            <TableCell>
                              <p className="max-w-[250px] truncate font-semibold text-[#344054]">
                                {
                                  notification.title
                                }
                              </p>

                              <p className="mt-1 max-w-[300px] truncate text-[8px] text-[#667085]">
                                {
                                  notification.message
                                }
                              </p>
                            </TableCell>


                            <TableCell>
                              <CategoryBadge
                                category={
                                  notification.category
                                }
                              />
                            </TableCell>


                            <TableCell>
                              <ReadBadge
                                isRead={
                                  notification.is_read
                                }
                              />
                            </TableCell>


                            <TableCell>
                              {notification.link ? (
                                <span className="max-w-[180px] truncate text-[8px] text-[#475467]">
                                  {
                                    notification.link
                                  }
                                </span>
                              ) : (
                                <span className="text-[#98a2b3]">
                                  —
                                </span>
                              )}
                            </TableCell>


                            <TableCell>
                              <p>
                                {
                                  formatDateTime(
                                    notification.created_at,
                                  )
                                }
                              </p>

                              {notification.is_read &&
                                notification.read_at && (
                                <p className="mt-1 text-[7px] text-[#98a2b3]">
                                  Read{" "}
                                  {
                                    formatDateTime(
                                      notification.read_at,
                                    )
                                  }
                                </p>
                              )}
                            </TableCell>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


            {!loading && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[9px] text-[#98a2b3]">
                  Showing{" "}
                  {
                    pageNotifications.length
                  }{" "}
                  of{" "}
                  {
                    filteredNotifications.length
                  }{" "}
                  matching deliveries ·{" "}
                  {
                    notifications.length
                  }{" "}
                  total
                </p>


                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      safePage <=
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          page,
                        ) =>
                          Math.max(
                            1,
                            page -
                              1,
                          ),
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#d0d5dd] bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>


                  <span className="px-2 text-[9px] font-semibold text-[#475467]">
                    {
                      safePage
                    }{" "}
                    /{" "}
                    {
                      totalPages
                    }
                  </span>


                  <button
                    type="button"
                    disabled={
                      safePage >=
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          page,
                        ) =>
                          Math.min(
                            totalPages,
                            page +
                              1,
                          ),
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#d0d5dd] bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>


      {composerOpen && (
        <NotificationComposer
          customers={
            eligibleCustomers
          }
          onClose={() =>
            setComposerOpen(
              false,
            )
          }
          onCreated={
            handleCreated
          }
          router={
            router
          }
        />
      )}
    </main>
  );
}


function NotificationComposer({
  customers,
  onClose,
  onCreated,
  router,
}: {
  customers:
    AdminUser[];

  onClose:
    () => void;

  onCreated:
    (
      notifications:
        AdminNotification[],
    ) => void;

  router:
    ReturnType<
      typeof useRouter
    >;
}) {
  const [
    audience,
    setAudience,
  ] =
    useState<Audience>(
      "user",
    );


  const [
    userId,
    setUserId,
  ] =
    useState(
      "",
    );


  const [
    category,
    setCategory,
  ] =
    useState<AdminNotificationCategory>(
      "general",
    );


  const [
    title,
    setTitle,
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
    link,
    setLink,
  ] =
    useState(
      "",
    );


  const [
    sending,
    setSending,
  ] =
    useState(
      false,
    );


  const [
    formError,
    setFormError,
  ] =
    useState(
      "",
    );


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    const cleanTitle =
      title.trim();

    const cleanMessage =
      message.trim();

    const cleanLink =
      link.trim();


    if (!cleanTitle) {
      setFormError(
        "Title is required.",
      );

      return;
    }


    if (!cleanMessage) {
      setFormError(
        "Message is required.",
      );

      return;
    }


    if (
      audience ===
        "user" &&
      !userId
    ) {
      setFormError(
        "Choose a recipient.",
      );

      return;
    }


    const token =
      getAccessToken();


    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }


    try {
      setSending(
        true,
      );

      setFormError(
        "",
      );


      const created =
        await createAdminNotification(
          token,
          {
            audience,

            category,

            title:
              cleanTitle,

            message:
              cleanMessage,

            ...(audience ===
              "user"
              ? {
                  user_id:
                    userId,
                }
              : {}),

            ...(cleanLink
              ? {
                  link:
                    cleanLink,
                }
              : {}),
          },
        );


      onCreated(
        created,
      );

    } catch (
      sendError
    ) {
      handleAuthError(
        sendError,
        router,
      );


      if (
        !(
          sendError instanceof
            ApiError &&
          (
            sendError.status ===
              401 ||
            sendError.status ===
              403
          )
        )
      ) {
        setFormError(
          sendError instanceof
            Error
            ? sendError.message
            : "Unable to send notification.",
        );
      }

    } finally {
      setSending(
        false,
      );
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        aria-label="Close notification composer"
        onClick={
          onClose
        }
        className="absolute inset-0"
      />


      <aside className="relative z-10 h-full w-full max-w-[600px] overflow-y-auto bg-white">
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-[#eaecf0] bg-white px-6 py-5">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
              Customer communication
            </p>

            <h2 className="mt-1 text-[20px] font-bold">
              Send notification
            </h2>
          </div>


          <button
            type="button"
            disabled={
              sending
            }
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-[#eaecf0] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        <form
          onSubmit={
            submit
          }
          className="space-y-6 p-6"
        >
          {formError && (
            <div className="rounded-[8px] border border-[#fecdca] bg-[#fff4f5] px-4 py-3 text-[9px] text-[#b42318]">
              {
                formError
              }
            </div>
          )}


          <Field
            label="Audience"
          >
            <select
              value={
                audience
              }
              onChange={
                (
                  event,
                ) => {
                  const value =
                    event.target.value as
                      Audience;


                  setAudience(
                    value,
                  );


                  if (
                    value ===
                    "all_customers"
                  ) {
                    setUserId(
                      "",
                    );
                  }
                }
              }
              disabled={
                sending
              }
              className="h-11 w-full rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px] outline-none disabled:opacity-50"
            >
              <option value="user">
                One customer
              </option>

              <option value="all_customers">
                All active customers
              </option>
            </select>
          </Field>


          {audience ===
            "user" && (
            <Field
              label="Recipient"
            >
              <select
                value={
                  userId
                }
                onChange={
                  (
                    event,
                  ) =>
                    setUserId(
                      event.target.value,
                    )
                }
                disabled={
                  sending
                }
                className="h-11 w-full rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px] outline-none disabled:opacity-50"
              >
                <option value="">
                  Select an active customer
                </option>

                {customers.map(
                  (
                    customer,
                  ) => (
                    <option
                      key={
                        customer.id
                      }
                      value={
                        customer.id
                      }
                    >
                      {`${customer.first_name} ${customer.last_name}`.trim()} — {customer.email}
                    </option>
                  ),
                )}
              </select>

              {customers.length ===
                0 && (
                <p className="mt-2 text-[8px] text-[#b42318]">
                  There are no active customer accounts available.
                </p>
              )}
            </Field>
          )}


          {audience ===
            "all_customers" && (
            <div className="rounded-[8px] border border-[#b2ccff] bg-[#eff4ff] p-4">
              <p className="text-[9px] font-semibold text-[#3538cd]">
                All active customers
              </p>

              <p className="mt-1 text-[8px] leading-5 text-[#475467]">
                This will create one notification delivery for each currently active customer.
              </p>
            </div>
          )}


          <Field
            label="Category"
          >
            <select
              value={
                category
              }
              onChange={
                (
                  event,
                ) =>
                  setCategory(
                    event.target.value as
                      AdminNotificationCategory,
                  )
              }
              disabled={
                sending
              }
              className="h-11 w-full rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px] outline-none disabled:opacity-50"
            >
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
          </Field>


          <Field
            label="Title"
          >
            <input
              value={
                title
              }
              onChange={
                (
                  event,
                ) =>
                  setTitle(
                    event.target.value,
                  )
              }
              maxLength={
                120
              }
              disabled={
                sending
              }
              placeholder="Notification title"
              className="h-11 w-full rounded-[7px] border border-[#d0d5dd] px-3 text-[10px] outline-none disabled:opacity-50"
            />

            <p className="mt-1 text-right text-[7px] text-[#98a2b3]">
              {
                title.length
              }{" "}
              / 120
            </p>
          </Field>


          <Field
            label="Message"
          >
            <textarea
              value={
                message
              }
              onChange={
                (
                  event,
                ) =>
                  setMessage(
                    event.target.value,
                  )
              }
              maxLength={
                1000
              }
              rows={
                7
              }
              disabled={
                sending
              }
              placeholder="Write the customer notification..."
              className="w-full resize-none rounded-[7px] border border-[#d0d5dd] p-3 text-[10px] leading-5 outline-none disabled:opacity-50"
            />

            <p className="mt-1 text-right text-[7px] text-[#98a2b3]">
              {
                message.length
              }{" "}
              / 1000
            </p>
          </Field>


          <Field
            label="Optional app link"
          >
            <input
              value={
                link
              }
              onChange={
                (
                  event,
                ) =>
                  setLink(
                    event.target.value,
                  )
              }
              maxLength={
                500
              }
              disabled={
                sending
              }
              placeholder="/orders or /shop"
              className="h-11 w-full rounded-[7px] border border-[#d0d5dd] px-3 text-[10px] outline-none disabled:opacity-50"
            />

            <p className="mt-2 text-[8px] leading-4 text-[#98a2b3]">
              Leave this empty when the notification does not need a destination.
            </p>
          </Field>


          <div className="flex justify-end gap-3 border-t border-[#eaecf0] pt-5">
            <button
              type="button"
              disabled={
                sending
              }
              onClick={
                onClose
              }
              className="h-10 rounded-[7px] border border-[#d0d5dd] px-4 text-[9px] font-semibold disabled:opacity-50"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                sending ||
                (
                  audience ===
                    "user" &&
                  customers.length ===
                    0
                )
              }
              className="flex h-10 items-center gap-2 rounded-[7px] bg-[#071523] px-5 text-[9px] font-semibold text-white disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />

              {
                sending
                  ? "Sending..."
                  : "Send notification"
              }
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}


function AdminSidebar() {
  return (
    <aside className="hidden w-[230px] shrink-0 bg-[#071523] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <Link
          href="/admin"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#ef3d43] text-[18px] font-black italic">
            V
          </div>

          <div>
            <div className="text-[14px] font-bold">
              VEHNEXA
            </div>

            <div className="text-[8px] font-semibold tracking-[0.18em] text-[#98a2b3]">
              ADMIN CONSOLE
            </div>
          </div>
        </Link>
      </div>


      <nav className="flex-1 space-y-1 px-3 py-5">
        <Nav href="/admin" icon={LayoutDashboard} label="Overview" />
        <Nav href="/admin/products" icon={Package} label="Products" />
        <Nav href="/admin/categories" icon={Shapes} label="Categories" />
        <Nav href="/admin/brands" icon={Tags} label="Brands" />
        <Nav href="/admin/fitments" icon={CarFront} label="Fitments" />
        <Nav href="/admin/orders" icon={ShoppingBag} label="Orders" />
        <Nav href="/admin/users" icon={Users} label="Users" />
        <Nav href="/admin/reviews" icon={Star} label="Reviews" />
        <Nav href="/admin/ai-sessions" icon={Bot} label="AI Sessions" />
        <Nav href="/admin/notifications" icon={Bell} label="Notifications" active />
      </nav>
    </aside>
  );
}


function Nav({
  href,
  icon:
    Icon,
  label,
  active =
    false,
}: {
  href?:
    string;

  icon:
    LucideIcon;

  label:
    string;

  active?:
    boolean;
}) {
  const className =
    active
      ? "flex h-10 items-center gap-3 rounded-[7px] bg-white/10 px-3 text-[9px] font-semibold text-white"
      : "flex h-10 items-center gap-3 rounded-[7px] px-3 text-[9px] font-medium text-[#98a2b3] hover:bg-white/5 hover:text-white";


  const content = (
    <>
      <Icon className="h-4 w-4" />

      {
        label
      }
    </>
  );


  return href ? (
    <Link
      href={
        href
      }
      className={
        className
      }
    >
      {
        content
      }
    </Link>
  ) : (
    <div
      className={
        className
      }
    >
      {
        content
      }
    </div>
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
    LucideIcon;
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

          <p className="mt-2 text-[23px] font-bold">
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


function TableHeading({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">
      {
        children
      }
    </th>
  );
}


function TableCell({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <td className="px-5 py-4 text-[9px] text-[#475467]">
      {
        children
      }
    </td>
  );
}


function CategoryBadge({
  category,
}: {
  category:
    AdminNotificationCategory;
}) {
  const styles = {
    general:
      "border-[#d0d5dd] bg-[#f9fafb] text-[#475467]",

    account:
      "border-[#b2ccff] bg-[#eff4ff] text-[#3538cd]",

    promotion:
      "border-[#fecdd6] bg-[#fff1f3] text-[#c01048]",
  };


  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-semibold capitalize ${styles[category]}`}
    >
      {
        category
      }
    </span>
  );
}


function ReadBadge({
  isRead,
}: {
  isRead:
    boolean;
}) {
  return (
    <span
      className={
        isRead
          ? "inline-flex rounded-full border border-[#abefc6] bg-[#ecfdf3] px-2.5 py-1 text-[8px] font-semibold text-[#067647]"
          : "inline-flex rounded-full border border-[#fedf89] bg-[#fffaeb] px-2.5 py-1 text-[8px] font-semibold text-[#b54708]"
      }
    >
      {
        isRead
          ? "Read"
          : "Unread"
      }
    </span>
  );
}


function Field({
  label,
  children,
}: {
  label:
    string;

  children:
    ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[8px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
        {
          label
        }
      </span>

      {
        children
      }
    </label>
  );
}


function formatDateTime(
  value:
    string | null,
) {
  if (!value) {
    return "—";
  }


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


function handleAuthError(
  error:
    unknown,
  router:
    ReturnType<
      typeof useRouter
    >,
) {
  if (
    error instanceof
      ApiError &&
    error.status ===
      401
  ) {
    removeAccessToken();

    router.replace(
      "/login",
    );

    return;
  }


  if (
    error instanceof
      ApiError &&
    error.status ===
      403
  ) {
    router.replace(
      "/",
    );
  }
}
