"use client";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

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
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Gauge,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserRound,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  ApiError,
} from "@/lib/api";

import {
  getAccessToken,
  removeAccessToken,
} from "@/lib/auth";

import {
  getVehicles,
  type Vehicle,
} from "@/lib/vehicles";

import {
  getEffectivePrice,
  type Product,
} from "@/lib/products";

import DiagnosticVehicleStage from "@/components/ai-mechanic/DiagnosticVehicleStage";

import {
  continueAIMechanicSession,
  getAIMechanicSession,
  startAIMechanicSession,
  type AIComponentSuggestion,
  type AIMechanicSession,
  type RelevanceLevel,
  type SafetyLevel,
} from "@/lib/aiMechanic";


const SESSION_STORAGE_KEY =
  "vehnexa_ai_mechanic_session";


const DIAGNOSTIC_STEPS = [
  "Reading vehicle profile",
  "Processing symptom pattern",
  "Checking safety conditions",
  "Mapping component regions",
  "Resolving compatible parts",
];





export default function AIMechanicPage() {
  const router =
    useRouter();


  const reduceMotion =
    useReducedMotion();

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    vehicles,
    setVehicles,
  ] = useState<Vehicle[]>([]);

  const [
    session,
    setSession,
  ] =
    useState<AIMechanicSession | null>(
      null,
    );

  const [
    draft,
    setDraft,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    diagnosticStep,
    setDiagnosticStep,
  ] = useState(0);

  const [
    selectedComponentKey,
    setSelectedComponentKey,
  ] =
    useState<string | null>(
      null,
    );


  const activeVehicle =
    useMemo(
      () =>
        vehicles.find(
          (vehicle) =>
            vehicle.is_active,
        ) ?? null,
      [vehicles],
    );


  const sessionVehicle =
    useMemo(() => {
      if (!session) {
        return activeVehicle;
      }

      return (
        vehicles.find(
          (vehicle) =>
            vehicle.id ===
            session.vehicle_id,
        ) ??
        activeVehicle
      );
    }, [
      activeVehicle,
      session,
      vehicles,
    ]);


  const latestTurn =
    session?.latest_turn ??
    null;


  const components =
    useMemo(
      () =>
        latestTurn?.components ??
        [],
      [latestTurn],
    );


  const selectedComponent =
    useMemo(() => {
      if (
        components.length ===
        0
      ) {
        return null;
      }

      return (
        components.find(
          (component) =>
            component.component_key ===
            selectedComponentKey,
        ) ??
        components[0]
      );
    }, [
      components,
      selectedComponentKey,
    ]);


  const selectedRecommendation =
    useMemo(() => {
      if (
        !session ||
        !selectedComponent
      ) {
        return null;
      }

      return (
        session
          .product_recommendations
          .find(
            (recommendation) =>
              recommendation
                .component_key ===
              selectedComponent
                .component_key,
          ) ??
        null
      );
    }, [
      selectedComponent,
      session,
    ]);


  useEffect(() => {
    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    let cancelled = false;


    async function load(
      accessToken: string,
    ) {
      try {
        const vehicleResult =
          await getVehicles(
            accessToken,
          );

        if (cancelled) {
          return;
        }

        setVehicles(
          vehicleResult,
        );


        const savedSessionId =
          window.localStorage
            .getItem(
              SESSION_STORAGE_KEY,
            );


        if (!savedSessionId) {
          return;
        }


        try {
          const restoredSession =
            await getAIMechanicSession(
              accessToken,
              savedSessionId,
            );

          if (!cancelled) {
            setSession(
              restoredSession,
            );
          }
        } catch (restoreError) {
          window.localStorage
            .removeItem(
              SESSION_STORAGE_KEY,
            );

          if (
            restoreError instanceof
              ApiError &&
            (
              restoreError.status ===
                401 ||
              restoreError.status ===
                403
            )
          ) {
            removeAccessToken();

            router.replace(
              "/login",
            );
          }
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

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
            ApiError
            ? loadError.message
            : "Unable to load AI Mechanic.",
        );
      } finally {
        if (!cancelled) {
          setLoading(
            false,
          );
        }
      }
    }


    void load(
      token,
    );


    return () => {
      cancelled = true;
    };
  }, [
    router,
  ]);


  useEffect(() => {
    if (!submitting) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setDiagnosticStep(
            (current) =>
              Math.min(
                current + 1,
                DIAGNOSTIC_STEPS.length -
                  1,
              ),
          );
        },
        900,
      );


    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    submitting,
  ]);


  useEffect(() => {
    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, [
    session?.messages.length,
    submitting,
  ]);


  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    const message =
      draft.trim();

    if (
      !message ||
      submitting
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


    if (
      !session &&
      !activeVehicle
    ) {
      setError(
        "Choose an active vehicle before starting a diagnosis.",
      );

      return;
    }


    try {
      setDiagnosticStep(
        0,
      );

      setSubmitting(
        true,
      );

      setError("");


      let result:
        AIMechanicSession;


      if (session) {
        result =
          await continueAIMechanicSession(
            token,
            session.id,
            message,
          );
      } else {
        result =
          await startAIMechanicSession(
            token,
            {
              vehicle_id:
                activeVehicle!.id,

              message,
            },
          );
      }


      setSession(
        result,
      );

      setDraft("");


      window.localStorage
        .setItem(
          SESSION_STORAGE_KEY,
          result.id,
        );
    } catch (submitError) {
      if (
        submitError instanceof
          ApiError &&
        (
          submitError.status ===
            401 ||
          submitError.status ===
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
        submitError instanceof
          ApiError
          ? submitError.message
          : "AI Mechanic could not complete the request.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }


  function startNewDiagnosis() {
    window.localStorage
      .removeItem(
        SESSION_STORAGE_KEY,
      );

    setSession(
      null,
    );

    setSelectedComponentKey(
      null,
    );

    setDiagnosticStep(
      0,
    );

    setDraft("");

    setError("");
  }


  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061827]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.26)_1px,transparent_1px)] [background-size:72px_72px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[240px] -top-[260px] h-[700px] w-[700px] rounded-full bg-[#e31b2d]/15 blur-[130px]"
        />


        <div className="relative text-center">
          <motion.div
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
                3,

              repeat:
                Infinity,

              ease:
                "linear",
            }}
            className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] border border-white/[0.10] bg-white/[0.055] text-[#ff5261] shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur"
          >
            <Zap className="h-7 w-7" />

            <span className="absolute inset-[8px] rounded-[16px] border border-dashed border-white/[0.10]" />
          </motion.div>


          <p className="mt-6 text-[8px] font-black uppercase tracking-[0.20em] text-[#718798]">
            VEH NEXA INTELLIGENCE
          </p>

          <p className="mt-2 text-[13px] font-black text-white">
            Initializing diagnostic workspace
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef1f4] text-[#101828]">
      <VehnexaNavbar />


      <AIMechanicHeader
        vehicle={
          sessionVehicle
        }
        session={
          session
        }
        submitting={
          submitting
        }
        onNewDiagnosis={
          startNewDiagnosis
        }
      />


      <AIExperienceSignals
        vehicle={
          sessionVehicle
        }
        session={
          session
        }
        submitting={
          submitting
        }
      />


      <section className="mx-auto max-w-[1480px] px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pt-18">
        {error && (
          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    y:
                      -10,
                  }
            }
            animate={{
              y:
                0,
            }}
            className="mb-7 flex items-start gap-3 rounded-[13px] border border-[#f0b8be] bg-[#fff5f6] px-5 py-4 shadow-[0_8px_24px_rgba(197,31,50,.05)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#ffe5e8] text-[#c51f32]">
              <AlertTriangle className="h-4 w-4" />
            </span>


            <div>
              <p className="text-[10px] font-black text-[#a7192a]">
                AI Mechanic request could not be completed
              </p>

              <p className="mt-1 text-[9px] leading-5 text-[#8c2633]">
                {
                  error
                }
              </p>
            </div>
          </motion.div>
        )}


        {!activeVehicle &&
        !session ? (
          <NoActiveVehicle />
        ) : (
          <>
            {/* ================================================
                WORKSPACE HEADER
            ================================================ */}

            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
                  DIAGNOSTIC WORKSPACE
                </p>

                <h2 className="mt-3 text-[36px] font-black tracking-[-0.045em] text-[#101828] sm:text-[46px]">
                  From symptom to inspection area.
                </h2>

                <p className="mt-4 max-w-[720px] text-[10px] leading-5 text-[#667085]">
                  Talk through the symptom on the
                  left, watch Vehnexa isolate the
                  relevant vehicle region in the
                  center, and inspect normalized
                  component suggestions on the
                  right.
                </p>
              </div>


              <div className="inline-flex h-10 self-start items-center gap-2 rounded-[8px] border border-[#d8dee5] bg-white px-4 text-[8px] font-bold text-[#596775] shadow-sm lg:self-auto">
                <Activity
                  className={
                    submitting
                      ? "h-3.5 w-3.5 animate-pulse text-[#e31b2d]"
                      : "h-3.5 w-3.5 text-[#16804a]"
                  }
                />

                {submitting
                  ? DIAGNOSTIC_STEPS[
                      diagnosticStep
                    ] ??
                    "Analyzing vehicle"
                  : session
                    ? "Diagnostic session active"
                    : "Ready for first symptom"}
              </div>
            </div>


            {/* ================================================
                THREE-PANEL INTELLIGENCE WORKSPACE
            ================================================ */}

            <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)_350px]">
              <ConversationPanel
                session={
                  session
                }
                draft={
                  draft
                }
                submitting={
                  submitting
                }
                onDraftChange={
                  setDraft
                }
                onSubmit={
                  handleSubmit
                }
                messagesEndRef={
                  messagesEndRef
                }
              />


              <VehicleIntelligenceStage
                vehicle={
                  sessionVehicle
                }
                session={
                  session
                }
                selectedComponent={
                  selectedComponent
                }
                submitting={
                  submitting
                }
                diagnosticStep={
                  diagnosticStep
                }
              />


              <IntelligenceRail
                session={
                  session
                }
                selectedComponentKey={
                  selectedComponent
                    ?.component_key ??
                  null
                }
                onSelectComponent={
                  setSelectedComponentKey
                }
              />
            </div>


            <SafetyAndCauses
              session={
                session
              }
            />


            <ProductRecommendations
              session={
                session
              }
              component={
                selectedComponent
              }
              recommendation={
                selectedRecommendation
              }
            />
          </>
        )}
      </section>
    </main>
  );
}


