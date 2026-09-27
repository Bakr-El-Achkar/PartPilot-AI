"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
  Megaphone,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  ApiError,
  getCurrentUser,
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
} from "@/lib/notifications";


export default function CustomerNotificationCenter() {
  const pathname =
    usePathname();

  const router =
    useRouter();


  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const [
    visible,
    setVisible,
  ] =
    useState(
      false,
    );


  const [
    open,
    setOpen,
  ] =
    useState(
      false,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );


  const [
    notifications,
    setNotifications,
  ] =
    useState<CustomerNotification[]>(
      [],
    );


  const [
    error,
    setError,
  ] =
    useState(
      "",
    );


  const excluded =
    pathname.startsWith(
      "/admin",
    ) ||
    pathname.startsWith(
      "/login",
    ) ||
    pathname.startsWith(
      "/register",
    );


  const loadNotifications =
    useCallback(
      async () => {
        if (
          excluded
        ) {
          setVisible(
            false,
          );

          return;
        }


        const token =
          getAccessToken();


        if (!token) {
          setVisible(
            false,
          );

          return;
        }


        try {
          setLoading(
            true,
          );


          const user =
            await getCurrentUser(
              token,
            );


          if (
            user.role ===
            "admin"
          ) {
            setVisible(
              false,
            );

            return;
          }


          const result =
            await getNotifications(
              token,
            );


          setNotifications(
            result,
          );

          setVisible(
            true,
          );

          setError(
            "",
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

            setVisible(
              false,
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
        excluded,
      ],
    );


  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          void loadNotifications();
        },
        0,
      );


    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    loadNotifications,
  ]);


  useEffect(() => {
    function handlePointerDown(
      event:
        MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(
          false,
        );
      }
    }


    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, []);


  const unreadCount =
    notifications.filter(
      (
        notification,
      ) =>
        !notification.is_read,
    ).length;


  async function toggle() {
    const nextOpen =
      !open;


    setOpen(
      nextOpen,
    );


    if (nextOpen) {
      await loadNotifications();
    }
  }


  async function openNotification(
    notification:
      CustomerNotification,
  ) {
    const token =
      getAccessToken();


    if (!token) {
      setVisible(
        false,
      );

      return;
    }


    let current =
      notification;


    if (
      !notification.is_read
    ) {
      try {
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

          setVisible(
            false,
          );

          return;
        }


        setError(
          readError instanceof
            Error
            ? readError.message
            : "Unable to update notification.",
        );

        return;
      }
    }


    setOpen(
      false,
    );


    if (
      current.link &&
      current.link.startsWith(
        "/",
      )
    ) {
      router.push(
        current.link,
      );
    }
  }


  async function markAllRead() {
    const token =
      getAccessToken();


    if (!token) {
      return;
    }


    try {
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


      setError(
        "",
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

        setVisible(
          false,
        );

        return;
      }


      setError(
        readError instanceof
          Error
          ? readError.message
          : "Unable to update notifications.",
      );
    }
  }


  if (
    excluded ||
    !visible
  ) {
    return null;
  }


  return (
    <div
      ref={
        containerRef
      }
      className="fixed bottom-5 right-5 z-[100]"
    >
      {open && (
        <div className="absolute bottom-[58px] right-0 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-[14px] border border-[#dfe3e8] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.20)]">
          <div className="flex items-start justify-between border-b border-[#eaecf0] px-4 py-4">
            <div>
              <h2 className="text-[12px] font-bold text-[#101828]">
                Notifications
              </h2>

              <p className="mt-1 text-[8px] text-[#667085]">
                {
                  unreadCount
                }{" "}
                unread
              </p>
            </div>


            <div className="flex items-center gap-1">
              {unreadCount >
                0 && (
                <button
                  type="button"
                  onClick={() => {
                    void markAllRead();
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-[6px] px-2 text-[8px] font-semibold text-[#475467] hover:bg-[#f2f4f7]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />

                  Read all
                </button>
              )}


              <button
                type="button"
                onClick={() =>
                  setOpen(
                    false,
                  )
                }
                aria-label="Close notifications"
                className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#667085] hover:bg-[#f2f4f7]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>


          {error && (
            <div className="border-b border-[#fecdca] bg-[#fff4f5] px-4 py-2.5 text-[8px] text-[#b42318]">
              {
                error
              }
            </div>
          )}


          <div className="max-h-[390px] overflow-y-auto">
            {loading &&
            notifications.length ===
              0 ? (
              <div className="space-y-2 p-4">
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
                      className="h-[76px] animate-pulse rounded-[8px] bg-[#f2f4f7]"
                    />
                  ),
                )}
              </div>
            ) : notifications.length ===
              0 ? (
              <div className="px-6 py-10 text-center">
                <Bell className="mx-auto h-7 w-7 text-[#b8c0ca]" />

                <p className="mt-3 text-[10px] font-semibold text-[#344054]">
                  You&apos;re all caught up
                </p>

                <p className="mt-1 text-[8px] text-[#98a2b3]">
                  New Vehnexa notifications will appear here.
                </p>
              </div>
            ) : (
              notifications
                .slice(
                  0,
                  6,
                )
                .map(
                  (
                    notification,
                  ) => (
                    <button
                      key={
                        notification.id
                      }
                      type="button"
                      onClick={() => {
                        void openNotification(
                          notification,
                        );
                      }}
                      className={
                        notification.is_read
                          ? "flex w-full gap-3 border-b border-[#f0f2f5] px-4 py-4 text-left last:border-0 hover:bg-[#fafbfc]"
                          : "flex w-full gap-3 border-b border-[#f0f2f5] bg-[#fffafb] px-4 py-4 text-left last:border-0 hover:bg-[#fff5f6]"
                      }
                    >
                      <NotificationIcon
                        notification={
                          notification
                        }
                      />


                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-[9px] font-bold text-[#101828]">
                            {
                              notification.title
                            }
                          </p>


                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e31b2d]" />
                          )}
                        </div>


                        <p className="mt-1 line-clamp-2 text-[8px] leading-4 text-[#667085]">
                          {
                            notification.message
                          }
                        </p>


                        <p className="mt-2 text-[7px] text-[#98a2b3]">
                          {
                            formatRelativeDate(
                              notification.created_at,
                            )
                          }
                        </p>
                      </div>
                    </button>
                  ),
                )
            )}
          </div>


          <div className="border-t border-[#eaecf0] bg-[#fafbfc] p-3">
            <Link
              href="/account/notifications"
              onClick={() =>
                setOpen(
                  false,
                )
              }
              className="flex h-9 items-center justify-center rounded-[6px] border border-[#d0d5dd] bg-white text-[8px] font-semibold text-[#344054]"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}


      <button
        type="button"
        onClick={() => {
          void toggle();
        }}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#071523] text-white shadow-[0_8px_24px_rgba(7,21,35,0.28)] transition hover:bg-[#10293f]"
      >
        <Bell className="h-[18px] w-[18px]" />


        {unreadCount >
          0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#e31b2d] px-1 text-[7px] font-bold text-white">
            {
              unreadCount >
              99
                ? "99+"
                : unreadCount
            }
          </span>
        )}
      </button>
    </div>
  );
}


function NotificationIcon({
  notification,
}: {
  notification:
    CustomerNotification;
}) {
  if (
    notification.category ===
    "promotion"
  ) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#fff1f3] text-[#c01048]">
        <Megaphone className="h-3.5 w-3.5" />
      </div>
    );
  }


  if (
    notification.category ===
    "account"
  ) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#eff4ff] text-[#3538cd]">
        <ShieldCheck className="h-3.5 w-3.5" />
      </div>
    );
  }


  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#f2f4f7] text-[#475467]">
      <Bell className="h-3.5 w-3.5" />
    </div>
  );
}


function formatRelativeDate(
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
    return "";
  }


  const difference =
    Date.now() -
    date.getTime();


  const minutes =
    Math.floor(
      difference /
      60000,
    );


  if (
    minutes <
    1
  ) {
    return "Just now";
  }


  if (
    minutes <
    60
  ) {
    return `${minutes}m ago`;
  }


  const hours =
    Math.floor(
      minutes /
      60,
    );


  if (
    hours <
    24
  ) {
    return `${hours}h ago`;
  }


  const days =
    Math.floor(
      hours /
      24,
    );


  if (
    days <
    7
  ) {
    return `${days}d ago`;
  }


  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",
    },
  ).format(
    date,
  );
}
