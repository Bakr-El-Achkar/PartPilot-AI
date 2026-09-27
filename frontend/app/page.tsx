"use client";

import PublicNavbarAuthActions from "@/components/customer/PublicNavbarAuthActions";

import Link from "next/link";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Boxes,
  CarFront,
  Check,
  ChevronRight,
  Circle,
  Cog,
  Filter,
  Gauge,
  Package,
  ScanSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
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


/* ============================================================
   CATEGORY SHORTCUTS
============================================================ */

type HomeCategoryDefinition = {
  label: string;
  search: string;
  description: string;
  icon: LucideIcon;
};


const HOME_CATEGORIES:
  HomeCategoryDefinition[] = [
    {
      label:
        "Brake System",

      search:
        "brake",

      description:
        "Pads, rotors, calipers and braking components.",

      icon:
        Circle,
    },

    {
      label:
        "Filters",

      search:
        "filter",

      description:
        "Keep every system breathing and flowing cleanly.",

      icon:
        Filter,
    },

    {
      label:
        "Engine Parts",

      search:
        "engine",

      description:
        "Core components engineered to keep you moving.",

      icon:
        Cog,
    },

    {
      label:
        "Suspension",

      search:
        "suspension",

      description:
        "Control, comfort and confidence on every road.",

      icon:
        Wrench,
    },

    {
      label:
        "Electrical",

      search:
        "electrical",

      description:
        "Sensors, charging and electrical essentials.",

      icon:
        Zap,
    },

    {
      label:
        "Body & Exterior",

      search:
        "body",

      description:
        "Exterior components for repair and restoration.",

      icon:
        CarFront,
    },
  ];


/* ============================================================
   PRODUCT EXPERIENCE PILLARS
============================================================ */

const EXPERIENCE_PILLARS = [
  {
    eyebrow:
      "01 / DISCOVER",

    title:
      "Find the right part faster.",

    description:
      "Search a focused automotive catalog with categories, brands, stock and pricing built into one clean marketplace.",

    icon:
      ScanSearch,
  },

  {
    eyebrow:
      "02 / MATCH",

    title:
      "Connect parts to your vehicle.",

    description:
      "Use My Garage to save your vehicle and narrow the catalog using Vehnexa compatibility data.",

    icon:
      CarFront,
  },

  {
    eyebrow:
      "03 / UNDERSTAND",

    title:
      "Turn symptoms into direction.",

    description:
      "Use the AI Mechanic experience to structure vehicle symptoms and investigate likely component areas.",

    icon:
      Bot,
  },

  {
    eyebrow:
      "04 / MOVE",

    title:
      "Go from discovery to order.",

    description:
      "Keep your marketplace journey connected from product research through cart, checkout and order history.",

    icon:
      Package,
  },
];


/* ============================================================
   HOME PAGE
============================================================ */

