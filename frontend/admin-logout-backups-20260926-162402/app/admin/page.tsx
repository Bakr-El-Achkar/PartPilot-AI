"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Bell,
  Bot,
  Boxes,
  CarFront,
  CircleGauge,
  ClipboardList,
  ExternalLink,
  HeartPulse,
  LayoutDashboard,
  Package,
  Shapes,
  ShoppingBag,
  Star,
  Tags,
  Users,
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
  getAdminOverview,
  type AdminOverview,
} from "@/lib/admin";


export default function AdminPage() {
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
    overview,
    setOverview,
  ] =
    useState<AdminOverview | null>(
      null,
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


    async function loadAdmin() {
      try {
        const currentUser =
          await getCurrentUser(
            accessToken,
          );


        if (
          cancelled
        ) {
          return;
        }


        if (
          currentUser.role !==
          "admin"
        ) {
          router.replace(
            "/",
          );

          return;
        }


        setUser(
          currentUser,
        );


        const metrics =
          await getAdminOverview(
            accessToken,
          );


        if (
          cancelled
        ) {
          return;
        }


        setOverview(
          metrics,
        );

      } catch (
        loadError
      ) {
        if (
          loadError instanceof
            ApiError &&
          loadError.status ===
            401
        ) {
          removeAccessToken();

          router.replace(
            "/login",
          );

          return;
        }


        if (
          loadError instanceof
            ApiError &&
          loadError.status ===
            403
        ) {
          router.replace(
            "/",
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
              : "Unable to load admin dashboard.",
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


    void loadAdmin();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


  const adminName =
    user
      ? `${user.first_name} ${user.last_name}`.trim()
      : "Administrator";


  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#101828]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[230px] shrink-0 bg-[#071523] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#ef3d43] text-[18px] font-black italic text-white">
                V
              </div>

              <div>
                <div className="text-[14px] font-bold tracking-wide">
                  VEHNEXA
                </div>

                <div className="mt-0.5 text-[8px] font-semibold tracking-[0.18em] text-[#98a2b3]">
                  ADMIN CONSOLE
                </div>
              </div>
            </Link>
          </div>


          <nav className="flex-1 space-y-1 px-3 py-5">
            <AdminNavItem
              icon={
                LayoutDashboard
              }
              label="Overview"
              active
            />

            <AdminNavItem
              href="/admin/products"
              icon={
                Package
              }
              label="Products"
            />

            <AdminNavItem
              href="/admin/categories"
              icon={
                Shapes
              }
              label="Categories"
            />

            <AdminNavItem
              href="/admin/brands"
              icon={
                Tags
              }
              label="Brands"
            />

            <AdminNavItem
              href="/admin/fitments"
              icon={
                CarFront
              }
              label="Fitments"
            />

            <AdminNavItem
              href="/admin/orders"
              icon={
                ShoppingBag
              }
              label="Orders"
            />

            <AdminNavItem
              href="/admin/users"
              icon={
                Users
              }
              label="Users"
            />

            <AdminNavItem href="/admin/reviews"
              icon={
                Star
              }
              label="Reviews"
            />

            <AdminNavItem href="/admin/ai-sessions"
              icon={
                Bot
              }
              label="AI Sessions"
            />

            <AdminNavItem href="/admin/notifications"
              icon={
                Bell
              }
              label="Notifications"
            />
          </nav>


          <div className="border-t border-white/10 p-4">
            <Link
              href="/"
              className="flex h-10 items-center justify-center gap-2 rounded-[7px] border border-white/15 text-[9px] font-semibold text-[#d0d5dd] transition hover:bg-white/5"
            >
              <ExternalLink className="h-3.5 w-3.5" />

              View storefront
            </Link>
          </div>
        </aside>


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
              className="flex items-center gap-2 rounded-[7px] border border-[#d0d5dd] bg-white px-4 py-2 text-[9px] font-semibold text-[#344054]"
            >
              <ExternalLink className="h-3.5 w-3.5" />

              Store
            </Link>
          </header>


          <div className="mx-auto max-w-[1380px] p-5 sm:p-8">
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.035em]">
                Dashboard overview
              </h1>

              <p className="mt-2 text-[11px] text-[#667085]">
                Monitor catalog, orders, users and compatibility data.
              </p>
            </div>


            {error && (
              <div className="mt-6 rounded-[8px] border border-[#f1c7cc] bg-[#fff4f5] px-4 py-3 text-[10px] text-[#b4232f]">
                {
                  error
                }
              </div>
            )}


            {loading ? (
              <DashboardSkeleton />
            ) : overview ? (
              <>
                <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Products"
                    value={
                      overview.products
                    }
                    note="Catalog records"
                    icon={
                      Package
                    }
                  />

                  <MetricCard
                    label="Fitments"
                    value={
                      overview.fitments
                    }
                    note="Compatibility records"
                    icon={
                      CarFront
                    }
                  />

                  <MetricCard
                    label="Orders"
                    value={
                      overview.orders
                    }
                    note={`${overview.processing_orders} processing`}
                    icon={
                      ShoppingBag
                    }
                  />

                  <MetricCard
                    label="Users"
                    value={
                      overview.users
                    }
                    note="Registered accounts"
                    icon={
                      Users
                    }
                  />
                </section>


                <section className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                  <div className="rounded-[14px] border border-[#dfe3e8] bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[14px] font-bold">
                          Operations
                        </h2>

                        <p className="mt-1 text-[9px] text-[#667085]">
                          Live marketplace and order indicators.
                        </p>
                      </div>

                      <CircleGauge className="h-5 w-5 text-[#98a2b3]" />
                    </div>


                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <SmallMetric
                        label="Orders this month"
                        value={
                          overview.orders_this_month.toLocaleString()
                        }
                      />

                      <SmallMetric
                        label="Processing"
                        value={
                          overview.processing_orders.toLocaleString()
                        }
                      />

                      <SmallMetric
                        label="Order value"
                        value={
                          formatMoney(
                            overview.revenue,
                          )
                        }
                      />
                    </div>


                    <div className="mt-6 rounded-[10px] bg-[#f8f9fb] px-5 py-4">
                      <div className="flex items-start gap-3">
                        <ClipboardList className="mt-0.5 h-4 w-4 text-[#667085]" />

                        <div>
                          <p className="text-[10px] font-semibold">
                            Order management
                          </p>

                          <p className="mt-1 text-[9px] leading-5 text-[#667085]">
                            The next admin module will add the complete order list and status-management workflow.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="rounded-[14px] border border-[#dfe3e8] bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[14px] font-bold">
                          Catalog health
                        </h2>

                        <p className="mt-1 text-[9px] text-[#667085]">
                          Current marketplace structure.
                        </p>
                      </div>

                      <Boxes className="h-5 w-5 text-[#98a2b3]" />
                    </div>


                    <div className="mt-6 space-y-3">
                      <HealthRow
                        label="Products"
                        value={
                          overview.products
                        }
                      />

                      <HealthRow
                        label="Categories"
                        value={
                          overview.categories
                        }
                      />

                      <HealthRow
                        label="Brands"
                        value={
                          overview.brands
                        }
                      />

                      <HealthRow
                        label="Low stock"
                        value={
                          overview.low_stock_items
                        }
                        alert={
                          overview.low_stock_items >
                          0
                        }
                      />
                    </div>
                  </div>
                </section>


                <section className="mt-7 grid gap-5 lg:grid-cols-3">
                  <StatusCard
                    icon={
                      HeartPulse
                    }
                    title="Inventory monitoring"
                    text={
                      overview.low_stock_items >
                      0
                        ? `${overview.low_stock_items} active products currently have 5 or fewer units in stock.`
                        : "No active products are currently in the low-stock range."
                    }
                  />

                  <StatusCard
                    icon={
                      CarFront
                    }
                    title="Compatibility data"
                    text={`${overview.fitments.toLocaleString()} fitment records are currently stored in the platform.`}
                  />

                  <StatusCard
                    icon={
                      Users
                    }
                    title="Customer base"
                    text={`${overview.users.toLocaleString()} user accounts are currently registered.`}
                  />
                </section>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}


function AdminNavItem({
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
      : "flex h-10 items-center gap-3 rounded-[7px] px-3 text-[9px] font-medium text-[#98a2b3] transition hover:bg-white/5 hover:text-white";


  const content = (
    <>
      <Icon className="h-4 w-4" />

      {
        label
      }
    </>
  );


  if (href) {
    return (
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
    );
  }


  return (
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
  note,
  icon:
    Icon,
}: {
  label:
    string;

  value:
    number;

  note:
    string;

  icon:
    LucideIcon;
}) {
  return (
    <div className="rounded-[14px] border border-[#dfe3e8] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">
            {
              label
            }
          </p>

          <p className="mt-3 text-[27px] font-bold tracking-[-0.04em]">
            {
              value.toLocaleString()
            }
          </p>

          <p className="mt-1 text-[9px] text-[#667085]">
            {
              note
            }
          </p>
        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#f2f4f7]">
          <Icon className="h-4.5 w-4.5 text-[#475467]" />
        </div>
      </div>
    </div>
  );
}


function SmallMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[10px] border border-[#eaecf0] p-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">
        {
          label
        }
      </p>

      <p className="mt-2 text-[19px] font-bold">
        {
          value
        }
      </p>
    </div>
  );
}


function HealthRow({
  label,
  value,
  alert =
    false,
}: {
  label:
    string;

  value:
    number;

  alert?:
    boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-[8px] border border-[#eaecf0] px-4 py-3">
      <span className="text-[9px] font-medium text-[#475467]">
        {
          label
        }
      </span>

      <span
        className={
          alert
            ? "text-[11px] font-bold text-[#d92d20]"
            : "text-[11px] font-bold text-[#101828]"
        }
      >
        {
          value.toLocaleString()
        }
      </span>
    </div>
  );
}


function StatusCard({
  icon:
    Icon,
  title,
  text,
}: {
  icon:
    LucideIcon;

  title:
    string;

  text:
    string;
}) {
  return (
    <div className="rounded-[14px] border border-[#dfe3e8] bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#fff1f2] text-[#e31b2d]">
        <Icon className="h-4 w-4" />
      </div>

      <h3 className="mt-4 text-[11px] font-bold">
        {
          title
        }
      </h3>

      <p className="mt-2 text-[9px] leading-5 text-[#667085]">
        {
          text
        }
      </p>
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              className="h-[135px] animate-pulse rounded-[14px] bg-white"
            />
          ),
        )}
      </div>


      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        <div className="h-[300px] animate-pulse rounded-[14px] bg-white" />

        <div className="h-[300px] animate-pulse rounded-[14px] bg-white" />
      </div>
    </>
  );
}


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

      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}
