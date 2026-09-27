"use client";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";

import {
  useEffect,
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
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Gauge,
  Loader2,
  MoreVertical,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  ApiError,
} from "@/lib/api";

import {
  getAccessToken,
} from "@/lib/auth";

import {
  deleteVehicle,
  getVehicles,
  setActiveVehicle,
} from "@/lib/vehicles";


type GarageVehicle =
  Awaited<
    ReturnType<
      typeof getVehicles
    >
  >[number];


/* ============================================================
   GARAGE
============================================================ */

export default function GaragePage() {
  const router =
    useRouter();


  const reduceMotion =
    useReducedMotion();


  const [
    vehicles,
    setVehicles,
  ] =
    useState<
      GarageVehicle[]
    >(
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
    busyVehicleId,
    setBusyVehicleId,
  ] =
    useState<
      string | null
    >(
      null,
    );


  const [
    expandedVehicleId,
    setExpandedVehicleId,
  ] =
    useState<
      string | null
    >(
      null,
    );


  /* ==========================================================
     INITIAL LOAD
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


    let cancelled =
      false;


    async function fetchVehicles(
      accessToken:
        string,
    ) {
      try {
        const result =
          await getVehicles(
            accessToken,
          );


        if (
          cancelled
        ) {
          return;
        }


        setVehicles(
          result,
        );

        setError(
          "",
        );

      } catch (
        err
      ) {
        if (
          cancelled
        ) {
          return;
        }


        if (
          err instanceof
            ApiError &&
          (
            err.status ===
              401 ||
            err.status ===
              403
          )
        ) {
          router.replace(
            "/login",
          );

          return;
        }


        setError(
          err instanceof
            ApiError
            ? err.message
            : "Unable to load your garage.",
        );

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


    void fetchVehicles(
      token,
    );


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


  /* ==========================================================
     RELOAD
  ========================================================== */

  async function reloadVehicles() {
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


      const result =
        await getVehicles(
          token,
        );


      setVehicles(
        result,
      );

    } catch (
      err
    ) {
      if (
        err instanceof
          ApiError &&
        (
          err.status ===
            401 ||
          err.status ===
            403
        )
      ) {
        router.replace(
          "/login",
        );

        return;
      }


      setError(
        err instanceof
          ApiError
          ? err.message
          : "Unable to refresh your garage.",
      );

    } finally {
      setLoading(
        false,
      );
    }
  }


  /* ==========================================================
     SET ACTIVE
  ========================================================== */

  async function handleSetActive(
    vehicleId:
      string,
  ) {
    const token =
      getAccessToken();


    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }


    try {
      setBusyVehicleId(
        vehicleId,
      );

      setError(
        "",
      );


      await setActiveVehicle(
        token,
        vehicleId,
      );


      const refreshed =
        await getVehicles(
          token,
        );


      setVehicles(
        refreshed,
      );

    } catch (
      err
    ) {
      if (
        err instanceof
          ApiError &&
        (
          err.status ===
            401 ||
          err.status ===
            403
        )
      ) {
        router.replace(
          "/login",
        );

        return;
      }


      setError(
        err instanceof
          ApiError
          ? err.message
          : "Unable to change the active vehicle.",
      );

    } finally {
      setBusyVehicleId(
        null,
      );
    }
  }


  /* ==========================================================
     DELETE
  ========================================================== */

  async function handleDelete(
    vehicleId:
      string,
  ) {
    const confirmed =
      window.confirm(
        "Remove this vehicle from your garage?",
      );


    if (
      !confirmed
    ) {
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
      setBusyVehicleId(
        vehicleId,
      );

      setError(
        "",
      );


      await deleteVehicle(
        token,
        vehicleId,
      );


      const refreshed =
        await getVehicles(
          token,
        );


      setVehicles(
        refreshed,
      );


      if (
        expandedVehicleId ===
        vehicleId
      ) {
        setExpandedVehicleId(
          null,
        );
      }

    } catch (
      err
    ) {
      if (
        err instanceof
          ApiError &&
        (
          err.status ===
            401 ||
          err.status ===
            403
        )
      ) {
        router.replace(
          "/login",
        );

        return;
      }


      setError(
        err instanceof
          ApiError
          ? err.message
          : "Unable to remove the vehicle.",
      );

    } finally {
      setBusyVehicleId(
        null,
      );
    }
  }


  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const sortedVehicles =
    [
      ...vehicles,
    ].sort(
      (
        a,
        b,
      ) => {
        if (
          a.is_active ===
          b.is_active
        ) {
          return 0;
        }


        return a.is_active
          ? -1
          : 1;
      },
    );


  const activeVehicle =
    vehicles.find(
      (
        vehicle,
      ) =>
        vehicle.is_active,
    ) ??
    null;


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f4f7] text-[#101828]">
      <VehnexaNavbar />


      {/* ======================================================
          GARAGE HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:72px_72px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[240px] -top-[280px] h-[760px] w-[760px] rounded-full bg-[#e31b2d]/15 blur-[130px]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-[340px] left-[12%] h-[620px] w-[780px] rounded-full bg-[#367eb7]/10 blur-[150px]"
        />


        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [
                    -80,
                    80,
                    -80,
                  ],

                  opacity: [
                    0.15,
                    0.5,
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
          className="absolute bottom-[16%] left-[6%] h-[3px] w-[58%] rotate-[-7deg] bg-gradient-to-r from-transparent via-[#e31b2d]/55 to-transparent blur-[2px]"
        />


        <div className="relative mx-auto max-w-[1480px] px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-18 lg:pt-16">
          <div className="grid gap-12 xl:grid-cols-[minmax(0,0.9fr)_minmax(480px,1.1fr)] xl:items-center">
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
                  0.7,

                ease:
                  "easeOut",
              }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3.5 py-2 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#ff4b5a]" />

                <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[#c7d3dc]">
                  VEHICLE INTELLIGENCE
                </span>
              </div>


              <h1 className="mt-6 text-[52px] font-black leading-[0.92] tracking-[-0.06em] sm:text-[68px] lg:text-[78px]">
                Your cars.
                <br />

                <span className="text-[#ff394a]">
                  One Garage.
                </span>
              </h1>


              <p className="mt-7 max-w-[650px] text-[12px] leading-6 text-[#a9b9c6] sm:text-[13px]">
                Save the vehicles that matter,
                choose the one you are working
                with, and carry that context
                into Vehnexa&apos;s marketplace
                compatibility flow.
              </p>


              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/account/garage/add"
                  className="group inline-flex h-12 items-center gap-2 rounded-[9px] bg-[#e31b2d] px-6 text-[9px] font-black text-white shadow-[0_12px_34px_rgba(227,27,45,.20)] transition hover:bg-[#c91625]"
                >
                  <Plus className="h-4 w-4" />

                  Add vehicle

                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </Link>


                {activeVehicle && (
                  <Link
                    href={`/shop?vehicleId=${activeVehicle.id}&fits=true`}
                    className="inline-flex h-12 items-center gap-2 rounded-[9px] border border-white/[0.13] bg-white/[0.045] px-6 text-[9px] font-black text-white backdrop-blur transition hover:bg-white/[0.09]"
                  >
                    <PackageCheck className="h-4 w-4" />

                    Compatible parts
                  </Link>
                )}
              </div>


              <div className="mt-9 grid max-w-[670px] gap-2 sm:grid-cols-3">
                <GarageMetric
                  label="Vehicles"
                  value={
                    loading
                      ? "..."
                      : String(
                          vehicles.length,
                        )
                  }
                />

                <GarageMetric
                  label="Active context"
                  value={
                    loading
                      ? "..."
                      : activeVehicle
                        ? "Ready"
                        : "None"
                  }
                />

                <GarageMetric
                  label="Fitment"
                  value={
                    activeVehicle
                      ? "Enabled"
                      : "Waiting"
                  }
                />
              </div>
            </motion.div>


            {/* ACTIVE VEHICLE STAGE */}

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
            >
              <ActiveVehicleStage
                vehicle={
                  activeVehicle
                }
                loading={
                  loading
                }
                busy={
                  activeVehicle
                    ? busyVehicleId ===
                      activeVehicle.id
                    : false
                }
              />
            </motion.div>
          </div>
        </div>
      </section>


      {/* ======================================================
          GARAGE SIGNALS
      ====================================================== */}

      <section className="border-b border-[#e1e6ea] bg-white">
        <div className="mx-auto grid max-w-[1480px] sm:grid-cols-3">
          <GarageSignal
            icon={
              CarFront
            }
            eyebrow="GARAGE PROFILE"
            title={
              loading
                ? "Loading vehicles"
                : `${vehicles.length} ${
                    vehicles.length ===
                    1
                      ? "vehicle"
                      : "vehicles"
                  } saved`
            }
            description="Your saved vehicles remain attached to your authenticated customer account."
          />


          <GarageSignal
            icon={
              CircleGauge
            }
            eyebrow="ACTIVE VEHICLE"
            title={
              activeVehicle
                ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
                : "No active vehicle"
            }
            description="The active vehicle becomes the default compatibility context across Vehnexa."
          />


          <GarageSignal
            icon={
              ShieldCheck
            }
            eyebrow="MARKETPLACE CONTEXT"
            title={
              activeVehicle
                ? "Compatibility ready"
                : "Select vehicle first"
            }
            description="Use your active vehicle to open the Shop with fitment filtering already enabled."
          />
        </div>
      </section>


      {/* ======================================================
          GARAGE COLLECTION
      ====================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
              YOUR VEHICLES
            </p>

            <h2 className="mt-3 text-[36px] font-black tracking-[-0.045em] text-[#101828] sm:text-[46px]">
              The vehicles behind your journey.
            </h2>

            <p className="mt-4 max-w-[690px] text-[10px] leading-5 text-[#667085]">
              Change the active vehicle whenever
              your focus changes. Vehnexa uses
              that active selection when
              checking marketplace compatibility.
            </p>
          </div>


          <Link
            href="/account/garage/add"
            className="group inline-flex h-11 self-start items-center gap-2 rounded-[8px] border border-[#d6dce2] bg-white px-5 text-[9px] font-bold text-[#344054] transition hover:border-[#e31b2d]/30 hover:text-[#e31b2d] lg:self-auto"
          >
            <Plus className="h-4 w-4" />

            Add another vehicle

            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </Link>
        </div>


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
            className="mt-7 flex flex-col gap-3 rounded-[12px] border border-[#f1c1c6] bg-[#fff5f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-[9px] font-black text-[#b42318]">
                Garage could not be refreshed
              </p>

              <p className="mt-1 text-[8px] text-[#c2554a]">
                {
                  error
                }
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void reloadVehicles();
              }}
              className="shrink-0 text-[8px] font-black text-[#e31b2d]"
            >
              Try again
            </button>
          </motion.div>
        )}


        {loading ? (
          <GarageLoading />
        ) : vehicles.length ===
          0 ? (
          <EmptyGarage />
        ) : (
          <motion.div
            layout
            className="mt-9 grid gap-6 lg:grid-cols-2"
          >
            <AnimatePresence
              mode="popLayout"
            >
              {sortedVehicles.map(
                (
                  vehicle,
                  index,
                ) => (
                  <VehicleCard
                    key={
                      vehicle.id
                    }
                    vehicle={
                      vehicle
                    }
                    index={
                      index
                    }
                    busy={
                      busyVehicleId ===
                      vehicle.id
                    }
                    expanded={
                      expandedVehicleId ===
                      vehicle.id
                    }
                    onToggleDetails={() => {
                      setExpandedVehicleId(
                        (
                          current,
                        ) =>
                          current ===
                          vehicle.id
                            ? null
                            : vehicle.id,
                      );
                    }}
                    onSetActive={
                      handleSetActive
                    }
                    onDelete={
                      handleDelete
                    }
                  />
                ),
              )}
            </AnimatePresence>
          </motion.div>
        )}


        {/* ==================================================
            COMPATIBILITY LAUNCHPAD
        ================================================== */}

        {!loading &&
          vehicles.length >
            0 && (
          <section className="mt-20">
            <div className="relative overflow-hidden rounded-[24px] bg-[#071b2d] text-white shadow-[0_30px_80px_rgba(7,27,45,.14)]">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.28)_1px,transparent_1px)] [background-size:68px_68px]"
              />

              <div
                aria-hidden="true"
                className="absolute -right-[130px] -top-[200px] h-[520px] w-[520px] rounded-full bg-[#e31b2d]/15 blur-[110px]"
              />


              <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:p-12">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#ff5966]">
                    COMPATIBILITY BRIDGE
                  </p>

                  <h2 className="mt-4 text-[34px] font-black leading-[1] tracking-[-0.045em] sm:text-[44px]">
                    Take your active vehicle
                    into the marketplace.
                  </h2>

                  <p className="mt-5 max-w-[520px] text-[10px] leading-5 text-[#a5b5c2]">
                    Garage does not fabricate
                    product recommendations.
                    Instead, your active vehicle
                    can be passed directly into
                    the real Shop compatibility
                    filter.
                  </p>


                  {activeVehicle ? (
                    <Link
                      href={`/shop?vehicleId=${activeVehicle.id}&fits=true`}
                      className="group mt-7 inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-5 text-[8px] font-black text-white transition hover:bg-[#c91625]"
                    >
                      Browse compatible parts

                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </Link>
                  ) : (
                    <p className="mt-7 inline-flex rounded-[8px] border border-white/[0.10] bg-white/[0.045] px-4 py-3 text-[8px] font-semibold text-[#b9c7d2]">
                      Select an active vehicle to enable this shortcut.
                    </p>
                  )}
                </div>


                <CompatibilityDiagram
                  vehicle={
                    activeVehicle
                  }
                />
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}