export default function HomePage() {
  const router =
    useRouter();


  const reduceMotion =
    useReducedMotion();


  const heroRef =
    useRef<HTMLElement | null>(
      null,
    );


  const {
    scrollYProgress:
      heroScrollProgress,
  } =
    useScroll({
      target:
        heroRef,

      offset: [
        "start start",
        "end start",
      ],
    });


  const heroImageY =
    useTransform(
      heroScrollProgress,
      [
        0,
        1,
      ],
      [
        0,
        90,
      ],
    );


  const heroImageScale =
    useTransform(
      heroScrollProgress,
      [
        0,
        1,
      ],
      [
        1.06,
        1.13,
      ],
    );


  const heroContentY =
    useTransform(
      heroScrollProgress,
      [
        0,
        1,
      ],
      [
        0,
        55,
      ],
    );


  const heroContentOpacity =
    useTransform(
      heroScrollProgress,
      [
        0,
        0.75,
      ],
      [
        1,
        0.35,
      ],
    );


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    categories,
    setCategories,
  ] =
    useState<Category[]>(
      [],
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

     Preserve real backend category IDs.
     Home remains usable if category metadata is unavailable.
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
     REAL CATEGORY ROUTES
  ========================================================== */

  const categoryLinks =
    useMemo(
      () => {
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
      },
      [
        categories,
      ],
    );


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


  function quickSearch(
    value: string,
  ) {
    router.push(
      `/shop?search=${encodeURIComponent(
        value,
      )}`,
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f5f7] text-[#0f1720]">
      <HomeNavbar
        cartCount={
          cartCount
        }
        onSearch={
          focusHeroSearch
        }
      />


      {/* ======================================================
          HERO
      ====================================================== */}

      <motion.section
        ref={
          heroRef
        }
        className="relative isolate min-h-[760px] overflow-hidden bg-[#041522] lg:min-h-[820px]"
      >
        {/* Background image */}
        <motion.div
          aria-hidden="true"
          className="absolute -inset-[6%]"
          style={{
            y:
              reduceMotion
                ? 0
                : heroImageY,

            scale:
              reduceMotion
                ? 1.06
                : heroImageScale,

            backgroundImage:
              'url("/images/partpilot-hero-car.jpg")',

            backgroundSize:
              "cover",

            backgroundPosition:
              "center 58%",
          }}
        />


        {/* Cinematic gradients */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,16,28,.995)_0%,rgba(3,16,28,.97)_29%,rgba(3,16,28,.78)_49%,rgba(3,16,28,.38)_68%,rgba(3,16,28,.18)_100%)]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,12,22,.08)_0%,rgba(2,12,22,.10)_52%,rgba(2,12,22,.92)_100%)]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_76%_37%,rgba(227,27,45,.20),transparent_30%)]"
        />


        {/* Animated red light */}
        <motion.div
          aria-hidden="true"
          className="absolute right-[8%] top-[18%] h-[330px] w-[330px] rounded-full bg-[#e31b2d]/10 blur-[100px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [
                    1,
                    1.22,
                    1,
                  ],

                  opacity: [
                    0.35,
                    0.7,
                    0.35,
                  ],
                }
          }
          transition={{
            duration:
              7,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          }}
        />


        {/* Thin technical grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.075] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:72px_72px]"
        />


        {/* Decorative rings */}
        <motion.div
          aria-hidden="true"
          className="absolute -right-[180px] top-[90px] h-[560px] w-[560px] rounded-full border border-white/[0.08]"
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate:
                    360,
                }
          }
          transition={{
            duration:
              40,

            repeat:
              Infinity,

            ease:
              "linear",
          }}
        >
          <div className="absolute inset-[62px] rounded-full border border-[#e31b2d]/15" />

          <div className="absolute inset-[132px] rounded-full border border-white/[0.06]" />
        </motion.div>


        <motion.div
          className="relative z-10 mx-auto flex min-h-[690px] max-w-[1320px] items-center px-4 pb-28 pt-20 sm:px-6 lg:min-h-[745px] lg:px-8"
          style={{
            y:
              reduceMotion
                ? 0
                : heroContentY,

            opacity:
              reduceMotion
                ? 1
                : heroContentOpacity,
          }}
        >
          <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
            {/* Left content */}
            <div className="max-w-[760px]">
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity:
                          0,

                        y:
                          20,
                      }
                }
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  duration:
                    0.65,

                  ease:
                    "easeOut",
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff4857] opacity-50" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f33142]" />
                </span>

                <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#f7c7cc]">
                  Automotive intelligence,
                  built around your journey
                </span>
              </motion.div>


              <div className="mt-7 overflow-hidden">
                <motion.h1
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity:
                            0,

                          y:
                            65,
                        }
                  }
                  animate={{
                    opacity:
                      1,

                    y:
                      0,
                  }}
                  transition={{
                    delay:
                      0.08,

                    duration:
                      0.9,

                    ease:
                      "easeOut",
                  }}
                  className="text-[52px] font-black leading-[0.90] tracking-[-0.062em] text-white sm:text-[70px] lg:text-[86px]"
                >
                  Quality Parts.
                </motion.h1>
              </div>


              <div className="overflow-hidden pb-2">
                <motion.h2
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity:
                            0,

                          y:
                            72,
                        }
                  }
                  animate={{
                    opacity:
                      1,

                    y:
                      0,
                  }}
                  transition={{
                    delay:
                      0.18,

                    duration:
                      0.9,

                    ease:
                      "easeOut",
                  }}
                  className="text-[52px] font-black leading-[0.90] tracking-[-0.062em] text-white sm:text-[70px] lg:text-[86px]"
                >
                  Smarter{" "}

                  <span className="relative inline-block text-[#ff3547]">
                    Solutions.

                    <motion.span
                      aria-hidden="true"
                      initial={{
                        scaleX:
                          0,
                      }}
                      animate={{
                        scaleX:
                          1,
                      }}
                      transition={{
                        delay:
                          0.8,

                        duration:
                          0.8,

                        ease:
                          "easeOut",
                      }}
                      className="absolute -bottom-2 left-0 h-[3px] w-full origin-left bg-gradient-to-r from-[#e31b2d] via-[#ff4b5b] to-transparent"
                    />
                  </span>
                </motion.h2>
              </div>


              <motion.p
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity:
                          0,

                        y:
                          20,
                      }
                }
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.34,

                  duration:
                    0.7,
                }}
                className="mt-8 max-w-[650px] text-[14px] leading-[1.9] text-[#c8d2db] sm:text-[16px]"
              >
                Search quality automotive parts,
                manage the vehicles that matter
                to you, and use AI-assisted
                diagnostics to move from a
                symptom to a smarter next step.
              </motion.p>


              {/* Hero Search */}
              <motion.form
                onSubmit={
                  submitSearch
                }
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity:
                          0,

                        y:
                          24,

                        scale:
                          0.98,
                      }
                }
                animate={{
                  opacity:
                    1,

                  y:
                    0,

                  scale:
                    1,
                }}
                transition={{
                  delay:
                    0.48,

                  duration:
                    0.7,
                }}
                className="group relative mt-9 flex w-full max-w-[690px] overflow-hidden rounded-[11px] border border-white/20 bg-white shadow-[0_24px_70px_rgba(0,0,0,.32)]"
              >
                <div className="flex h-[64px] w-[58px] shrink-0 items-center justify-center text-[#98a2b3]">
                  <Search className="h-[19px] w-[19px]" />
                </div>


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
                  placeholder="Search parts, brands, components, or a vehicle problem..."
                  className="h-[64px] min-w-0 flex-1 bg-white pr-4 text-[12px] font-medium text-[#25303b] outline-none placeholder:text-[#98a2b3] sm:text-[13px]"
                />


                <motion.button
                  type="submit"
                  aria-label="Search parts"
                  whileHover={
                    reduceMotion
                      ? undefined
                      : {
                          scale:
                            1.035,
                      }
                  }
                  whileTap={
                    reduceMotion
                      ? undefined
                      : {
                          scale:
                            0.97,
                      }
                  }
                  className="m-1.5 flex w-[112px] shrink-0 items-center justify-center gap-2 rounded-[8px] bg-[#e31b2d] text-[10px] font-bold text-white transition hover:bg-[#c91625]"
                >
                  Search

                  <ArrowRight className="h-3.5 w-3.5" />
                </motion.button>
              </motion.form>


              {/* Quick searches */}
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity:
                          0,
                      }
                }
                animate={{
                  opacity:
                    1,
                }}
                transition={{
                  delay:
                    0.7,

                  duration:
                    0.7,
                }}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <span className="mr-1 text-[8px] font-bold uppercase tracking-[0.13em] text-[#8192a1]">
                  Quick search
                </span>


                {[
                  "brake",
                  "filter",
                  "suspension",
                  "electrical",
                ].map(
                  (
                    term,
                  ) => (
                    <button
                      key={
                        term
                      }
                      type="button"
                      onClick={() =>
                        quickSearch(
                          term,
                        )
                      }
                      className="rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-1.5 text-[8px] font-semibold capitalize text-[#c5d0da] backdrop-blur transition hover:border-[#e31b2d]/40 hover:bg-[#e31b2d]/10 hover:text-white"
                    >
                      {
                        term
                      }
                    </button>
                  ),
                )}
              </motion.div>
            </div>


            {/* Right intelligence card */}
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity:
                        0,

                      x:
                        55,

                      rotateY:
                        -8,
                    }
              }
              animate={{
                opacity:
                  1,

                x:
                  0,

                rotateY:
                  0,
              }}
              transition={{
                delay:
                  0.42,

                duration:
                  0.9,

                ease:
                  "easeOut",
              }}
              className="hidden lg:block"
            >
              <div className="relative">
                <motion.div
                  aria-hidden="true"
                  className="absolute -inset-5 rounded-[32px] bg-[#e31b2d]/10 blur-[38px]"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: [
                            0.3,
                            0.7,
                            0.3,
                          ],
                      }
                  }
                  transition={{
                    duration:
                      5,

                    repeat:
                      Infinity,

                    ease:
                      "easeInOut",
                  }}
                />


                <div className="relative overflow-hidden rounded-[18px] border border-white/[0.13] bg-[#081d2d]/80 p-5 shadow-[0_35px_90px_rgba(0,0,0,.35)] backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#7f93a5]">
                        VEH NEXA SYSTEM
                      </p>

                      <p className="mt-1 text-[13px] font-bold text-white">
                        One connected automotive journey
                      </p>
                    </div>


                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              rotate: [
                                0,
                                360,
                              ],
                            }
                      }
                      transition={{
                        duration:
                          12,

                        repeat:
                          Infinity,

                        ease:
                          "linear",
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ef3d43]/30 bg-[#ef3d43]/10 text-[#ff4d5c]"
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                  </div>


                  <div className="mt-7 space-y-3">
                    <SystemRow
                      number="01"
                      icon={
                        ScanSearch
                      }
                      title="Search the marketplace"
                      active
                    />

                    <SystemRow
                      number="02"
                      icon={
                        CarFront
                      }
                      title="Match your garage"
                    />

                    <SystemRow
                      number="03"
                      icon={
                        Bot
                      }
                      title="Investigate with AI"
                    />

                    <SystemRow
                      number="04"
                      icon={
                        Package
                      }
                      title="Track your order"
                    />
                  </div>


                  <div className="mt-6 overflow-hidden rounded-[10px] border border-white/[0.08] bg-black/15 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#788b9c]">
                        Connected experience
                      </span>

                      <span className="flex items-center gap-1 text-[8px] font-bold text-[#56d49b]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#56d49b]" />

                        Ready
                      </span>
                    </div>


                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                      <motion.div
                        initial={{
                          scaleX:
                            0,
                        }}
                        animate={{
                          scaleX:
                            1,
                        }}
                        transition={{
                          delay:
                            1,

                          duration:
                            1.4,

                          ease:
                            "easeOut",
                        }}
                        className="h-full origin-left bg-gradient-to-r from-[#e31b2d] via-[#ff5260] to-[#ff9ba3]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>


        {/* ====================================================
            HERO BENEFIT STRIP
        ==================================================== */}

        <div
          id="resources"
          className="absolute inset-x-0 bottom-0 z-20 border-t border-white/[0.08] bg-[#051827]/90 backdrop-blur-xl"
        >
          <div className="mx-auto grid max-w-[1320px] sm:grid-cols-2 lg:grid-cols-4">
            <FeatureItem
              delay={
                0
              }
              icon={
                Wrench
              }
              title="Genuine & Aftermarket"
              secondLine="Parts"
            />

            <FeatureItem
              delay={
                0.08
              }
              icon={
                Bot
              }
              title="AI-Powered"
              secondLine="Diagnosis"
            />

            <FeatureItem
              delay={
                0.16
              }
              icon={
                CarFront
              }
              title="Manage"
              secondLine="Your Vehicles"
            />

            <FeatureItem
              delay={
                0.24
              }
              icon={
                Package
              }
              title="Fast & Reliable"
              secondLine="Delivery"
            />
          </div>
        </div>
      </motion.section>


      {/* ======================================================
          CATEGORY EXPERIENCE
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#f3f5f7] px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <div
          aria-hidden="true"
          className="absolute -left-[220px] top-[140px] h-[450px] w-[450px] rounded-full bg-[#e31b2d]/[0.045] blur-[90px]"
        />


        <div className="relative mx-auto max-w-[1320px]">
          <SectionIntro
            eyebrow="MARKETPLACE"
            title="Find your part without the noise."
            description="Start with the system you are working on, then narrow the marketplace using Vehnexa's catalog filters and search."
            actionHref="/shop"
            actionLabel="Explore all parts"
          />


          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryLinks.map(
              (
                category,
                index,
              ) => {
                const Icon =
                  category.icon;


                return (
                  <motion.div
                    key={
                      category.label
                    }
                    initial={
                      reduceMotion
                        ? false
                        : {
                            y:
                              28,

                            scale:
                              0.985,
                          }
                    }
                    whileInView={{
                      y:
                        0,

                      scale:
                        1,
                    }}
                    viewport={{
                      once:
                        true,

                      amount:
                        0.22,
                    }}
                    transition={{
                      delay:
                        index *
                        0.055,

                      duration:
                        0.55,

                      ease:
                        "easeOut",
                    }}
                  >
                    <Link
                      href={
                        category.href
                      }
                      className="group relative flex min-h-[230px] overflow-hidden rounded-[18px] border border-[#dce2e7] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.035)] transition duration-500 hover:-translate-y-2 hover:border-[#cbd3db] hover:shadow-[0_26px_60px_rgba(15,23,42,.10)]"
                    >
                      <div className="absolute -right-20 -top-20 h-[190px] w-[190px] rounded-full border border-[#e31b2d]/0 transition duration-500 group-hover:border-[#e31b2d]/10" />

                      <div className="absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-[#e31b2d]/0 blur-[28px] transition duration-500 group-hover:bg-[#e31b2d]/10" />


                      <div className="relative flex w-full flex-col">
                        <div className="flex items-start justify-between">
                          <span className="flex h-14 w-14 items-center justify-center rounded-[13px] border border-[#e3e7eb] bg-[#f5f7f9] text-[#4f6070] transition duration-500 group-hover:rotate-[-4deg] group-hover:border-[#f1c6ca] group-hover:bg-[#fff0f2] group-hover:text-[#e31b2d]">
                            <Icon className="h-6 w-6" />
                          </span>


                          <span className="flex h-9 w-9 translate-x-2 -translate-y-2 items-center justify-center rounded-full border border-[#e4e7eb] text-[#98a2b3] opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:border-[#e31b2d] group-hover:bg-[#e31b2d] group-hover:text-white group-hover:opacity-100">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>


                        <div className="mt-auto pt-8">
                          <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#98a2b3]">
                            Vehicle system
                          </p>

                          <h3 className="mt-2 text-[19px] font-extrabold tracking-[-0.03em] text-[#101828]">
                            {
                              category.label
                            }
                          </h3>

                          <p className="mt-2 max-w-[270px] text-[10px] leading-5 text-[#667085]">
                            {
                              category.description
                            }
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              },
            )}
          </div>
        </div>
      </section>


      {/* ======================================================
          CONNECTED EXPERIENCE
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061827] px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:80px_80px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[240px] -top-[120px] h-[650px] w-[650px] rounded-full bg-[#e31b2d]/10 blur-[120px]"
        />


        <div className="relative mx-auto max-w-[1320px]">
          <div className="grid gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <Reveal>
              <div className="lg:sticky lg:top-[110px]">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f14a57]">
                  ONE CONNECTED EXPERIENCE
                </p>


                <h2 className="mt-5 max-w-[520px] text-[42px] font-black leading-[0.98] tracking-[-0.05em] sm:text-[55px] lg:text-[64px]">
                  More than a parts catalog.
                </h2>


                <p className="mt-7 max-w-[500px] text-[12px] leading-6 text-[#aebbc6] sm:text-[13px]">
                  Vehnexa connects discovery,
                  vehicle context, diagnostics
                  and purchasing into one
                  continuous customer journey.
                </p>


                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    href="/shop"
                    className="group inline-flex h-11 items-center gap-2 rounded-[7px] bg-[#e31b2d] px-5 text-[9px] font-bold text-white transition hover:bg-[#c91625]"
                  >
                    Browse marketplace

                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </Link>


                  <Link
                    href="/ai-mechanic"
                    className="inline-flex h-11 items-center gap-2 rounded-[7px] border border-white/15 bg-white/[0.04] px-5 text-[9px] font-bold text-[#e5ebf0] transition hover:bg-white/[0.08]"
                  >
                    <Bot className="h-3.5 w-3.5" />

                    Open AI Mechanic
                  </Link>
                </div>
              </div>
            </Reveal>


            <div className="space-y-4">
              {EXPERIENCE_PILLARS.map(
                (
                  item,
                  index,
                ) => {
                  const Icon =
                    item.icon;


                  return (
                    <motion.div
                      key={
                        item.eyebrow
                      }
                      initial={
                        reduceMotion
                          ? false
                          : {
                              x:
                                38,

                              scale:
                                0.99,
                            }
                      }
                      whileInView={{
                        x:
                          0,

                        scale:
                          1,
                      }}
                      viewport={{
                        once:
                          true,

                        amount:
                          0.3,
                      }}
                      transition={{
                        delay:
                          index *
                          0.07,

                        duration:
                          0.65,
                      }}
                      whileHover={
                        reduceMotion
                          ? undefined
                          : {
                              x:
                                -8,
                          }
                      }
                      className="group relative overflow-hidden rounded-[17px] border border-white/[0.09] bg-white/[0.045] p-6 backdrop-blur-sm transition hover:border-[#e31b2d]/35 hover:bg-white/[0.07] sm:p-7"
                    >
                      <div className="absolute inset-y-0 left-0 w-[3px] origin-bottom scale-y-0 bg-[#e31b2d] transition duration-500 group-hover:scale-y-100" />


                      <div className="grid gap-5 sm:grid-cols-[58px_1fr_auto] sm:items-center">
                        <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[12px] border border-white/[0.10] bg-black/10 text-[#ff4858] transition duration-300 group-hover:border-[#e31b2d]/35 group-hover:bg-[#e31b2d]/10">
                          <Icon className="h-5 w-5" />
                        </div>


                        <div>
                          <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#6f8496]">
                            {
                              item.eyebrow
                            }
                          </p>

                          <h3 className="mt-2 text-[19px] font-bold tracking-[-0.025em] text-white">
                            {
                              item.title
                            }
                          </h3>

                          <p className="mt-2 max-w-[600px] text-[10px] leading-5 text-[#9fafbc]">
                            {
                              item.description
                            }
                          </p>
                        </div>


                        <ChevronRight className="hidden h-5 w-5 text-[#536a7c] transition duration-300 group-hover:translate-x-1 group-hover:text-[#ff4858] sm:block" />
                      </div>
                    </motion.div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </section>


      {/* ======================================================
          GARAGE + AI SPOTLIGHT
      ====================================================== */}

      <section className="bg-[#f3f5f7] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <SectionIntro
            eyebrow="VEHICLE INTELLIGENCE"
            title="Your vehicle becomes part of the experience."
            description="Save your vehicle in My Garage, use it as context when browsing compatible products, and carry that context into Vehnexa's diagnostic workflow."
          />


          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {/* Garage */}
            <Reveal>
              <Link
                href="/account/garage"
                className="group relative flex min-h-[470px] overflow-hidden rounded-[22px] border border-[#d7dee5] bg-[#071b2d] p-7 text-white shadow-[0_16px_50px_rgba(15,23,42,.10)] sm:p-9"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(54,130,196,.22),transparent_38%)]" />

                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:52px_52px]" />


                <motion.div
                  aria-hidden="true"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          y: [
                            0,
                            -10,
                            0,
                          ],
                        }
                  }
                  transition={{
                    duration:
                      5,

                    repeat:
                      Infinity,

                    ease:
                      "easeInOut",
                  }}
                  className="absolute bottom-[-60px] right-[-60px] flex h-[310px] w-[310px] items-center justify-center rounded-full border border-white/[0.08]"
                >
                  <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full border border-[#54a2de]/15">
                    <CarFront className="h-24 w-24 text-[#8bc3ec]/20" />
                  </div>
                </motion.div>


                <div className="relative z-10 flex w-full flex-col">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[#63a9de]/20 bg-[#4a98d2]/10 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#9ed0f4]">
                      MY GARAGE
                    </span>

                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.10] text-[#a9bdcd] transition group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:text-white">
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>


                  <div className="mt-auto max-w-[420px]">
                    <h3 className="text-[34px] font-black leading-[1.02] tracking-[-0.045em] sm:text-[42px]">
                      Put your vehicle at the center.
                    </h3>

                    <p className="mt-5 text-[11px] leading-6 text-[#9fb2c1]">
                      Save vehicles, select an
                      active vehicle and use that
                      context to make marketplace
                      compatibility more useful.
                    </p>


                    <div className="mt-7 flex items-center gap-2 text-[9px] font-bold text-[#dce6ed]">
                      <BadgeCheck className="h-4 w-4 text-[#65c99a]" />

                      Garage-aware marketplace context
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>


            {/* AI */}
            <Reveal
              delay={
                0.1
              }
            >
              <Link
                href="/ai-mechanic"
                className="group relative flex min-h-[470px] overflow-hidden rounded-[22px] border border-[#ead6d8] bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,.08)] sm:p-9"
              >
                <div className="absolute -right-[110px] -top-[90px] h-[340px] w-[340px] rounded-full bg-[#e31b2d]/[0.07] blur-[55px]" />


                <div className="relative z-10 flex w-full flex-col">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[#f0c9cd] bg-[#fff2f3] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#cf2636]">
                      AI MECHANIC
                    </span>

                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e3e7eb] text-[#7d8a96] transition group-hover:border-[#e31b2d] group-hover:bg-[#e31b2d] group-hover:text-white">
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>


                  <div className="mt-8 rounded-[16px] border border-[#e5e9ed] bg-[#f8fafb] p-5">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={
                          reduceMotion
                            ? undefined
                            : {
                                scale: [
                                  1,
                                  1.08,
                                  1,
                                ],
                              }
                        }
                        transition={{
                          duration:
                            2.4,

                          repeat:
                            Infinity,
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#071b2d] text-white"
                      >
                        <Bot className="h-4 w-4" />
                      </motion.div>


                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">
                          Diagnostic workflow
                        </p>

                        <p className="mt-1 text-[10px] font-bold text-[#344054]">
                          Structured symptom analysis
                        </p>
                      </div>
                    </div>


                    <div className="mt-5 space-y-2">
                      {[
                        "Vehicle context",
                        "Symptoms",
                        "Possible causes",
                        "Suggested components",
                      ].map(
                        (
                          label,
                          index,
                        ) => (
                          <div
                            key={
                              label
                            }
                            className="flex items-center gap-3 rounded-[9px] border border-[#e8ebef] bg-white px-3 py-3"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff0f1] text-[8px] font-black text-[#e31b2d]">
                              {
                                index +
                                1
                              }
                            </span>

                            <span className="text-[9px] font-semibold text-[#596775]">
                              {
                                label
                              }
                            </span>

                            <Check className="ml-auto h-3.5 w-3.5 text-[#52a77b]" />
                          </div>
                        ),
                      )}
                    </div>
                  </div>


                  <div className="mt-auto pt-8">
                    <h3 className="text-[32px] font-black leading-[1.02] tracking-[-0.045em] text-[#101828] sm:text-[40px]">
                      Give the problem structure.
                    </h3>

                    <p className="mt-4 max-w-[440px] text-[11px] leading-6 text-[#667085]">
                      Move from an unclear vehicle
                      symptom toward a structured
                      diagnostic conversation and
                      relevant component areas.
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>


      {/* ======================================================
          HOW IT FLOWS
      ====================================================== */}

      <section className="relative overflow-hidden bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <Reveal>
            <div className="mx-auto max-w-[760px] text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#e31b2d]">
                BUILT FOR THE WHOLE JOURNEY
              </p>

              <h2 className="mt-5 text-[38px] font-black leading-[1.02] tracking-[-0.048em] text-[#101828] sm:text-[52px]">
                From “something feels wrong”
                to the part you need.
              </h2>

              <p className="mx-auto mt-6 max-w-[620px] text-[11px] leading-6 text-[#667085]">
                Vehnexa is designed so each
                customer tool feeds naturally
                into the next instead of feeling
                like a collection of disconnected
                screens.
              </p>
            </div>
          </Reveal>


          <div className="relative mt-16 grid gap-5 lg:grid-cols-3">
            <div
              aria-hidden="true"
              className="absolute left-[16%] right-[16%] top-[37px] hidden h-px bg-gradient-to-r from-transparent via-[#d9dee4] to-transparent lg:block"
            />


            <JourneyStep
              index="01"
              icon={
                ScanSearch
              }
              title="Discover"
              description="Search the public marketplace by part, system, brand or problem."
              delay={
                0
              }
            />

            <JourneyStep
              index="02"
              icon={
                Gauge
              }
              title="Add context"
              description="Use your garage and diagnostic workflow when you need a more vehicle-specific journey."
              delay={
                0.1
              }
            />

            <JourneyStep
              index="03"
              icon={
                Boxes
              }
              title="Move forward"
              description="Add the right product to your cart and continue through checkout and order tracking."
              delay={
                0.2
              }
            />
          </div>
        </div>
      </section>


      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section className="bg-[#f3f5f7] px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-32">
        <Reveal>
          <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[24px] bg-[#071b2d] px-6 py-14 text-white shadow-[0_30px_90px_rgba(7,27,45,.18)] sm:px-10 lg:px-14 lg:py-16">
            <div
              aria-hidden="true"
              className="absolute -right-[140px] -top-[160px] h-[500px] w-[500px] rounded-full bg-[#e31b2d]/15 blur-[100px]"
            />

            <motion.div
              aria-hidden="true"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: [
                        -20,
                        20,
                        -20,
                      ],

                      opacity: [
                        0.25,
                        0.55,
                        0.25,
                      ],
                    }
              }
              transition={{
                duration:
                  8,

                repeat:
                  Infinity,

                ease:
                  "easeInOut",
              }}
              className="absolute bottom-[-120px] left-[15%] h-[300px] w-[520px] rotate-[-10deg] bg-gradient-to-r from-transparent via-[#e31b2d]/15 to-transparent blur-[55px]"
            />


            <div className="relative grid gap-9 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-[760px]">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff5765]">
                  READY WHEN YOU ARE
                </p>

                <h2 className="mt-4 text-[38px] font-black leading-[0.98] tracking-[-0.05em] sm:text-[52px]">
                  Build a smarter path
                  around your vehicle.
                </h2>

                <p className="mt-5 max-w-[590px] text-[11px] leading-6 text-[#aebbc6]">
                  Explore the marketplace now.
                  Sign in when you are ready to
                  save vehicles, use personalized
                  features, add products to your
                  cart and manage orders.
                </p>
              </div>


              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/shop"
                  className="group inline-flex h-12 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-6 text-[10px] font-bold text-white transition hover:bg-[#c91625]"
                >
                  Explore parts

                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>


                <Link
                  href="/account/garage"
                  className="inline-flex h-12 items-center gap-2 rounded-[8px] border border-white/15 bg-white/[0.05] px-6 text-[10px] font-bold text-white transition hover:bg-white/[0.09]"
                >
                  <CarFront className="h-4 w-4" />

                  My Garage
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-[#122d42] bg-[#051725] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <VehnexaLogo />

            <div>
              <p className="text-[12px] font-extrabold tracking-[-0.02em]">
                Vehnexa
              </p>

              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.15em] text-[#718698]">
                Automotive Intelligence
              </p>
            </div>
          </Link>


          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[8px] font-semibold text-[#8296a7]">
            <Link
              href="/shop"
              className="transition hover:text-white"
            >
              Marketplace
            </Link>

            <Link
              href="/account/garage"
              className="transition hover:text-white"
            >
              My Garage
            </Link>

            <Link
              href="/ai-mechanic"
              className="transition hover:text-white"
            >
              AI Mechanic
            </Link>

            <Link
              href="/orders"
              className="transition hover:text-white"
            >
              Orders
            </Link>
          </div>


          <p className="text-[7px] uppercase tracking-[0.10em] text-[#607587]">
            Vehnexa
          </p>
        </div>
      </footer>
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
    <motion.header
      initial={{
        y:
          -70,
      }}
      animate={{
        y:
          0,
      }}
      transition={{
        duration:
          0.65,

        ease:
          "easeOut",
      }}
      className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#061827]/95 shadow-[0_8px_30px_rgba(0,0,0,.08)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[66px] max-w-[1320px] items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Vehnexa home"
        >
          <motion.div
            whileHover={{
              rotate:
                -4,

              scale:
                1.05,
            }}
          >
            <VehnexaLogo />
          </motion.div>


          <span className="text-[13px] font-extrabold tracking-[-0.025em] text-white">
            Vehnexa
          </span>
        </Link>


        <nav className="ml-10 hidden h-full items-center gap-8 lg:flex">
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


        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={
              onSearch
            }
            aria-label="Search parts"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#c8d3dc] transition hover:bg-white/[0.06] hover:text-white"
          >
            <Search className="h-[15px] w-[15px]" />
          </button>


          <Link
            href="/cart"
            aria-label={`Cart with ${cartCount} items`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#c8d3dc] transition hover:bg-white/[0.06] hover:text-white"
          >
            <ShoppingCart className="h-[15px] w-[15px]" />


            {cartCount >
              0 && (
              <motion.span
                initial={{
                  scale:
                    0,
                }}
                animate={{
                  scale:
                    1,
                }}
                className="absolute right-[1px] top-[0px] flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#e31b2d] px-[3px] text-[7px] font-extrabold leading-none text-white"
              >
                {cartCount >
                99
                  ? "99+"
                  : cartCount}
              </motion.span>
            )}
          </Link>


          <PublicNavbarAuthActions />
        </div>
      </div>
    </motion.header>
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
      className="group relative flex h-full items-center text-[9px] font-semibold text-[#bcc9d3] transition hover:text-white"
    >
      {
        label
      }

      <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[#e31b2d] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}


/* ============================================================
   FEATURE STRIP
============================================================ */

function FeatureItem({
  icon:
    Icon,
  title,
  secondLine,
  delay,
}: {
  icon:
    LucideIcon;

  title:
    string;

  secondLine:
    string;

  delay:
    number;
}) {
  return (
    <motion.div
      initial={{
        opacity:
          0,

        y:
          18,
      }}
      animate={{
        opacity:
          1,

        y:
          0,
      }}
      transition={{
        delay:
          0.85 +
          delay,

        duration:
          0.55,
      }}
      className="group flex min-h-[92px] items-center justify-center gap-3 border-[#183449] px-4 py-4 transition hover:bg-white/[0.025] sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#354c60] bg-[#0d2639] text-[#ed3343] transition duration-300 group-hover:scale-110 group-hover:border-[#e31b2d]/50 group-hover:bg-[#e31b2d]/10">
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
    </motion.div>
  );
}


/* ============================================================
   SYSTEM ROW
============================================================ */

function SystemRow({
  number,
  icon:
    Icon,
  title,
  active =
    false,
}: {
  number:
    string;

  icon:
    LucideIcon;

  title:
    string;

  active?:
    boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex items-center gap-3 rounded-[10px] border border-[#e31b2d]/25 bg-[#e31b2d]/10 px-3 py-3"
          : "flex items-center gap-3 rounded-[10px] border border-white/[0.07] bg-black/10 px-3 py-3"
      }
    >
      <span
        className={
          active
            ? "text-[7px] font-black text-[#ff5c69]"
            : "text-[7px] font-black text-[#53697a]"
        }
      >
        {
          number
        }
      </span>


      <span
        className={
          active
            ? "flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#e31b2d] text-white"
            : "flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/[0.08] text-[#718798]"
        }
      >
        <Icon className="h-3.5 w-3.5" />
      </span>


      <span
        className={
          active
            ? "text-[9px] font-bold text-white"
            : "text-[9px] font-semibold text-[#8da0af]"
        }
      >
        {
          title
        }
      </span>


      {active && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#56c88f]/15 text-[#6ee0a8]">
          <Check className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}


/* ============================================================
   SECTION INTRO
============================================================ */

function SectionIntro({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow:
    string;

  title:
    string;

  description:
    string;

  actionHref?:
    string;

  actionLabel?:
    string;
}) {
  return (
    <Reveal>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[760px]">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#e31b2d]">
            {
              eyebrow
            }
          </p>

          <h2 className="mt-4 text-[38px] font-black leading-[1.01] tracking-[-0.05em] text-[#101828] sm:text-[50px]">
            {
              title
            }
          </h2>

          <p className="mt-5 max-w-[650px] text-[11px] leading-6 text-[#667085]">
            {
              description
            }
          </p>
        </div>


        {actionHref &&
          actionLabel && (
          <Link
            href={
              actionHref
            }
            className="group inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-[7px] border border-[#d7dde3] bg-white px-4 text-[9px] font-bold text-[#344054] transition hover:border-[#e31b2d]/30 hover:text-[#e31b2d] lg:self-auto"
          >
            {
              actionLabel
            }

            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </Reveal>
  );
}


/* ============================================================
   JOURNEY STEP
============================================================ */

function JourneyStep({
  index,
  icon:
    Icon,
  title,
  description,
  delay,
}: {
  index:
    string;

  icon:
    LucideIcon;

  title:
    string;

  description:
    string;

  delay:
    number;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
    <motion.div
      initial={
        reduceMotion
          ? false
          : {
              y:
                30,

              scale:
                0.992,
            }
      }
      whileInView={{
        y:
          0,

        scale:
          1,
      }}
      viewport={{
        once:
          true,

        amount:
          0.3,
      }}
      transition={{
        delay,
        duration:
          0.6,
      }}
      className="relative rounded-[18px] border border-[#e0e5e9] bg-[#fafbfc] p-7 transition duration-400 hover:-translate-y-1 hover:border-[#d0d7de] hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,.07)]"
    >
      <div className="relative z-10 flex h-[74px] w-[74px] items-center justify-center rounded-full border-[7px] border-white bg-[#071b2d] text-white shadow-[0_8px_25px_rgba(7,27,45,.15)]">
        <Icon className="h-6 w-6" />

        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[7px] font-black text-white">
          {
            index
          }
        </span>
      </div>


      <h3 className="mt-7 text-[21px] font-black tracking-[-0.03em] text-[#101828]">
        {
          title
        }
      </h3>

      <p className="mt-3 text-[10px] leading-5 text-[#667085]">
        {
          description
        }
      </p>
    </motion.div>
  );
}


/* ============================================================
   SCROLL REVEAL
============================================================ */

function Reveal({
  children,
  delay =
    0,
}: {
  children:
    ReactNode;

  delay?:
    number;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
    <motion.div
      initial={
        reduceMotion
          ? false
          : {
              y:
                26,

              scale:
                0.985,
            }
      }
      whileInView={{
        y:
          0,

        scale:
          1,
      }}
      viewport={{
        once:
          true,

        amount:
          0.2,
      }}
      transition={{
        delay,
        duration:
          0.7,

        ease:
          "easeOut",
      }}
    >
      {
        children
      }
    </motion.div>
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
