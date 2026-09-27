"use client";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  CarFront,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Search,
  Settings,
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

const BRAND = "VEHNEXA";

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<UserPublic | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadAccount(
      accessToken: string,
    ) {
      try {
        const currentUser =
          await getCurrentUser(
            accessToken,
          );

        if (cancelled) {
          return;
        }

        setUser(currentUser);
        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (
          err instanceof ApiError &&
          (err.status === 401 ||
            err.status === 403)
        ) {
          removeAccessToken();
          router.replace("/login");
          return;
        }

        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load your account.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAccount(token);

    return () => {
      cancelled = true;
    };
  }, [router]);

  function logout() {
    removeAccessToken();

    router.replace(
      "/login",
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#e31b2d]" />

          <p className="mt-4 text-xs font-bold tracking-[0.18em] text-[#667085]">
            LOADING {BRAND}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-6">
        <div className="max-w-md rounded-xl border border-[#dfe3e8] bg-white p-8 text-center">
          <p className="text-sm text-[#667085]">
            {error ||
              "Unable to load your account."}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-md bg-[#e31b2d] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const fullName =
    `${user.first_name} ${user.last_name}`.trim();

  const initials =
    `${user.first_name?.[0] ?? ""}${
      user.last_name?.[0] ?? ""
    }`
      .toUpperCase()
      .trim() || "U";

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#101828]">
      <VehnexaNavbar
        initials={initials}
      />

      <section className="mx-auto max-w-[1320px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid overflow-hidden rounded-[10px] border border-[#dfe3e8] bg-white lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* ==================================================
              LEFT ACCOUNT SIDEBAR
          ================================================== */}

          <aside className="border-b border-[#e4e7ec] bg-[#fbfcfd] lg:min-h-[720px] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#e4e7ec] px-6 py-7">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e9edf2] text-base font-bold text-[#667085]">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#101828]">
                    {fullName}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-[#667085]">
                    {user.email}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-[#98a2b3]">
                Customer account
              </p>
            </div>

            <nav className="space-y-1 px-3 py-5">
              <SidebarButton
                icon={
                  <LayoutDashboard className="h-4 w-4" />
                }
                label="Overview"
              />

              <SidebarButton
                icon={
                  <Package className="h-4 w-4" />
                }
                label="Orders"
                active
              />

              <Link
                href="/account/garage"
                className="flex h-10 items-center gap-3 rounded-md px-3 text-[12px] font-medium text-[#475467] transition hover:bg-[#f2f4f7] hover:text-[#101828]"
              >
                <CarFront className="h-4 w-4 text-[#667085]" />

                My Vehicles
              </Link>

              <SidebarButton
                icon={
                  <MapPin className="h-4 w-4" />
                }
                label="Addresses"
              />

              <SidebarButton
                icon={
                  <CreditCard className="h-4 w-4" />
                }
                label="Payment Methods"
              />

              <SidebarButton
                icon={
                  <Settings className="h-4 w-4" />
                }
                label="Account Settings"
              />

              <Link
                href="/account/notifications"
                className="flex h-10 items-center gap-3 rounded-md px-3 text-[12px] font-medium text-[#475467] transition hover:bg-[#f2f4f7] hover:text-[#101828]"
              >
                <Bell className="h-4 w-4 text-[#667085]" />

                Notifications
              </Link>
            </nav>

            <div className="mt-auto border-t border-[#e4e7ec] px-4 py-5">
              <button
                type="button"
                onClick={logout}
                className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-[12px] font-medium text-[#667085] transition hover:bg-[#fff1f2] hover:text-[#e31b2d]"
              >
                <LogOut className="h-4 w-4" />

                Sign Out
              </button>
            </div>
          </aside>

          {/* ==================================================
              ORDERS CONTENT
          ================================================== */}

          <section className="min-w-0 bg-white">
            <div className="px-5 pt-7 sm:px-8 lg:px-10 lg:pt-9">
              <h1 className="text-[28px] font-bold tracking-[-0.035em] text-[#101828]">
                My Orders
              </h1>

              <p className="mt-1.5 text-[12px] text-[#667085]">
                View your purchase
                history and track your
                orders.
              </p>

              {/* ORDER TABS */}

              <div className="mt-7 overflow-x-auto border-b border-[#e4e7ec]">
                <div className="flex min-w-max gap-7">
                  <OrderTab
                    label="All Orders"
                    active
                  />

                  <OrderTab
                    label="Processing"
                  />

                  <OrderTab
                    label="Shipped"
                  />

                  <OrderTab
                    label="Delivered"
                  />

                  <OrderTab
                    label="Cancelled"
                  />
                </div>
              </div>
            </div>

            {/* EMPTY ORDERS STATE */}

            <div className="px-5 pb-12 pt-7 sm:px-8 lg:px-10">
              <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-[#e4e7ec] bg-[#fcfcfd] px-6 py-14">
                <div className="max-w-[420px] text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e4e7ec] bg-white">
                    <Package className="h-6 w-6 text-[#98a2b3]" />
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-[#101828]">
                    No orders yet
                  </h2>

                  <p className="mx-auto mt-2 max-w-[330px] text-[12px] leading-5 text-[#667085]">
                    When you place an
                    order, its status,
                    total and tracking
                    information will
                    appear here.
                  </p>

                  <Link
                    href="/shop"
                    className="mx-auto mt-6 flex h-10 w-fit items-center justify-center rounded-md bg-[#e31b2d] px-6 text-[12px] font-semibold text-white transition hover:bg-[#c81727]"
                  >
                    Browse Parts
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

/* ==========================================================
   VEHNEXA NAVBAR
========================================================== */

function VehnexaNavbar({
  initials,
}: {
  initials: string;
}) {
  return (
    <header className="border-b border-[#17293b] bg-[#071b2d]">
      <div className="mx-auto flex h-[64px] max-w-[1320px] items-center px-4 sm:px-6 lg:px-8">
        {/* LOGO */}

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
        >
          <VehnexaMark />

          <span className="text-[15px] font-bold tracking-[-0.02em] text-white">
            Vehnexa
          </span>
        </Link>

        {/* NAV */}

        <nav className="ml-10 hidden h-full items-center gap-7 lg:flex">
          <TopNavLink
            href="/shop"
            label="Shop"
          />

          <TopNavLink
            href="/account/garage"
            label="My Garage"
          />

          <TopNavLink
            href="/ai-mechanic"
            label="AI Mechanic"
          />

          <TopNavLink
            href="#resources"
            label="Resources"
          />
        </nav>

        {/* RIGHT ACTIONS */}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#c6d0da] transition hover:bg-white/5 hover:text-white"
          >
            <Search className="h-[17px] w-[17px]" />
          </button>

          <button
            type="button"
            aria-label="Cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-[#c6d0da] transition hover:bg-white/5 hover:text-white"
          >
            <ShoppingCart className="h-[17px] w-[17px]" />

            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e31b2d]" />
          </button>

          <NavbarNotificationBell />

          <Link
            href="/account"
            aria-label="Account"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-md text-[#c6d0da] transition hover:bg-white/5 hover:text-white"
          >
            <UserRound className="h-[17px] w-[17px]" />

            <span className="sr-only">
              {initials}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ==========================================================
   LOGO MARK
========================================================== */

function VehnexaMark() {
  return (
    <div
      aria-label={BRAND}
      className="relative h-7 w-7 shrink-0"
    >
      <span className="absolute left-[1px] top-[3px] block h-[22px] w-[10px] -skew-x-[25deg] rounded-[2px] bg-[#e31b2d]" />

      <span className="absolute right-[2px] top-[3px] block h-[22px] w-[10px] skew-x-[25deg] rounded-[2px] bg-[#d8dee5]" />

      <span className="sr-only">
        VEHNEXA
      </span>
    </div>
  );
}

/* ==========================================================
   TOP NAV ITEM
========================================================== */

function TopNavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-full items-center text-[11px] font-medium text-[#b9c5d0] transition hover:text-white"
    >
      {label}
    </Link>
  );
}

/* ==========================================================
   SIDEBAR ITEM
========================================================== */

function SidebarButton({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-[12px] font-medium transition ${
        active
          ? "bg-[#fff0f1] text-[#e31b2d]"
          : "text-[#475467] hover:bg-[#f2f4f7] hover:text-[#101828]"
      }`}
    >
      {active && (
        <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-r-full bg-[#e31b2d]" />
      )}

      <span
        className={
          active
            ? "text-[#e31b2d]"
            : "text-[#667085]"
        }
      >
        {icon}
      </span>

      {label}
    </button>
  );
}

/* ==========================================================
   ORDER TAB
========================================================== */

function OrderTab({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`relative pb-3 text-[11px] font-semibold transition ${
        active
          ? "text-[#e31b2d]"
          : "text-[#667085] hover:text-[#101828]"
      }`}
    >
      {label}

      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#e31b2d]" />
      )}
    </button>
  );
}