/* ============================================================
   ACTIVE VEHICLE STAGE
============================================================ */

function ActiveVehicleStage({
  vehicle,
  loading,
  busy,
}: {
  vehicle:
    GarageVehicle |
    null;

  loading:
    boolean;

  busy:
    boolean;
}) {
  const reduceMotion =
    useReducedMotion();


  if (
    loading
  ) {
    return (
      <div className="min-h-[430px] animate-pulse rounded-[24px] border border-white/[0.10] bg-white/[0.05] p-6">
        <div className="h-3 w-28 rounded bg-white/[0.08]" />

        <div className="mt-6 h-[250px] rounded-[18px] bg-white/[0.06]" />

        <div className="mt-5 h-6 w-1/2 rounded bg-white/[0.08]" />
      </div>
    );
  }


  if (!vehicle) {
    return (
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-[24px] border border-white/[0.10] bg-white/[0.055] p-8 backdrop-blur-xl">
        <div className="max-w-[380px] text-center">
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [
                      0,
                      -8,
                      0,
                    ],
                  }
            }
            transition={{
              duration:
                4.5,

              repeat:
                Infinity,

              ease:
                "easeInOut",
            }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-[20px] border border-white/[0.10] bg-black/10 text-[#7890a2]"
          >
            <CarFront className="h-8 w-8" />
          </motion.div>

          <p className="mt-6 text-[8px] font-black uppercase tracking-[0.14em] text-[#73899a]">
            NO ACTIVE VEHICLE
          </p>

          <h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-white">
            Give Vehnexa a vehicle context.
          </h2>

          <p className="mt-3 text-[9px] leading-5 text-[#9aadb9]">
            Add a vehicle or make one active
            to unlock compatibility context
            throughout the customer experience.
          </p>

          <Link
            href="/account/garage/add"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-5 text-[8px] font-black text-white"
          >
            <Plus className="h-3.5 w-3.5" />

            Add vehicle
          </Link>
        </div>
      </div>
    );
  }


  const image =
    getVehicleImage(
      vehicle,
    );


  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[24px] border border-white/[0.11] bg-white/[0.055] shadow-[0_34px_90px_rgba(0,0,0,.20)] backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-[340px] w-[340px] rounded-full border border-white/[0.06]"
      />

      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-[220px] w-[220px] rounded-full border border-[#e31b2d]/10"
      />


      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#5ac58e]/20 bg-[#5ac58e]/10 px-3 py-1.5 text-[7px] font-black text-[#70dca5]">
              <BadgeCheck className="h-3 w-3" />

              ACTIVE VEHICLE
            </span>


            <h2 className="mt-4 text-[25px] font-black tracking-[-0.04em] text-white sm:text-[30px]">
              {vehicle.year}{" "}
              {vehicle.make}{" "}
              {vehicle.model}
            </h2>


            <p className="mt-2 text-[9px] font-semibold text-[#8da1b1]">
              {
                vehicle.engine
              }

              {" • "}

              {
                vehicle.transmission
              }
            </p>
          </div>


          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.10] bg-black/10 text-[#ff4b5a]">
            <Gauge className="h-4 w-4" />
          </span>
        </div>


        <div className="relative mt-5 flex h-[240px] items-center justify-center overflow-hidden rounded-[18px] border border-white/[0.07] bg-black/10">
          <div
            aria-hidden="true"
            className="absolute h-[270px] w-[270px] rounded-full border border-white/[0.05]"
          />

          <div
            aria-hidden="true"
            className="absolute h-[190px] w-[190px] rounded-full border border-[#e31b2d]/10"
          />


          {busy ? (
            <Loader2 className="h-7 w-7 animate-spin text-[#ff4b5a]" />
          ) : image ? (
            <motion.div
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
                  5,

                repeat:
                  Infinity,

                ease:
                  "easeInOut",
              }}
              className="relative z-10 h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}

              <img
                src={
                  image
                }
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-contain p-5 drop-shadow-[0_26px_30px_rgba(0,0,0,.25)]"
              />
            </motion.div>
          ) : (
            <div className="relative z-10 h-full w-full text-[#73899a]">
              <VehiclePlaceholder />
            </div>
          )}
        </div>


        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#667d8e]">
              COMPATIBILITY CONTEXT
            </p>

            <p className="mt-1 text-[9px] font-bold text-[#dbe4eb]">
              Used across Shop fitment checks
            </p>
          </div>


          <Link
            href={`/shop?vehicleId=${vehicle.id}&fits=true`}
            className="inline-flex h-9 items-center gap-2 rounded-[7px] border border-white/[0.11] bg-white/[0.05] px-4 text-[8px] font-bold text-white transition hover:bg-white/[0.09]"
          >
            Find parts

            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   VEHICLE CARD