function AIMechanicHeader({
  vehicle,
  session,
  submitting,
  onNewDiagnosis,
}: {
  vehicle:
    Vehicle | null;

  session:
    AIMechanicSession | null;

  submitting:
    boolean;

  onNewDiagnosis:
    () => void;
}) {
  const reduceMotion =
    useReducedMotion();


  const componentCount =
    session?.latest_turn
      ?.components.length ??
    0;


  const totalCompatibleProducts =
    session?.product_recommendations
      .reduce(
        (
          total,
          recommendation,
        ) =>
          total +
          recommendation
            .compatible_products
            .length,
        0,
      ) ??
    0;


  const safetyLevel =
    session?.latest_turn
      ?.safety.level ??
    null;


  const responseType =
    session?.latest_turn
      ?.response_type ??
    null;


  return (
    <section className="relative overflow-hidden bg-[#061827] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.26)_1px,transparent_1px)] [background-size:72px_72px]"
      />

      <div
        aria-hidden="true"
        className="absolute -right-[260px] -top-[290px] h-[780px] w-[780px] rounded-full bg-[#e31b2d]/15 blur-[135px]"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-[350px] left-[8%] h-[680px] w-[850px] rounded-full bg-[#377eb8]/10 blur-[160px]"
      />


      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [
                  -90,
                  90,
                  -90,
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
        className="absolute bottom-[15%] left-[4%] h-[3px] w-[58%] rotate-[-7deg] bg-gradient-to-r from-transparent via-[#e31b2d]/60 to-transparent blur-[2px]"
      />


      <div className="relative mx-auto max-w-[1480px] px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-18 lg:pt-16">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] xl:items-center">
          {/* ================================================
              HERO COPY
          ================================================ */}

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    x:
                      -38,

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
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3.5 py-2 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#ff5261]" />

                <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[#cad5dd]">
                  VEH NEXA INTELLIGENCE
                </span>
              </span>


              <StageStatus
                session={
                  session
                }
                submitting={
                  submitting
                }
              />
            </div>


            <h1 className="mt-7 text-[54px] font-black leading-[0.91] tracking-[-0.065em] sm:text-[70px] lg:text-[82px]">
              Diagnose the
              <br />

              <span className="text-[#ff394a]">
                symptom.
              </span>
            </h1>


            <p className="mt-7 max-w-[680px] text-[12px] leading-6 text-[#a8b9c6] sm:text-[13px]">
              Describe what your vehicle is doing.
              Vehnexa processes the symptom,
              evaluates safety conditions, maps
              likely component regions and then
              connects those regions to compatible
              marketplace parts.
            </p>


            <div className="mt-8 flex flex-wrap gap-3">
              {vehicle ? (
                <div className="inline-flex min-h-12 items-center gap-3 rounded-[10px] border border-white/[0.10] bg-white/[0.045] px-4 backdrop-blur">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#e31b2d]/10 text-[#ff5966]">
                    <CarFront className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-[6px] font-black uppercase tracking-[0.12em] text-[#718798]">
                      DIAGNOSTIC VEHICLE
                    </p>

                    <p className="mt-0.5 text-[8px] font-black text-white">
                      {vehicle.year}{" "}
                      {vehicle.make}{" "}
                      {vehicle.model}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  href="/account/garage"
                  className="inline-flex h-12 items-center gap-2 rounded-[9px] border border-white/[0.12] bg-white/[0.05] px-5 text-[8px] font-black text-white"
                >
                  <CarFront className="h-4 w-4" />

                  Select diagnostic vehicle
                </Link>
              )}


              {session && (
                <motion.button
                  type="button"
                  onClick={
                    onNewDiagnosis
                  }
                  whileTap={
                    reduceMotion
                      ? undefined
                      : {
                          scale:
                            0.98,
                        }
                  }
                  className="inline-flex h-12 items-center gap-2 rounded-[9px] border border-white/[0.12] bg-white/[0.045] px-5 text-[8px] font-black text-white transition hover:bg-white/[0.09]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />

                  New diagnosis
                </motion.button>
              )}
            </div>
          </motion.div>


          {/* ================================================
              INTELLIGENCE CONTROL PANEL
          ================================================ */}

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

            <div
              aria-hidden="true"
              className="absolute -right-4 top-6 h-[220px] w-[220px] rounded-full border border-[#e31b2d]/10"
            />


            <div className="relative">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#718798]">
                    DIAGNOSTIC CONTROL
                  </p>

                  <h2 className="mt-2 text-[23px] font-black tracking-[-0.035em] text-white">
                    {submitting
                      ? "Vehicle analysis in progress"
                      : responseType ===
                          "analysis"
                        ? "Analysis ready"
                        : responseType ===
                            "follow_up"
                          ? "More symptom data needed"
                          : "Waiting for symptom input"}
                  </h2>
                </div>


                <motion.span
                  animate={
                    submitting &&
                    !reduceMotion
                      ? {
                          rotate:
                            360,
                        }
                      : undefined
                  }
                  transition={{
                    duration:
                      3,

                    repeat:
                      Infinity,

                    ease:
                      "linear",
                  }}
                  className={
                    submitting
                      ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ffb648]/20 bg-[#ffb648]/10 text-[#ffc467]"
                      : session
                        ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#61d49a]/20 bg-[#61d49a]/10 text-[#70dda7]"
                        : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-[#718798]"
                  }
                >
                  {submitting ? (
                    <Activity className="h-4.5 w-4.5" />
                  ) : session ? (
                    <BadgeCheck className="h-4.5 w-4.5" />
                  ) : (
                    <Bot className="h-4.5 w-4.5" />
                  )}
                </motion.span>
              </div>


              <div className="mt-7 grid grid-cols-2 gap-2">
                <DarkMetric
                  label="Conversation"
                  value={
                    session
                      ? `${session.messages.length} ${
                          session.messages.length ===
                          1
                            ? "message"
                            : "messages"
                        }`
                      : "Not started"
                  }
                />

                <DarkMetric
                  label="Components"
                  value={
                    String(
                      componentCount,
                    )
                  }
                />

                <DarkMetric
                  label="Part matches"
                  value={
                    String(
                      totalCompatibleProducts,
                    )
                  }
                />

                <DarkMetric
                  label="Safety"
                  value={
                    safetyLevel
                      ? formatLabel(
                          safetyLevel,
                        )
                      : "Standby"
                  }
                />
              </div>


              <div className="mt-5 rounded-[12px] border border-white/[0.08] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.11em] text-[#687f90]">
                      FIVE-STAGE ANALYSIS
                    </p>

                    <p className="mt-1.5 text-[9px] font-bold text-[#dbe4eb]">
                      {submitting
                        ? DIAGNOSTIC_STEPS[
                            Math.min(
                              4,
                              Math.max(
                                0,
                                0,
                              ),
                            )
                          ]
                        : session
                          ? "Latest server response ready"
                          : "Starts after your first symptom"}
                    </p>
                  </div>


                  <Zap className="h-4 w-4 text-[#ff5261]" />
                </div>


                <div className="mt-4 grid grid-cols-5 gap-1.5">
                  {DIAGNOSTIC_STEPS.map(
                    (
                      step,
                      index,
                    ) => (
                      <div
                        key={
                          step
                        }
                        className={
                          submitting
                            ? "h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
                            : session
                              ? "h-1.5 rounded-full bg-[#61d49a]/40"
                              : "h-1.5 rounded-full bg-white/[0.08]"
                        }
                      >
                        {submitting && (
                          <motion.div
                            animate={{
                              width:
                                "100%",
                            }}
                            transition={{
                              delay:
                                index *
                                0.22,

                              duration:
                                0.55,
                            }}
                            className="h-full bg-[#e31b2d]"
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   SIGNAL STRIP
============================================================ */

function AIExperienceSignals({
  vehicle,
  session,
  submitting,
}: {
  vehicle:
    Vehicle | null;

  session:
    AIMechanicSession | null;

  submitting:
    boolean;
}) {
  const turn =
    session?.latest_turn ??
    null;


  const productCount =
    session?.product_recommendations
      .reduce(
        (
          total,
          recommendation,
        ) =>
          total +
          recommendation
            .compatible_products
            .length,
        0,
      ) ??
    0;


  return (
    <section className="border-b border-[#e1e6ea] bg-white">
      <div className="mx-auto grid max-w-[1480px] sm:grid-cols-2 xl:grid-cols-4">
        <ExperienceSignal
          icon={
            CarFront
          }
          eyebrow="VEHICLE CONTEXT"
          title={
            vehicle
              ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
              : "Vehicle required"
          }
          detail="Diagnosis remains tied to the selected Garage vehicle."
        />


        <ExperienceSignal
          icon={
            Bot
          }
          eyebrow="AI SESSION"
          title={
            submitting
              ? "Analyzing"
              : session
                ? "Session active"
                : "Ready to begin"
          }
          detail="Conversation state is preserved between page visits."
        />


        <ExperienceSignal
          icon={
            ShieldCheck
          }
          eyebrow="SAFETY STATE"
          title={
            turn
              ? formatLabel(
                  turn.safety.level,
                )
              : "Not assessed"
          }
          detail="Safety guidance comes from the current diagnostic turn."
        />


        <ExperienceSignal
          icon={
            Package
          }
          eyebrow="FITMENT PARTS"
          title={`${productCount} ${
            productCount ===
            1
              ? "match"
              : "matches"
          }`}
          detail="Recommendations use Vehnexa vehicle-fitment data."
        />
      </div>
    </section>
  );
}


function ExperienceSignal({
  icon:
    Icon,
  eyebrow,
  title,
  detail,
}: {
  icon:
    LucideIcon;

  eyebrow:
    string;

  title:
    string;

  detail:
    string;
}) {
  return (
    <div className="group flex gap-4 border-b border-[#edf0f2] px-5 py-6 last:border-b-0 sm:border-r xl:border-b-0 xl:last:border-r-0 lg:px-8">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#e0e5e9] bg-[#f5f7f9] text-[#596b7a] transition duration-300 group-hover:border-[#efc8cc] group-hover:bg-[#fff0f1] group-hover:text-[#e31b2d]">
        <Icon className="h-[18px] w-[18px]" />
      </span>


      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.13em] text-[#98a2b3]">
          {
            eyebrow
          }
        </p>

        <p className="mt-1 truncate text-[11px] font-black tracking-[-0.015em] text-[#101828]">
          {
            title
          }
        </p>

        <p className="mt-1.5 text-[7px] leading-4 text-[#7b8794]">
          {
            detail
          }
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   CONVERSATION
============================================================ */

function ConversationPanel({
  session,
  draft,
  submitting,
  onDraftChange,
  onSubmit,
  messagesEndRef,
}: {
  session:
    AIMechanicSession | null;

  draft:
    string;

  submitting:
    boolean;

  onDraftChange:
    (value: string) => void;

  onSubmit:
    (
      event:
        FormEvent,
    ) => void;

  messagesEndRef:
    React.RefObject<HTMLDivElement | null>;
}) {
  const question =
    session?.latest_turn
      ?.follow_up_question ??
    null;


  return (
    <section className="flex min-h-[760px] flex-col overflow-hidden rounded-[20px] border border-[#d8dee6] bg-white shadow-[0_14px_42px_rgba(16,24,40,.055)]">
      <div className="border-b border-[#e6eaf0] bg-[#fbfcfd] px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#e31b2d]">
              SYMPTOM INPUT
            </p>

            <h3 className="mt-1.5 text-[14px] font-black tracking-[-0.02em] text-[#101828]">
              Diagnostic conversation
            </h3>

            <p className="mt-1 text-[8px] text-[#98a2b3]">
              Vehicle-specific troubleshooting
            </p>
          </div>


          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#071b2d] text-white">
            <MessageSquare className="h-4 w-4" />
          </span>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto px-4 py-5">
        {!session && (
          <div className="px-2 pb-4 pt-3">
            <motion.div
              animate={{
                y: [
                  0,
                  -4,
                  0,
                ],
              }}
              transition={{
                duration:
                  4,

                repeat:
                  Infinity,

                ease:
                  "easeInOut",
              }}
              className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#071b2d] text-white shadow-[0_12px_28px_rgba(7,27,45,.17)]"
            >
              <Bot className="h-5 w-5" />
            </motion.div>


            <h2 className="mt-5 text-[20px] font-black tracking-[-0.035em] text-[#101828]">
              What is your vehicle doing?
            </h2>


            <p className="mt-2 text-[10px] leading-5 text-[#667085]">
              Include when the symptom happens,
              what you hear or feel, warning
              lights, speed, temperature, or
              anything else that may help narrow
              the issue.
            </p>


            <div className="mt-6 space-y-2.5">
              <PromptExample>
                Steering wheel shakes when I brake at highway speed.
              </PromptExample>

              <PromptExample>
                The engine temperature rises while idling in traffic.
              </PromptExample>

              <PromptExample>
                The car hesitates under acceleration and the check engine light is on.
              </PromptExample>
            </div>
          </div>
        )}


        <AnimatePresence
          initial={false}
        >
          {session?.messages.map(
            (
              message,
              index,
            ) => (
              <motion.div
                key={`${message.created_at}-${index}`}
                initial={{
                  y:
                    10,
                }}
                animate={{
                  y:
                    0,
                }}
                className={`mb-5 flex ${
                  message.role ===
                  "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className="max-w-[90%]">
                  <div className="mb-1.5 flex items-center gap-2">
                    {message.role ===
                      "assistant" && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#071b2d] text-white">
                        <Bot className="h-3 w-3" />
                      </span>
                    )}


                    <span className="text-[7px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">
                      {message.role ===
                      "user"
                        ? "You"
                        : "Vehnexa AI"}
                    </span>
                  </div>


                  <div
                    className={`rounded-[14px] px-4 py-3 text-[10px] leading-5 ${
                      message.role ===
                      "user"
                        ? "rounded-br-[4px] bg-[#071b2d] text-white shadow-[0_10px_24px_rgba(7,27,45,.10)]"
                        : "rounded-bl-[4px] border border-[#e1e6ec] bg-[#f8fafc] text-[#344054]"
                    }`}
                  >
                    {
                      message.content
                    }
                  </div>
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>


        {question &&
          !submitting && (
          <motion.div
            initial={{
              y:
                8,
            }}
            animate={{
              y:
                0,
            }}
            className="mb-5 rounded-[12px] border border-[#cbdff0] bg-[#f2f8fd] p-4"
          >
            <div className="flex items-center gap-2">
              <CircleDot className="h-3.5 w-3.5 text-[#3b72a0]" />

              <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#49718e]">
                FOLLOW-UP NEEDED
              </p>
            </div>


            <p className="mt-2 text-[10px] font-bold leading-5 text-[#17354d]">
              {
                question
              }
            </p>
          </motion.div>
        )}


        {submitting && (
          <motion.div
            initial={{
              scale:
                0.96,
            }}
            animate={{
              scale:
                1,
            }}
            className="mb-4 flex items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#071b2d] text-white">
              <Bot className="h-4 w-4" />
            </span>


            <div className="flex items-center gap-1.5 rounded-[12px] border border-[#e4e7ec] bg-[#f8fafc] px-4 py-3">
              {[0, 1, 2].map(
                (
                  dot,
                ) => (
                  <motion.span
                    key={
                      dot
                    }
                    className="h-1.5 w-1.5 rounded-full bg-[#667085]"
                    animate={{
                      y: [
                        0,
                        -4,
                        0,
                      ],
                    }}
                    transition={{
                      duration:
                        0.8,

                      delay:
                        dot *
                        0.12,

                      repeat:
                        Infinity,
                    }}
                  />
                ),
              )}
            </div>
          </motion.div>
        )}


        <div
          ref={
            messagesEndRef
          }
        />
      </div>


      <form
        onSubmit={
          onSubmit
        }
        className="border-t border-[#e6eaf0] bg-[#fbfcfd] p-4"
      >
        <div className="rounded-[13px] border border-[#d0d5dd] bg-white p-2 shadow-sm transition focus-within:border-[#e31b2d]/50 focus-within:ring-4 focus-within:ring-[#e31b2d]/[0.04]">
          <textarea
            value={
              draft
            }
            onChange={(
              event,
            ) =>
              onDraftChange(
                event.target.value,
              )
            }
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                  "Enter" &&
                (
                  event.ctrlKey ||
                  event.metaKey
                )
              ) {
                event.preventDefault();

                event.currentTarget
                  .form
                  ?.requestSubmit();
              }
            }}
            disabled={
              submitting
            }
            rows={
              4
            }
            maxLength={
              2000
            }
            placeholder={
              question
                ? "Answer the follow-up question..."
                : session
                  ? "Ask a follow-up or describe another symptom..."
                  : "Describe the symptom..."
            }
            className="w-full resize-none border-0 bg-transparent px-2 py-2 text-[10px] leading-5 text-[#101828] outline-none placeholder:text-[#98a2b3]"
          />


          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            <p className="text-[7px] text-[#98a2b3]">
              Ctrl + Enter to send
            </p>


            <button
              type="submit"
              disabled={
                submitting ||
                !draft.trim()
              }
              className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#e31b2d] px-5 text-[8px] font-black text-white shadow-[0_8px_20px_rgba(227,27,45,.16)] transition hover:bg-[#c81727] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}


              {session
                ? "Continue"
                : "Analyze symptom"}
            </button>
          </div>
        </div>


        <p className="mt-3 text-[7px] leading-4 text-[#98a2b3]">
          Guidance only. Vehnexa does not replace inspection by a qualified automotive professional.
        </p>
      </form>
    </section>
  );
}


/* ============================================================
   VEHICLE INTELLIGENCE
============================================================ */

function VehicleIntelligenceStage({
  vehicle,
  session,
  selectedComponent,
  submitting,
  diagnosticStep,
}: {
  vehicle:
    Vehicle | null;

  session:
    AIMechanicSession | null;

  selectedComponent:
    AIComponentSuggestion | null;

  submitting:
    boolean;

  diagnosticStep:
    number;
}) {
  return (
    <section className="relative min-h-[760px] overflow-hidden rounded-[20px] border border-[#153047] bg-[#071b2d] text-white shadow-[0_20px_55px_rgba(7,27,45,.16)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.7] [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:30px_30px]"
      />


      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(53,111,160,.23),transparent_36%),radial-gradient(circle_at_82%_15%,rgba(227,27,45,.12),transparent_24%)]"
      />


      <div className="relative z-10 flex min-h-[760px] flex-col">
        <div className="flex items-center justify-between gap-5 border-b border-white/[0.07] px-5 py-5">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.16em] text-[#7890a4]">
              VEHICLE INTELLIGENCE
            </p>

            <p className="mt-1.5 text-[12px] font-black text-white">
              {vehicle
                ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                : "Diagnostic vehicle"}
            </p>

            {vehicle && (
              <p className="mt-1 text-[7px] text-[#718798]">
                {
                  vehicle.engine
                }
              </p>
            )}
          </div>


          <StageStatus
            session={
              session
            }
            submitting={
              submitting
            }
          />
        </div>


        <DiagnosticVehicleStage
          hotspotKey={
            selectedComponent
              ?.hotspot_key ??
            null
          }
          componentKey={
            selectedComponent
              ?.component_key ??
            null
          }
          componentLabel={
            selectedComponent
              ?.label ??
            null
          }
          relevance={
            selectedComponent
              ?.relevance ??
            null
          }
          analyzing={
            submitting
          }
          diagnosticStep={
            diagnosticStep
          }
          diagnosticLabel={
            DIAGNOSTIC_STEPS[
              diagnosticStep
            ] ??
            "Analyzing vehicle"
          }
        />


        <div className="relative z-20 border-t border-white/[0.07] px-5 py-5">
          {selectedComponent ? (
            <AnimatePresence
              mode="wait"
            >
              <motion.div
                key={
                  selectedComponent
                    .component_key
                }
                initial={{
                  y:
                    10,
                }}
                animate={{
                  y:
                    0,
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <RelevanceBadge
                    relevance={
                      selectedComponent
                        .relevance
                    }
                    dark
                  />

                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.11em] text-[#71889b]">
                    {
                      selectedComponent
                        .hotspot_key
                    }
                  </span>
                </div>


                <h3 className="mt-3 text-[20px] font-black tracking-[-0.03em]">
                  {
                    selectedComponent
                      .label
                  }
                </h3>


                <p className="mt-2 max-w-[650px] text-[9px] leading-5 text-[#9fb0bf]">
                  {
                    selectedComponent
                      .explanation
                  }
                </p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.05] text-[#71889b]">
                <Gauge className="h-4 w-4" />
              </span>


              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.16em] text-[#71889b]">
                  DIAGNOSTIC SURROGATE
                </p>

                <p className="mt-2 max-w-[590px] text-[9px] leading-5 text-[#9fb0bf]">
                  The diagnostic vehicle rotates
                  automatically. After analysis,
                  Vehnexa isolates a relevant
                  component region and focuses the
                  stage on the inspection area.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   COMPONENT INTELLIGENCE
============================================================ */

function IntelligenceRail({
  session,
  selectedComponentKey,
  onSelectComponent,
}: {
  session:
    AIMechanicSession | null;

  selectedComponentKey:
    string | null;

  onSelectComponent:
    (key: string) => void;
}) {
  const components =
    session?.latest_turn
      ?.components ??
    [];


  return (
    <aside className="min-h-[760px] overflow-hidden rounded-[20px] border border-[#d8dee6] bg-white shadow-[0_14px_42px_rgba(16,24,40,.055)]">
      <div className="border-b border-[#e6eaf0] bg-[#fbfcfd] px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#e31b2d]">
              SYSTEM MAPPING
            </p>

            <h3 className="mt-1.5 text-[14px] font-black text-[#101828]">
              Component intelligence
            </h3>

            <p className="mt-1 text-[8px] text-[#98a2b3]">
              Server-normalized component regions
            </p>
          </div>


          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2f4f7] text-[#667085]">
            <Wrench className="h-4 w-4" />
          </span>
        </div>
      </div>


      <div className="p-4">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <RailMetric
            label="Regions"
            value={
              String(
                components.length,
              )
            }
          />

          <RailMetric
            label="High relevance"
            value={
              String(
                components.filter(
                  (
                    component,
                  ) =>
                    component.relevance ===
                    "high",
                ).length,
              )
            }
          />
        </div>


        {components.length ===
        0 ? (
          <div className="flex min-h-[430px] flex-col items-center justify-center px-5 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#f2f4f7] text-[#98a2b3]">
              <Wrench className="h-5 w-5" />
            </span>


            <p className="mt-5 text-[11px] font-black text-[#475467]">
              No component map yet
            </p>


            <p className="mt-2 max-w-[260px] text-[8px] leading-4 text-[#98a2b3]">
              Likely inspection areas appear
              after Vehnexa has enough symptom
              information to produce a normalized
              component map.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {components.map(
              (
                component,
                index,
              ) => {
                const active =
                  component
                    .component_key ===
                  selectedComponentKey;


                return (
                  <motion.button
                    key={
                      component
                        .component_key
                    }
                    type="button"
                    onClick={() =>
                      onSelectComponent(
                        component
                          .component_key,
                      )
                    }
                    initial={{
                      x:
                        12,
                    }}
                    animate={{
                      x:
                        0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.05,
                    }}
                    className={`w-full rounded-[13px] border p-4 text-left transition ${
                      active
                        ? "border-[#173e5d] bg-[#071b2d] shadow-[0_12px_28px_rgba(7,27,45,.13)]"
                        : "border-[#e2e7ed] bg-white hover:border-[#c4ccd4] hover:bg-[#fbfcfd]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] ${
                            active
                              ? "bg-white/[0.08] text-[#ff5966]"
                              : "bg-[#f2f4f7] text-[#667085]"
                          }`}
                        >
                          <Wrench className="h-4 w-4" />
                        </span>


                        <div className="min-w-0">
                          <p
                            className={`truncate text-[9px] font-black ${
                              active
                                ? "text-white"
                                : "text-[#1d2939]"
                            }`}
                          >
                            {
                              component.label
                            }
                          </p>

                          <p
                            className={`mt-1 truncate text-[7px] ${
                              active
                                ? "text-[#8197a9]"
                                : "text-[#98a2b3]"
                            }`}
                          >
                            {
                              component
                                .hotspot_key
                            }
                          </p>
                        </div>
                      </div>


                      <RelevanceBadge
                        relevance={
                          component
                            .relevance
                        }
                        dark={
                          active
                        }
                      />
                    </div>


                    <p
                      className={`mt-3 line-clamp-3 text-[8px] leading-4 ${
                        active
                          ? "text-[#a7b6c3]"
                          : "text-[#667085]"
                      }`}
                    >
                      {
                        component
                          .explanation
                      }
                    </p>
                  </motion.button>
                );
              },
            )}
          </div>
        )}
      </div>
    </aside>
  );
}


/* ============================================================
   SAFETY + CAUSES
============================================================ */

function SafetyAndCauses({
  session,
}: {
  session:
    AIMechanicSession | null;
}) {
  const turn =
    session?.latest_turn ??
    null;


  if (!turn) {
    return null;
  }


  return (
    <section className="mt-12">
      <div className="mb-7">
        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
          DIAGNOSTIC INTERPRETATION
        </p>

        <h2 className="mt-3 text-[32px] font-black tracking-[-0.04em] text-[#101828] sm:text-[40px]">
          Safety first. Causes second.
        </h2>

        <p className="mt-3 max-w-[700px] text-[9px] leading-5 text-[#667085]">
          Vehnexa separates safety guidance from
          possible mechanical causes so urgency
          remains visible while the diagnostic
          picture develops.
        </p>
      </div>


      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <SafetyCard
          level={
            turn.safety.level
          }
          message={
            turn.safety.message
          }
        />


        <div className="rounded-[20px] border border-[#d8dee6] bg-white p-6 shadow-[0_12px_40px_rgba(16,24,40,.045)]">
          <div className="flex items-center justify-between gap-5">
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#e31b2d]">
                POSSIBLE CAUSES
              </p>

              <h3 className="mt-1.5 text-[15px] font-black text-[#101828]">
                Areas worth inspecting
              </h3>

              <p className="mt-1 text-[8px] text-[#98a2b3]">
                Based on the symptom information in the current turn
              </p>
            </div>


            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#f2f4f7] text-[#667085]">
              <Gauge className="h-4.5 w-4.5" />
            </span>
          </div>


          {turn.possible_causes
            .length ===
          0 ? (
            <div className="mt-7 rounded-[13px] border border-dashed border-[#d9dfe5] bg-[#fafbfc] px-5 py-10 text-center">
              <p className="text-[9px] text-[#98a2b3]">
                More symptom information is
                required before possible causes
                can be shown.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {turn.possible_causes.map(
                (
                  cause,
                  index,
                ) => (
                  <motion.article
                    key={`${cause.cause}-${index}`}
                    initial={{
                      y:
                        10,
                    }}
                    animate={{
                      y:
                        0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.05,
                    }}
                    className="rounded-[13px] border border-[#e3e7ec] bg-[#fbfcfd] p-4 transition hover:border-[#d2d9e0] hover:bg-white hover:shadow-[0_10px_26px_rgba(16,24,40,.045)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[10px] font-black text-[#1d2939]">
                        {
                          cause.cause
                        }
                      </p>


                      <RelevanceBadge
                        relevance={
                          cause.relevance
                        }
                      />
                    </div>


                    <p className="mt-2 text-[8px] leading-4 text-[#667085]">
                      {
                        cause.explanation
                      }
                    </p>
                  </motion.article>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   SAFETY CARD
============================================================ */

function SafetyCard({
  level,
  message,
}: {
  level:
    SafetyLevel;

  message:
    string;
}) {
  const styles = {
    normal: {
      border:
        "border-[#cce8d7]",

      background:
        "bg-[#f2fbf6]",

      icon:
        "bg-[#dff4e7] text-[#16804a]",

      eyebrow:
        "text-[#16804a]",

      title:
        "Normal guidance",

      description:
        "No elevated safety state was identified from the current conversation.",
    },

    caution: {
      border:
        "border-[#efd7a7]",

      background:
        "bg-[#fffaf0]",

      icon:
        "bg-[#fff0c7] text-[#a15c00]",

      eyebrow:
        "text-[#a15c00]",

      title:
        "Use caution",

      description:
        "The reported symptom may justify limiting continued driving until inspected.",
    },

    urgent: {
      border:
        "border-[#efb8bd]",

      background:
        "bg-[#fff4f5]",

      icon:
        "bg-[#ffe0e3] text-[#c51f32]",

      eyebrow:
        "text-[#c51f32]",

      title:
        "Urgent safety guidance",

      description:
        "The reported condition may affect safe vehicle operation.",
    },
  } as const;


  const style =
    styles[level];


  return (
    <motion.div
      whileHover={{
        y:
          -4,
      }}
      className={`relative overflow-hidden rounded-[20px] border p-6 shadow-[0_12px_40px_rgba(16,24,40,.04)] ${style.border} ${style.background}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] ${style.icon}`}
        >
          {level ===
          "urgent" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </span>


        <div>
          <p
            className={`text-[7px] font-black uppercase tracking-[0.16em] ${style.eyebrow}`}
          >
            SAFETY ASSESSMENT
          </p>

          <h3 className="mt-1.5 text-[18px] font-black tracking-[-0.025em] text-[#101828]">
            {
              style.title
            }
          </h3>

          <p className="mt-2 text-[8px] leading-4 text-[#667085]">
            {
              style.description
            }
          </p>
        </div>
      </div>


      <div className="mt-6 rounded-[12px] border border-black/[0.05] bg-white/75 px-4 py-4">
        <p className="text-[10px] font-semibold leading-5 text-[#344054]">
          {
            message
          }
        </p>
      </div>
    </motion.div>
  );
}


/* ============================================================
   PRODUCT RECOMMENDATIONS
============================================================ */

function ProductRecommendations({
  session,
  component,
  recommendation,
}: {
  session:
    AIMechanicSession | null;

  component:
    AIComponentSuggestion | null;

  recommendation:
    AIMechanicSession["product_recommendations"][number] | null;
}) {
  if (
    !session ||
    !component
  ) {
    return null;
  }


  const products =
    recommendation
      ?.compatible_products ??
    [];


  return (
    <section className="mt-12 overflow-hidden rounded-[22px] border border-[#d8dee6] bg-white shadow-[0_14px_44px_rgba(16,24,40,.045)]">
      <div className="relative overflow-hidden bg-[#071b2d] px-6 py-8 text-white sm:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-36 h-96 w-96 rounded-full bg-[#e31b2d]/15 blur-[90px]"
        />


        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#ff5966]" />

              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-[#ff5966]">
                VEH NEXA MARKETPLACE
              </p>
            </div>


            <h2 className="mt-3 text-[27px] font-black tracking-[-0.04em] sm:text-[34px]">
              Compatible parts for{" "}
              {
                component.label
              }
            </h2>


            <p className="mt-3 max-w-[680px] text-[9px] leading-5 text-[#9fb0bd]">
              These products come from Vehnexa&apos;s
              vehicle-fitment data for the
              diagnostic component region, not
              from an invented AI catalog.
            </p>
          </div>


          <Link
            href={`/shop?vehicleId=${encodeURIComponent(
              session.vehicle_id,
            )}&fits=true`}
            className="group inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-[8px] border border-white/[0.12] bg-white/[0.05] px-5 text-[8px] font-black text-white transition hover:bg-white/[0.09] lg:self-auto"
          >
            Browse all compatible parts

            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>


      {products.length ===
      0 ? (
        <div className="flex min-h-[300px] items-center justify-center px-6 py-12">
          <div className="max-w-[470px] text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#f2f4f7] text-[#98a2b3]">
              <Package className="h-6 w-6" />
            </span>


            <h3 className="mt-5 text-[14px] font-black text-[#344054]">
              No matching catalog product currently available
            </h3>


            <p className="mt-3 text-[9px] leading-5 text-[#98a2b3]">
              Vehnexa identified this component
              area, but the current fitment
              dataset does not contain a compatible
              product in this subcategory.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 p-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map(
            (
              product,
              index,
            ) => (
              <ProductRecommendationCard
                key={
                  product.id
                }
                product={
                  product
                }
                index={
                  index
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}


/* ============================================================
   PRODUCT CARD
============================================================ */

function ProductRecommendationCard({
  product,
  index,
}: {
  product:
    Product;

  index:
    number;
}) {
  const reduceMotion =
    useReducedMotion();


  const effectivePrice =
    getEffectivePrice(
      product,
    );


  const onSale =
    product.sale_price !==
      null &&
    product.sale_price <
      product.price;


  const image =
    product.images[0]
      ?.trim() ||
    null;


  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : {
              y:
                20,

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
      transition={{
        delay:
          reduceMotion
            ? 0
            : index *
              0.05,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y:
                -6,
            }
      }
      className="group overflow-hidden rounded-[16px] border border-[#e0e5eb] bg-white transition hover:border-[#c5cdd5] hover:shadow-[0_18px_40px_rgba(16,24,40,.08)]"
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative flex h-[220px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#f6f8fa_68%,#edf1f4_100%)]"
      >
        <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-[#bde3ca] bg-white/90 px-2.5 py-1.5 text-[6px] font-black uppercase tracking-[0.07em] text-[#16804a] shadow-sm backdrop-blur">
          <CheckCircle2 className="h-3 w-3" />

          FITMENT MATCH
        </span>


        {onSale && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-[#e31b2d] px-2.5 py-1.5 text-[6px] font-black text-white">
            SALE
          </span>
        )}


        {image ? (
          <div
            role="img"
            aria-label={
              product.name
            }
            className="h-full w-full bg-contain bg-center bg-no-repeat p-5 transition duration-500 group-hover:scale-[1.045]"
            style={{
              backgroundImage:
                `url("${image}")`,
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#aab3bd]">
            <Package className="h-8 w-8" />

            <span className="text-[7px] font-bold">
              Product image unavailable
            </span>
          </div>
        )}
      </Link>


      <div className="p-5">
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">
          {
            product
              .subcategory_slug
          }
        </p>


        <Link
          href={`/product/${product.slug}`}
        >
          <h3 className="mt-2 line-clamp-2 min-h-[42px] text-[12px] font-black leading-[19px] text-[#1d2939] transition group-hover:text-[#e31b2d]">
            {
              product.name
            }
          </h3>
        </Link>


        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[19px] font-black tracking-[-0.03em] text-[#101828]">
                $
                {formatPrice(
                  effectivePrice,
                )}
              </span>


              {onSale && (
                <span className="text-[8px] font-semibold text-[#98a2b3] line-through">
                  $
                  {formatPrice(
                    product.price,
                  )}
                </span>
              )}
            </div>


            <p
              className={`mt-1 text-[7px] font-bold ${
                product
                  .stock_quantity >
                0
                  ? "text-[#16804a]"
                  : "text-[#b42318]"
              }`}
            >
              {product
                .stock_quantity >
              0
                ? `${product.stock_quantity} in stock`
                : "Out of stock"}
            </p>
          </div>


          <Link
            href={`/product/${product.slug}`}
            className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#071b2d] text-white transition hover:bg-[#e31b2d]"
            aria-label={`Open ${product.name}`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}


/* ============================================================
   STAGE STATUS
============================================================ */

function StageStatus({
  session,
  submitting,
}: {
  session:
    AIMechanicSession | null;

  submitting:
    boolean;
}) {
  if (submitting) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#5b4b31] bg-[#ffb648]/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.10em] text-[#ffc467]">
        <Loader2 className="h-3 w-3 animate-spin" />

        Processing
      </span>
    );
  }


  if (
    session?.latest_turn
      ?.response_type ===
    "analysis"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#25533d] bg-[#32c275]/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.10em] text-[#64df9a]">
        <CheckCircle2 className="h-3 w-3" />

        Analysis ready
      </span>
    );
  }


  if (
    session?.latest_turn
      ?.response_type ===
    "follow_up"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#284b68] bg-[#4d9ee8]/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.10em] text-[#72b5ef]">
        <CircleDot className="h-3 w-3" />

        More data needed
      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.10em] text-[#8fa3b4]">
      <Zap className="h-3 w-3" />

      Standby
    </span>
  );
}


/* ============================================================
   RELEVANCE
============================================================ */

function RelevanceBadge({
  relevance,
  dark =
    false,
}: {
  relevance:
    RelevanceLevel;

  dark?:
    boolean;
}) {
  const styles = {
    high:
      dark
        ? "bg-[#e31b2d]/20 text-[#ff7885]"
        : "bg-[#fff0f1] text-[#d82133]",

    medium:
      dark
        ? "bg-[#f5a623]/15 text-[#ffc267]"
        : "bg-[#fff7e8] text-[#a15c00]",

    low:
      dark
        ? "bg-white/[0.08] text-[#afbdc9]"
        : "bg-[#f2f4f7] text-[#667085]",
  };


  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[6px] font-black uppercase tracking-[0.08em] ${styles[relevance]}`}
    >
      {
        relevance
      }
    </span>
  );
}


/* ============================================================
   PROMPT EXAMPLE
============================================================ */

function PromptExample({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-[11px] border border-[#e4e7ec] bg-[#fbfcfd] p-3.5">
      <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e31b2d]" />

      <p className="text-[8px] leading-4 text-[#667085]">
        {
          children
        }
      </p>
    </div>
  );
}


/* ============================================================
   NO VEHICLE
============================================================ */

function NoActiveVehicle() {
  const reduceMotion =
    useReducedMotion();


  return (
    <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-[24px] border border-[#d8dee6] bg-white px-6 py-14 shadow-[0_14px_44px_rgba(16,24,40,.045)]">
      <div
        aria-hidden="true"
        className="absolute h-[450px] w-[450px] rounded-full border border-[#edf0f2]"
      />

      <div
        aria-hidden="true"
        className="absolute h-[310px] w-[310px] rounded-full border border-[#f1d9db]"
      />


      <div className="relative z-10 max-w-[520px] text-center">
        <motion.span
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [
                    0,
                    -9,
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
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[20px] bg-[#071b2d] text-white shadow-[0_18px_42px_rgba(7,27,45,.17)]"
        >
          <CarFront className="h-8 w-8" />
        </motion.span>


        <p className="mt-7 text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
          VEHICLE REQUIRED
        </p>


        <h2 className="mt-3 text-[30px] font-black tracking-[-0.045em] text-[#101828]">
          Choose your diagnostic vehicle.
        </h2>


        <p className="mt-4 text-[10px] leading-5 text-[#667085]">
          AI Mechanic is vehicle-specific. Set
          an active vehicle in My Garage before
          starting a diagnostic session so
          Vehnexa can preserve the correct
          vehicle context.
        </p>


        <Link
          href="/account/garage"
          className="group mx-auto mt-7 inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#e31b2d] px-6 text-[8px] font-black text-white transition hover:bg-[#c81727]"
        >
          <CarFront className="h-4 w-4" />

          Open My Garage

          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}


/* ============================================================
   SMALL METRICS
============================================================ */

function DarkMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[9px] border border-white/[0.07] bg-black/10 p-3">
      <p className="text-[6px] font-black uppercase tracking-[0.11em] text-[#657b8c]">
        {
          label
        }
      </p>

      <p className="mt-1 truncate text-[9px] font-black text-[#dbe4eb]">
        {
          value
        }
      </p>
    </div>
  );
}


function RailMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[9px] border border-[#e5e9ed] bg-[#fafbfc] p-3">
      <p className="text-[6px] font-black uppercase tracking-[0.10em] text-[#98a2b3]">
        {
          label
        }
      </p>

      <p className="mt-1 text-[14px] font-black text-[#344054]">
        {
          value
        }
      </p>
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
          className="flex shrink-0 items-center gap-2.5"
        >
          <VehnexaMark />

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
          />

          <TopNavLink
            href="/ai-mechanic"
            label="AI Mechanic"
            active
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
          >
            <ShoppingCart className="h-[16px] w-[16px]" />
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
   FORMATTERS
============================================================ */

function formatPrice(
  value:
    number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}


function formatLabel(
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
