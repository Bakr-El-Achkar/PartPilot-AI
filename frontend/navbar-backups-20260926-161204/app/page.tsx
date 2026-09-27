"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  Bot,
  CarFront,
  Circle,
  Cog,
  Filter,
  Package,
  Search,
  ShoppingCart,
  UserRound,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  getCategories,
  type Category,
} from "@/lib/products";

import {
  CART_UPDATED_EVENT,
  getCartCount,
} from "@/lib/cart";


import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";


/* ============================================================
   HOME CATEGORY SHORTCUTS
============================================================ */

type HomeCategoryDefinition = {
  label: string;
  search: string;
  icon: LucideIcon;
};


const HOME_CATEGORIES: HomeCategoryDefinition[] = [
  {
    label: "Brake System",
    search: "brake",
    icon: Circle,
  },
  {
    label: "Filters",
    search: "filter",
    icon: Filter,
  },
  {
    label: "Engine Parts",
    search: "engine",
    icon: Cog,
  },
  {
    label: "Suspension",
    search: "suspension",
    icon: Wrench,
  },
  {
    label: "Electrical",
    search: "electrical",
    icon: Zap,
  },
  {
    label: "Body & Exterior",
    search: "body",
    icon: CarFront,
  },
];


/* ============================================================
   PAGE
============================================================ */