============================================================ */

function VehicleCard({
  vehicle,
  index,
  busy,
  expanded,
  onToggleDetails,
  onSetActive,
  onDelete,
}: {
  vehicle:
    GarageVehicle;

  index:
    number;

  busy:
    boolean;

  expanded:
    boolean;

  onToggleDetails:
    () => void;

  onSetActive: (
    vehicleId:
      string,
  ) => Promise<void>;

  onDelete: (
    vehicleId:
      string,
  ) => Promise<void>;
}) {
  const reduceMotion =
    useReducedMotion();


  const image =
    getVehicleImage(
      vehicle,
    );


  const vehicleTitle =
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`;


  return (
    <motion.article
      layout
      initial={
        reduceMotion
          ? false
          : {
              y:
                30,

              scale:
                0.985,
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
          0.96,
      }}
      transition={{
        delay:
          reduceMotion
            ? 0
            : Math.min(
                index *
                  0.06,
                0.24,
              ),

        duration:
          0.5,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y:
                -6,
            }
      }
      className={`group relative overflow-visible rounded-[20px] border bg-white shadow-[0_10px_34px_rgba(15,23,42,.045)] transition-colors duration-300 ${
        vehicle.is_active
          ? "border-[#b9d8c6] ring-1 ring-[#72c694]/10"
          : "border-[#dce2e7] hover:border-[#cbd3da]"
      }`}
    >
      <div className="overflow-hidden rounded-[20px]">
        {/* TOP */}

        <div
          className={
            vehicle.is_active
              ? "relative bg-[linear-gradient(135deg,#f3fbf6_0%,#ffffff_72%)] px-5 pb-4 pt-5"
              : "relative bg-white px-5 pb-4 pt-5"
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {vehicle.is_active && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9e4ca] bg-[#ecfdf3] px-2.5 py-1 text-[7px] font-black text-[#16804a]">
                    <CheckCircle2 className="h-3 w-3" />

                    ACTIVE
                  </span>
                )}


                {vehicle.nickname && (
                  <span className="rounded-full border border-[#e0e5e9] bg-[#f8fafb] px-2.5 py-1 text-[7px] font-bold text-[#667085]">
                    {
                      vehicle.nickname
                    }
                  </span>
                )}
              </div>


              <h3 className="mt-3 truncate text-[20px] font-black tracking-[-0.035em] text-[#101828]">
                {
                  vehicleTitle
                }
              </h3>


              <p className="mt-1.5 truncate text-[9px] font-semibold text-[#7b8794]">
                {
                  vehicle.engine
                }
              </p>
            </div>


            <div className="relative z-30">
              <details className="group/menu relative">
                <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[#e1e5e9] bg-white text-[#98a2b3] shadow-sm transition hover:border-[#cfd6dc] hover:text-[#344054] [&::-webkit-details-marker]:hidden">
                  <MoreVertical className="h-4 w-4" />
                </summary>


                <div className="absolute right-0 top-11 z-50 w-[170px] overflow-hidden rounded-[10px] border border-[#e1e5e9] bg-white py-1.5 shadow-[0_18px_45px_rgba(16,24,40,.15)]">
                  {!vehicle.is_active && (
                    <button
                      type="button"
                      disabled={
                        busy
                      }
                      onClick={() => {
                        void onSetActive(
                          vehicle.id,
                        );
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[9px] font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-50"
                    >
                      <BadgeCheck className="h-3.5 w-3.5 text-[#16804a]" />

                      Make active
                    </button>
                  )}


                  <button
                    type="button"
                    disabled={
                      busy
                    }
                    onClick={() => {
                      void onDelete(
                        vehicle.id,
                      );
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[9px] font-semibold text-[#d92d20] transition hover:bg-[#fff5f5] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />

                    Remove vehicle
                  </button>
                </div>
              </details>
            </div>
          </div>
        </div>


        {/* IMAGE */}

        <div className="relative mx-5 flex h-[230px] items-center justify-center overflow-hidden rounded-[16px] border border-[#edf0f2] bg-[radial-gradient(circle_at_50%_44%,#ffffff_0%,#f7f9fa_65%,#f0f3f5_100%)]">
          <div
            aria-hidden="true"
            className="absolute h-[250px] w-[250px] rounded-full border border-[#dfe5ea]/60"
          />

          <div
            aria-hidden="true"
            className="absolute h-[170px] w-[170px] rounded-full border border-[#e8ecef]"
          />


          {busy ? (
            <Loader2 className="relative z-10 h-7 w-7 animate-spin text-[#e31b2d]" />
          ) : image ? (
            <motion.div
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      scale:
                        1.055,

                      rotate:
                        -0.6,
                    }
              }
              className="relative z-10 h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}

              <img
                src={
                  image
                }
                alt={
                  vehicleTitle
                }
                className="h-full w-full object-contain p-5 drop-shadow-[0_20px_20px_rgba(15,23,42,.13)]"
              />
            </motion.div>
          ) : (
            <div className="relative z-10 h-full w-full text-[#aab5c0]">
              <VehiclePlaceholder />
            </div>
          )}


          {vehicle.is_active && (
            <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-[#b8e1c8] bg-white/90 px-2.5 py-1 text-[7px] font-black text-[#16804a] shadow-sm backdrop-blur">
              <Check className="h-3 w-3" />

              Compatibility vehicle
            </span>
          )}
        </div>


        {/* DATA */}

        <div className="grid grid-cols-2 gap-2 px-5 pt-5">
          <VehicleMetric
            label="Engine"
            value={
              vehicle.engine
            }
          />

          <VehicleMetric
            label="Transmission"
            value={
              vehicle.transmission
            }
          />
        </div>


        {/* ACTIONS */}

        <div className="p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={
                onToggleDetails
              }
              className="flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#d6dce2] bg-white text-[8px] font-bold text-[#344054] transition hover:bg-[#fafbfc]"
            >
              {expanded
                ? "Hide details"
                : "View details"}

              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  expanded
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>


            <Link
              href={`/shop?vehicleId=${vehicle.id}&fits=true`}
              className="group flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#071b2d] text-[8px] font-black text-white transition hover:bg-[#102d43]"
            >
              Find compatible parts

              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>


          <AnimatePresence
            initial={false}
          >
            {expanded && (
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        height:
                          0,

                        y:
                          -8,
                      }
                }
                animate={{
                  height:
                    "auto",

                  y:
                    0,
                }}
                exit={{
                  height:
                    0,

                  y:
                    -8,
                }}
                transition={{
                  duration:
                    0.28,
                }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t border-[#edf0f2] pt-4">
                  <DetailRow
                    label="Year"
                    value={
                      String(
                        vehicle.year,
                      )
                    }
                  />

                  <DetailRow
                    label="Make"
                    value={
                      vehicle.make
                    }
                  />

                  <DetailRow
                    label="Model"
                    value={
                      vehicle.model
                    }
                  />

                  <DetailRow
                    label="Engine"
                    value={
                      vehicle.engine
                    }
                  />

                  <DetailRow
                    label="Transmission"
                    value={
                      vehicle.transmission
                    }
                  />


                  {vehicle.nickname && (
                    <DetailRow
                      label="Nickname"
                      value={
                        vehicle.nickname
                      }
                    />
                  )}


                  <div className="mt-4 rounded-[10px] border border-[#e4e8ec] bg-[#fafbfc] p-3">
                    {vehicle.is_active ? (
                      <div className="flex items-center gap-2 text-[8px] font-bold text-[#16804a]">
                        <CheckCircle2 className="h-3.5 w-3.5" />

                        This vehicle is used for compatibility.
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() => {
                          void onSetActive(
                            vehicle.id,
                          );
                        }}
                        className="flex items-center gap-2 text-[8px] font-black text-[#e31b2d] disabled:opacity-50"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" />

                        Make active vehicle
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}


/* ============================================================
   COMPATIBILITY DIAGRAM
============================================================ */

function CompatibilityDiagram({
  vehicle,
}: {
  vehicle:
    GarageVehicle |
    null;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-[18px] border border-white/[0.09] bg-black/10 p-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:44px_44px]"
      />


      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#718798]">
              FITMENT FLOW
            </p>

            <p className="mt-1 text-[10px] font-bold text-white">
              Garage → Marketplace
            </p>
          </div>


          <motion.span
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
                12,

              repeat:
                Infinity,

              ease:
                "linear",
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e31b2d]/25 bg-[#e31b2d]/10 text-[#ff4b5a]"
          >
            <Wrench className="h-4 w-4" />
          </motion.span>
        </div>


        <div className="my-7 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <FlowNode
            icon={
              CarFront
            }
            label="Active vehicle"
            value={
              vehicle
                ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                : "Not selected"
            }
            active={
              Boolean(
                vehicle,
              )
            }
          />


          <div className="hidden items-center sm:flex">
            <div className="h-px w-7 bg-white/[0.12]" />

            <ArrowRight className="h-4 w-4 text-[#e31b2d]" />

            <div className="h-px w-7 bg-white/[0.12]" />
          </div>


          <FlowNode
            icon={
              PackageCheck
            }
            label="Shop filter"
            value={
              vehicle
                ? "Fits my vehicle"
                : "Waiting"
            }
            active={
              Boolean(
                vehicle,
              )
            }
          />
        </div>


        <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[8px] font-bold text-[#a5b5c2]">
              Compatibility context
            </span>

            <span
              className={
                vehicle
                  ? "text-[8px] font-black text-[#6edba4]"
                  : "text-[8px] font-black text-[#768b9b]"
              }
            >
              {vehicle
                ? "READY"
                : "INACTIVE"}
            </span>
          </div>


          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              animate={{
                width:
                  vehicle
                    ? "100%"
                    : "28%",
              }}
              transition={{
                duration:
                  0.8,
              }}
              className={
                vehicle
                  ? "h-full bg-gradient-to-r from-[#e31b2d] to-[#64d69d]"
                  : "h-full bg-[#506677]"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   FLOW NODE
============================================================ */

function FlowNode({
  icon:
    Icon,
  label,
  value,
  active,
}: {
  icon:
    typeof CarFront;

  label:
    string;

  value:
    string;

  active:
    boolean;
}) {
  return (
    <div
      className={
        active
          ? "rounded-[13px] border border-[#6dd19b]/20 bg-[#6dd19b]/[0.06] p-4"
          : "rounded-[13px] border border-white/[0.08] bg-white/[0.035] p-4"
      }
    >
      <span
        className={
          active
            ? "flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#5dc891]/10 text-[#6edba4]"
            : "flex h-9 w-9 items-center justify-center rounded-[9px] border border-white/[0.08] text-[#718798]"
        }
      >
        <Icon className="h-4 w-4" />
      </span>

      <p className="mt-4 text-[7px] font-black uppercase tracking-[0.11em] text-[#718798]">
        {
          label
        }
      </p>

      <p className="mt-1 text-[9px] font-bold leading-4 text-white">
        {
          value
        }
      </p>
    </div>
  );
}


/* ============================================================
   METRICS
============================================================ */

function GarageMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[11px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur">
      <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#6d8293]">
        {
          label
        }
      </p>

      <p className="mt-1 text-[14px] font-black text-white">
        {
          value
        }
      </p>
    </div>
  );
}


function GarageSignal({
  icon:
    Icon,
  eyebrow,
  title,
  description,
}: {
  icon:
    typeof CarFront;

  eyebrow:
    string;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="group flex gap-4 border-b border-[#edf0f2] px-5 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-8">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e0e5e9] bg-[#f5f7f9] text-[#596b7a] transition duration-300 group-hover:border-[#efc8cc] group-hover:bg-[#fff0f1] group-hover:text-[#e31b2d]">
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div>
        <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#98a2b3]">
          {
            eyebrow
          }
        </p>

        <p className="mt-1 text-[11px] font-black tracking-[-0.015em] text-[#101828]">
          {
            title
          }
        </p>

        <p className="mt-1.5 text-[8px] leading-4 text-[#7b8794]">
          {
            description
          }
        </p>
      </div>
    </div>
  );
}


function VehicleMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[10px] border border-[#e5e9ed] bg-[#fafbfc] px-3 py-3">
      <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#98a2b3]">
        {
          label
        }
      </p>

      <p className="mt-1.5 truncate text-[9px] font-bold text-[#344054]">
        {
          value
        }
      </p>
    </div>
  );
}


/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f2f4] py-2.5 last:border-b-0">
      <span className="text-[8px] font-semibold text-[#98a2b3]">
        {
          label
        }
      </span>

      <span className="truncate text-right text-[9px] font-bold text-[#475467]">
        {
          value
        }
      </span>
    </div>
  );
}


/* ============================================================
   EMPTY
============================================================ */

function EmptyGarage() {
  const reduceMotion =
    useReducedMotion();


  return (
    <section className="relative mt-9 flex min-h-[520px] items-center justify-center overflow-hidden rounded-[22px] border border-[#dce2e7] bg-white px-6 py-12 shadow-[0_12px_40px_rgba(15,23,42,.04)]">
      <div
        aria-hidden="true"
        className="absolute h-[420px] w-[420px] rounded-full border border-[#edf0f2]"
      />

      <div
        aria-hidden="true"
        className="absolute h-[290px] w-[290px] rounded-full border border-[#f1d8da]"
      />


      <div className="relative z-10 max-w-[470px] text-center">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [
                    0,
                    -9,
                    0,
                  ],

                  rotate: [
                    0,
                    -2,
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
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[20px] bg-[#071b2d] text-white shadow-[0_18px_40px_rgba(7,27,45,.16)]"
        >
          <CarFront className="h-8 w-8" />
        </motion.div>


        <p className="mt-7 text-[8px] font-black uppercase tracking-[0.15em] text-[#e31b2d]">
          EMPTY GARAGE
        </p>


        <h2 className="mt-3 text-[30px] font-black tracking-[-0.045em] text-[#101828]">
          Your first vehicle starts here.
        </h2>


        <p className="mt-4 text-[10px] leading-5 text-[#667085]">
          Add a vehicle to make Garage
          compatibility available throughout
          Vehnexa and create a faster path from
          vehicle context to matching parts.
        </p>


        <Link
          href="/account/garage/add"
          className="group mx-auto mt-7 inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-6 text-[9px] font-black text-white transition hover:bg-[#c91625]"
        >
          <Plus className="h-4 w-4" />

          Add your first vehicle

          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}


/* ============================================================
   LOADING
============================================================ */

function GarageLoading() {
  return (
    <div className="mt-9 grid gap-6 lg:grid-cols-2">
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
            className="overflow-hidden rounded-[20px] border border-[#e1e5e9] bg-white"
          >
            <div className="p-5">
              <div className="h-4 w-[42%] animate-pulse rounded bg-[#e9edf1]" />

              <div className="mt-3 h-2.5 w-[28%] animate-pulse rounded bg-[#eef1f4]" />
            </div>

            <div className="mx-5 h-[230px] animate-pulse rounded-[16px] bg-[#f1f3f5]" />

            <div className="grid grid-cols-2 gap-2 p-5">
              <div className="h-14 animate-pulse rounded-[10px] bg-[#f2f4f6]" />

              <div className="h-14 animate-pulse rounded-[10px] bg-[#f2f4f6]" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function VehnexaNavbar() {
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
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
        >
          <motion.div
            whileHover={
              reduceMotion
                ? undefined
                : {
                    rotate:
                      -4,

                    scale:
                      1.06,
                  }
            }
          >
            <VehnexaMark />
          </motion.div>


          <span className="text-[14px] font-black tracking-[-0.025em] text-white">
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
            active
          />

          <TopNavLink
            href="/ai-mechanic"
            label="AI Mechanic"
          />

          <TopNavLink
            href="/#resources"
            label="Resources"
          />
        </nav>


        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/shop"
            aria-label="Search parts"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
          >
            <Search className="h-[16px] w-[16px]" />
          </Link>


          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
          >
            <ShoppingCart className="h-[16px] w-[16px]" />

            <span className="absolute right-[4px] top-[3px] h-1.5 w-1.5 rounded-full bg-[#e31b2d]" />
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
      </div>
    </motion.header>
  );
}


/* ============================================================
   TOP NAV
============================================================ */

function TopNavLink({
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


/* ============================================================
   VEHICLE IMAGE
============================================================ */

function getVehicleImage(
  vehicle:
    GarageVehicle,
): string | null {
  const candidate =
    (
      vehicle as
        GarageVehicle & {
          image_url?:
            unknown;
        }
    ).image_url;


  if (
    typeof candidate !==
      "string" ||
    !candidate.trim()
  ) {
    return null;
  }


  return candidate;
}


/* ============================================================
   VEHICLE PLACEHOLDER
============================================================ */

function VehiclePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 240 120"
        className="w-[68%] max-w-[250px] text-current"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M43 75H197L178 54L154 34H87L64 57L43 75Z"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        <path
          d="M87 35L69 70M154 35L185 70"
          stroke="currentColor"
          strokeWidth="5"
        />

        <circle
          cx="73"
          cy="81"
          r="23"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="7"
        />

        <circle
          cx="171"
          cy="81"
          r="23"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="7"
        />
      </svg>
    </div>
  );
}