export default function HomePage() {
  const router =
    useRouter();


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    categories,
    setCategories,
  ] =
    useState<Category[]>([]);


  const [
    cartCount,
    setCartCount,
  ] =
    useState(0);


  /* ==========================================================
     CART
  ========================================================== */

  useEffect(() => {
    const updateCartCount =
      () => {
        setCartCount(
          getCartCount(),
        );
      };


    updateCartCount();


    window.addEventListener(
      CART_UPDATED_EVENT,
      updateCartCount,
    );


    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        updateCartCount,
      );
    };
  }, []);


  /* ==========================================================
     CATEGORIES

     Load real backend category IDs when possible.
     Home still works if catalog metadata is unavailable.
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;


    async function loadCategories() {
      try {
        const result =
          await getCategories();


        if (
          cancelled
        ) {
          return;
        }


        setCategories(
          result,
        );
      } catch {
        if (
          !cancelled
        ) {
          setCategories(
            [],
          );
        }
      }
    }


    void loadCategories();


    return () => {
      cancelled =
        true;
    };
  }, []);


  /* ==========================================================
     CATEGORY ROUTES
  ========================================================== */

  const categoryLinks =
    useMemo(() => {
      return HOME_CATEGORIES.map(
        (
          shortcut,
        ) => {
          const searchValue =
            shortcut.search
              .toLowerCase();


          const category =
            categories.find(
              (
                candidate,
              ) => {
                const name =
                  candidate.name
                    .toLowerCase();

                const slug =
                  candidate.slug
                    .toLowerCase();


                return (
                  name.includes(
                    searchValue,
                  ) ||
                  slug.includes(
                    searchValue,
                  )
                );
              },
            );


          return {
            ...shortcut,

            href:
              category
                ? `/shop?category_id=${encodeURIComponent(
                    category.id,
                  )}`
                : `/shop?search=${encodeURIComponent(
                    shortcut.search,
                  )}`,
          };
        },
      );
    }, [
      categories,
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


  function focusHeroSearch() {
    document
      .getElementById(
        "home-part-search",
      )
      ?.focus();
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#0f1720]">
      <HomeNavbar
        cartCount={
          cartCount
        }
        onSearch={
          focusHeroSearch
        }
      />


      <div className="mx-auto max-w-[1320px] px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="overflow-hidden rounded-[8px] border border-[#263d50] bg-[#081a2a] shadow-[0_3px_10px_rgba(15,23,42,0.08)]">
          <div
            className="relative min-h-[405px] overflow-hidden bg-[#071827] sm:min-h-[440px] lg:min-h-[455px]"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(4,18,31,.98) 0%, rgba(4,18,31,.92) 29%, rgba(4,18,31,.70) 50%, rgba(4,18,31,.22) 76%, rgba(4,18,31,.08) 100%), linear-gradient(0deg, rgba(3,15,26,.34), rgba(3,15,26,.05)), url("/images/partpilot-hero-car.jpg")',

              backgroundSize:
                "cover",

              backgroundPosition:
                "center 58%",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_87%_38%,rgba(227,27,45,.11),transparent_29%)]" />


            <div className="relative z-10 flex min-h-[405px] items-center px-6 py-12 sm:min-h-[440px] sm:px-9 lg:min-h-[455px] lg:px-12">
              <div className="w-full max-w-[625px]">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#f3414f]">
                  Keep your journey going
                </p>


                <h1 className="mt-4 text-[39px] font-extrabold leading-[0.98] tracking-[-0.04em] text-white sm:text-[48px] lg:text-[54px]">
                  Quality Parts.
                  <br />

                  Smarter Solutions.
                </h1>


                <p className="mt-5 max-w-[560px] text-[12px] leading-[1.7] text-[#d1d8df] sm:text-[13px]">
                  Shop top brands, manage your vehicles,
                  <br className="hidden sm:block" />

                  and get AI-powered diagnostics — all in one place.
                </p>


                <form
                  onSubmit={
                    submitSearch
                  }
                  className="mt-7 flex w-full max-w-[570px] overflow-hidden rounded-[5px] border border-white/20 bg-white shadow-[0_8px_24px_rgba(0,0,0,.25)]"
                >
                  <input
                    id="home-part-search"
                    type="search"
                    value={
                      search
                    }
                    onChange={(
                      event,
                    ) => {
                      setSearch(
                        event.target.value,
                      );
                    }}
                    placeholder="Search for parts, brands, or your problem..."
                    className="h-[50px] min-w-0 flex-1 bg-white px-4 text-[11px] text-[#344054] outline-none placeholder:text-[#98a2b3]"
                  />


                  <button
                    type="submit"
                    aria-label="Search parts"
                    className="flex h-[50px] w-[58px] shrink-0 items-center justify-center bg-[#e31b2d] text-white transition hover:bg-[#c91625]"
                  >
                    <Search className="h-[19px] w-[19px]" />
                  </button>
                </form>
              </div>
            </div>
          </div>


          {/* ==================================================
              BENEFIT STRIP
          ================================================== */}

          <div
            id="resources"
            className="grid border-t border-[#1c3448] bg-[#071b2d] sm:grid-cols-2 lg:grid-cols-4"
          >
            <FeatureItem
              icon={
                Wrench
              }
              title="Genuine & Aftermarket"
              secondLine="Parts"
            />


            <FeatureItem
              icon={
                Bot
              }
              title="AI-Powered"
              secondLine="Diagnosis"
            />


            <FeatureItem
              icon={
                CarFront
              }
              title="Manage"
              secondLine="Your Vehicles"
            />


            <FeatureItem
              icon={
                Package
              }
              title="Fast & Reliable"
              secondLine="Delivery"
            />
          </div>
        </section>


        {/* ====================================================
            CATEGORIES
        ==================================================== */}

        <section className="pt-7">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[18px] font-extrabold tracking-[-0.025em] text-[#101828] sm:text-[20px]">
              Shop by Category
            </h2>


            <Link
              href="/shop"
              className="text-[10px] font-bold text-[#e31b2d] transition hover:text-[#bd1422]"
            >
              View all →
            </Link>
          </div>


          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categoryLinks.map(
              (
                category,
              ) => {
                const Icon =
                  category.icon;


                return (
                  <Link
                    key={
                      category.label
                    }
                    href={
                      category.href
                    }
                    className="group flex min-h-[115px] flex-col items-center justify-center rounded-[7px] border border-[#dbe1e7] bg-white px-3 py-4 text-center transition hover:-translate-y-[1px] hover:border-[#c9d1d9] hover:shadow-[0_4px_12px_rgba(15,23,42,.06)]"
                  >
                    <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#f0f3f6] text-[#536171] transition group-hover:bg-[#fff0f1] group-hover:text-[#e31b2d]">
                      <Icon className="h-[24px] w-[24px]" />
                    </span>


                    <span className="mt-3 text-[10px] font-bold text-[#202b37]">
                      {
                        category.label
                      }
                    </span>
                  </Link>
                );
              },
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function HomeNavbar({
  cartCount,
  onSearch,
}: {
  cartCount:
    number;

  onSearch:
    () =>
      void;
}) {
  return (
    <header className="border-b border-[#142d41] bg-[#071b2d]">
      <div className="mx-auto flex h-[62px] max-w-[1320px] items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Vehnexa home"
        >
          <VehnexaLogo />


          <span className="text-[13px] font-extrabold tracking-[-0.025em] text-white">
            Vehnexa
          </span>
        </Link>


        <nav className="ml-9 hidden h-full items-center gap-7 lg:flex">
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


        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={
              onSearch
            }
            aria-label="Search parts"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#cfdae4] transition hover:bg-white/[0.06] hover:text-white"
          >
            <Search className="h-[15px] w-[15px]" />
          </button>


          <Link
            href="/cart"
            aria-label={`Cart with ${cartCount} items`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#cfdae4] transition hover:bg-white/[0.06] hover:text-white"
          >
            <ShoppingCart className="h-[15px] w-[15px]" />


            {cartCount >
              0 && (
              <span className="absolute right-[2px] top-[1px] flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#e31b2d] px-[3px] text-[7px] font-extrabold leading-none text-white">
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#cfdae4] transition hover:bg-white/[0.06] hover:text-white"
          >
            <UserRound className="h-[15px] w-[15px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}


/* ============================================================
   NAV LINK
============================================================ */

function TopNavLink({
  href,
  label,
}: {
  href:
    string;

  label:
    string;
}) {
  return (
    <Link
      href={
        href
      }
      className="flex h-full items-center text-[9px] font-medium text-[#c0ccd6] transition hover:text-white"
    >
      {
        label
      }
    </Link>
  );
}


/* ============================================================
   FEATURE STRIP ITEM
============================================================ */

function FeatureItem({
  icon:
    Icon,
  title,
  secondLine,
}: {
  icon:
    LucideIcon;

  title:
    string;

  secondLine:
    string;
}) {
  return (
    <div className="flex min-h-[82px] items-center justify-center gap-3 border-[#163247] px-4 py-4 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#354c60] bg-[#0d2639] text-[#ed3343]">
        <Icon className="h-[15px] w-[15px]" />
      </span>


      <div className="text-left">
        <p className="text-[8px] font-bold leading-[1.35] text-[#f2f5f7]">
          {
            title
          }
        </p>


        <p className="text-[8px] font-bold leading-[1.35] text-[#f2f5f7]">
          {
            secondLine
          }
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   VEH NEXA MARK
============================================================ */

function VehnexaLogo() {
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
