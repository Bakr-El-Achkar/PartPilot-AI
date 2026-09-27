"use client";

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
} from "framer-motion";

import {
  AlertTriangle,
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
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserRound,
  Wrench,
  Zap,
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
      <main className="flex min-h-screen items-center justify-center bg-[#edf1f5]">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border border-[#d0d5dd]" />

            <motion.div
              className="absolute inset-[6px] rounded-full border-2 border-transparent border-t-[#e31b2d]"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            <Zap className="absolute inset-0 m-auto h-5 w-5 text-[#071b2d]" />
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#667085]">
            Initializing Vehnexa Intelligence
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#edf1f5] text-[#101828]">
      <VehnexaNavbar />

      <section className="mx-auto max-w-[1480px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
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


        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-4 flex items-start gap-3 rounded-xl border border-[#f0b8be] bg-[#fff5f6] px-4 py-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c51f32]" />

            <div>
              <p className="text-[11px] font-semibold text-[#a7192a]">
                AI Mechanic request could not be completed
              </p>

              <p className="mt-1 text-[10px] leading-5 text-[#8c2633]">
                {error}
              </p>
            </div>
          </motion.div>
        )}


        {!activeVehicle &&
        !session ? (
          <NoActiveVehicle />
        ) : (
          <>
            <div className="mt-5 grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)_330px]">
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
  return (
    <section className="relative overflow-hidden rounded-[22px] border border-[#15334d] bg-[#061827] px-5 py-6 text-white shadow-[0_20px_60px_rgba(7,27,45,0.13)] sm:px-7 lg:px-9 lg:py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 82% 10%, rgba(227,27,45,0.20), transparent 26%), radial-gradient(circle at 30% 120%, rgba(48,110,170,0.18), transparent 35%)",
        }}
      />

      <div className="pointer-events-none absolute right-[-100px] top-[-120px] h-[340px] w-[340px] rounded-full border border-white/[0.04]" />

      <div className="pointer-events-none absolute right-[-45px] top-[-70px] h-[240px] w-[240px] rounded-full border border-white/[0.05]" />


      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center gap-2 rounded-full border border-[#304b62] bg-white/[0.05] px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-[#cbd8e3]">
              <Sparkles className="h-3 w-3 text-[#ff5363]" />

              Vehnexa Intelligence
            </span>

            <span className="flex h-7 items-center gap-2 rounded-full border border-[#304b62] bg-white/[0.04] px-3 text-[9px] font-semibold text-[#9fb0bf]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  submitting
                    ? "animate-pulse bg-[#ffb648]"
                    : "bg-[#4bd68a]"
                }`}
              />

              {submitting
                ? "Analyzing"
                : "Ready"}
            </span>
          </div>


          <h1 className="mt-5 max-w-[750px] text-[34px] font-bold tracking-[-0.045em] sm:text-[42px] lg:text-[48px]">
            AI Mechanic
          </h1>

          <p className="mt-2 max-w-[670px] text-[12px] leading-6 text-[#aabac8] sm:text-[13px]">
            Describe what your vehicle is doing.
            Vehnexa analyzes the symptom,
            maps likely component regions,
            evaluates safety conditions and
            connects the result to your vehicle&apos;s
            compatible marketplace parts.
          </p>
        </div>


        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {vehicle && (
            <div className="flex min-w-[260px] items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.05] px-4 py-3 backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.07]">
                <CarFront className="h-5 w-5 text-[#ff5363]" />
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#71879a]">
                  Diagnostic Vehicle
                </p>

                <p className="mt-1 truncate text-[11px] font-semibold text-white">
                  {vehicle.year}{" "}
                  {vehicle.make}{" "}
                  {vehicle.model}
                </p>

                <p className="mt-0.5 truncate text-[9px] text-[#91a4b4]">
                  {vehicle.engine}
                </p>
              </div>
            </div>
          )}


          {session && (
            <button
              type="button"
              onClick={
                onNewDiagnosis
              }
              className="flex h-[52px] items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-5 text-[10px] font-semibold text-white transition hover:bg-white/[0.09]"
            >
              <RefreshCw className="h-3.5 w-3.5" />

              New Diagnosis
            </button>
          )}
        </div>
      </div>
    </section>
  );
}


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
      event: FormEvent,
    ) => void;

  messagesEndRef:
    React.RefObject<HTMLDivElement | null>;
}) {
  const question =
    session?.latest_turn
      ?.follow_up_question ??
    null;


  return (
    <section className="flex min-h-[680px] flex-col overflow-hidden rounded-[18px] border border-[#d8dee6] bg-white shadow-[0_10px_35px_rgba(16,24,40,0.05)]">
      <div className="border-b border-[#e6eaf0] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#101828]">
              Diagnostic Conversation
            </p>

            <p className="mt-1 text-[9px] text-[#98a2b3]">
              Vehicle-specific troubleshooting
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2f4f7]">
            <MessageSquare className="h-4 w-4 text-[#667085]" />
          </div>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto px-4 py-5">
        {!session && (
          <div className="px-2 pt-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#071b2d] shadow-[0_10px_25px_rgba(7,27,45,0.16)]">
              <Bot className="h-5 w-5 text-white" />
            </div>

            <h2 className="mt-5 text-[18px] font-bold tracking-[-0.025em] text-[#101828]">
              What is your vehicle doing?
            </h2>

            <p className="mt-2 text-[11px] leading-6 text-[#667085]">
              Include when the symptom happens,
              what you hear or feel, warning lights,
              speed, temperature or anything else
              that may help narrow the issue.
            </p>


            <div className="mt-6 space-y-2">
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


        <AnimatePresence initial={false}>
          {session?.messages.map(
            (
              message,
              index,
            ) => (
              <motion.div
                key={`${message.created_at}-${index}`}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className={`mb-5 flex ${
                  message.role ===
                  "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] ${
                    message.role ===
                    "user"
                      ? "order-1"
                      : ""
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    {message.role ===
                    "assistant" && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#071b2d]">
                        <Bot className="h-3 w-3 text-white" />
                      </span>
                    )}

                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">
                      {message.role ===
                      "user"
                        ? "You"
                        : "Vehnexa AI"}
                    </span>
                  </div>

                  <div
                    className={`rounded-[14px] px-4 py-3 text-[11px] leading-6 ${
                      message.role ===
                      "user"
                        ? "rounded-br-[4px] bg-[#071b2d] text-white"
                        : "rounded-bl-[4px] border border-[#e1e6ec] bg-[#f8fafc] text-[#344054]"
                    }`}
                  >
                    {message.content}
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
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mb-5 rounded-xl border border-[#d6e4f2] bg-[#f4f9fd] p-4"
            >
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#49718e]">
                Follow-up needed
              </p>

              <p className="mt-2 text-[11px] font-semibold leading-5 text-[#17354d]">
                {question}
              </p>
            </motion.div>
          )}


        {submitting && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mb-4 flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071b2d]">
              <Bot className="h-4 w-4 text-white" />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-4 py-3">
              {[0, 1, 2].map(
                (dot) => (
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
        <div className="rounded-[14px] border border-[#d0d5dd] bg-white p-2 shadow-sm transition focus-within:border-[#7b91a6]">
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
            rows={3}
            maxLength={2000}
            placeholder={
              question
                ? "Answer the follow-up question..."
                : session
                  ? "Ask a follow-up or describe another symptom..."
                  : "Describe the symptom..."
            }
            className="w-full resize-none border-0 bg-transparent px-2 py-2 text-[11px] leading-5 text-[#101828] outline-none placeholder:text-[#98a2b3]"
          />


          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            <p className="text-[8px] text-[#98a2b3]">
              Ctrl + Enter to send
            </p>

            <button
              type="submit"
              disabled={
                submitting ||
                !draft.trim()
              }
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#e31b2d] px-4 text-[9px] font-bold text-white transition hover:bg-[#c81727] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}

              {session
                ? "Continue"
                : "Analyze"}
            </button>
          </div>
        </div>

        <p className="mt-2.5 text-[8px] leading-4 text-[#98a2b3]">
          Guidance only. Vehnexa does not replace inspection by a qualified automotive professional.
        </p>
      </form>
    </section>
  );
}


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
    <section className="relative min-h-[680px] overflow-hidden rounded-[18px] border border-[#153047] bg-[#071b2d] text-white shadow-[0_18px_50px_rgba(7,27,45,0.15)]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",

          backgroundSize:
            "28px 28px",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(53,111,160,0.23), transparent 36%), radial-gradient(circle at 82% 15%, rgba(227,27,45,0.12), transparent 24%)",
        }}
      />


      <div className="relative z-10 flex h-full min-h-[680px] flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7890a4]">
              Vehicle Intelligence
            </p>

            <p className="mt-1 text-[12px] font-semibold text-white">
              {vehicle
                ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                : "Vehicle"}
            </p>
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
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  selectedComponent
                    .component_key
                }
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#e31b2d] px-2.5 py-1 text-[7px] font-bold uppercase tracking-[0.12em] text-white">
                    {
                      selectedComponent
                        .relevance
                    }{" "}
                    relevance
                  </span>

                  <span className="text-[8px] uppercase tracking-[0.12em] text-[#71889b]">
                    {
                      selectedComponent
                        .hotspot_key
                    }
                  </span>
                </div>

                <h3 className="mt-3 text-[18px] font-bold tracking-[-0.025em]">
                  {
                    selectedComponent
                      .label
                  }
                </h3>

                <p className="mt-2 max-w-[620px] text-[10px] leading-5 text-[#9fb0bf]">
                  {
                    selectedComponent
                      .explanation
                  }
                </p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#71889b]">
                Diagnostic stage
              </p>

              <p className="mt-2 max-w-[590px] text-[11px] leading-5 text-[#9fb0bf]">
                The 3D diagnostic vehicle rotates automatically. After analysis, Vehnexa isolates the relevant system and focuses the camera on the inspection area.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


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
    <aside className="min-h-[680px] overflow-hidden rounded-[18px] border border-[#d8dee6] bg-white shadow-[0_10px_35px_rgba(16,24,40,0.05)]">
      <div className="border-b border-[#e6eaf0] px-5 py-4">
        <p className="text-[12px] font-bold text-[#101828]">
          Component Intelligence
        </p>

        <p className="mt-1 text-[9px] text-[#98a2b3]">
          Server-normalized component mapping
        </p>
      </div>


      <div className="p-4">
        {components.length ===
        0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2f4f7]">
              <Wrench className="h-5 w-5 text-[#98a2b3]" />
            </div>

            <p className="mt-4 text-[11px] font-semibold text-[#475467]">
              No component map yet
            </p>

            <p className="mt-2 text-[9px] leading-5 text-[#98a2b3]">
              Likely inspection areas will appear after Vehnexa has enough symptom information.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
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
                      opacity: 0,
                      x: 10,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.06,
                    }}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      active
                        ? "border-[#173e5d] bg-[#071b2d] shadow-[0_8px_22px_rgba(7,27,45,0.12)]"
                        : "border-[#e2e7ed] bg-white hover:border-[#b7c2cd] hover:bg-[#fbfcfd]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? "bg-white/[0.08]"
                              : "bg-[#f2f4f7]"
                          }`}
                        >
                          <Wrench
                            className={`h-4 w-4 ${
                              active
                                ? "text-[#ff5c6c]"
                                : "text-[#667085]"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-[10px] font-bold ${
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
                            className={`mt-1 truncate text-[8px] ${
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
                      className={`mt-3 line-clamp-3 text-[9px] leading-5 ${
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
    <section className="mt-5 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
      <SafetyCard
        level={
          turn.safety.level
        }
        message={
          turn.safety.message
        }
      />


      <div className="rounded-[18px] border border-[#d8dee6] bg-white p-5 shadow-[0_10px_35px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#101828]">
              Possible Causes
            </p>

            <p className="mt-1 text-[9px] text-[#98a2b3]">
              Areas worth inspecting based on the reported symptom
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2f4f7]">
            <Gauge className="h-4 w-4 text-[#667085]" />
          </div>
        </div>


        {turn.possible_causes
          .length === 0 ? (
          <p className="mt-5 text-[10px] text-[#98a2b3]">
            More symptom information is required before possible causes can be shown.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {turn.possible_causes.map(
              (
                cause,
                index,
              ) => (
                <motion.article
                  key={`${cause.cause}-${index}`}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.05,
                  }}
                  className="rounded-xl border border-[#e3e7ec] bg-[#fbfcfd] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] font-bold text-[#1d2939]">
                      {cause.cause}
                    </p>

                    <RelevanceBadge
                      relevance={
                        cause.relevance
                      }
                    />
                  </div>

                  <p className="mt-2 text-[9px] leading-5 text-[#667085]">
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
    </section>
  );
}


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
    <div
      className={`rounded-[18px] border p-5 ${style.border} ${style.background}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          {level ===
          "urgent" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </div>

        <div>
          <p
            className={`text-[8px] font-bold uppercase tracking-[0.16em] ${style.eyebrow}`}
          >
            Safety assessment
          </p>

          <h3 className="mt-1.5 text-[15px] font-bold tracking-[-0.02em] text-[#101828]">
            {style.title}
          </h3>

          <p className="mt-1 text-[9px] leading-5 text-[#667085]">
            {
              style.description
            }
          </p>
        </div>
      </div>


      <div className="mt-4 rounded-xl border border-black/[0.05] bg-white/70 px-4 py-3">
        <p className="text-[10px] font-medium leading-5 text-[#344054]">
          {message}
        </p>
      </div>
    </div>
  );
}


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
    <section className="mt-5 overflow-hidden rounded-[18px] border border-[#d8dee6] bg-white shadow-[0_10px_35px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-4 border-b border-[#e6eaf0] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#e31b2d]" />

            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#e31b2d]">
              Vehnexa Marketplace
            </p>
          </div>

          <h2 className="mt-2 text-[20px] font-bold tracking-[-0.03em] text-[#101828]">
            Compatible parts for{" "}
            {component.label}
          </h2>

          <p className="mt-1 text-[9px] text-[#667085]">
            Products below come from Vehnexa&apos;s vehicle fitment data, not from the AI model.
          </p>
        </div>


        <Link
          href={`/shop?vehicleId=${encodeURIComponent(
            session.vehicle_id,
          )}&fits=true`}
          className="flex h-9 w-fit items-center justify-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-4 text-[9px] font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
        >
          Browse all compatible parts

          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>


      {products.length ===
      0 ? (
        <div className="flex min-h-[210px] items-center justify-center px-6 py-10">
          <div className="max-w-[450px] text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2f4f7]">
              <Package className="h-5 w-5 text-[#98a2b3]" />
            </div>

            <h3 className="mt-4 text-[12px] font-bold text-[#344054]">
              No matching catalog product currently available
            </h3>

            <p className="mt-2 text-[9px] leading-5 text-[#98a2b3]">
              Vehnexa found this component area, but the current fitment dataset does not contain a compatible product in this subcategory.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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


function ProductRecommendationCard({
  product,
  index,
}: {
  product:
    Product;

  index:
    number;
}) {
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
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay:
          index *
          0.06,
      }}
      className="group overflow-hidden rounded-xl border border-[#e0e5eb] bg-white transition hover:-translate-y-0.5 hover:border-[#bcc6d0] hover:shadow-[0_12px_30px_rgba(16,24,40,0.08)]"
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative flex h-[155px] items-center justify-center overflow-hidden bg-[#f6f8fa]"
      >
        <span className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-[#bde3ca] bg-[#effbf3] px-2 py-1 text-[7px] font-bold text-[#16804a]">
          <CheckCircle2 className="h-2.5 w-2.5" />

          Vehnexa fitment match
        </span>


        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              image
            }
            alt={
              product.name
            }
            className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#aab3bd]">
            <Package className="h-8 w-8" />

            <span className="text-[8px]">
              Product image unavailable
            </span>
          </div>
        )}
      </Link>


      <div className="p-4">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">
          {
            product
              .subcategory_slug
          }
        </p>

        <Link
          href={`/product/${product.slug}`}
        >
          <h3 className="mt-1.5 line-clamp-2 min-h-[38px] text-[11px] font-bold leading-[18px] text-[#1d2939] transition group-hover:text-[#e31b2d]">
            {
              product.name
            }
          </h3>
        </Link>


        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold text-[#101828]">
                $
                {formatPrice(
                  effectivePrice,
                )}
              </span>

              {onSale && (
                <span className="text-[9px] text-[#98a2b3] line-through">
                  $
                  {formatPrice(
                    product.price,
                  )}
                </span>
              )}
            </div>

            <p
              className={`mt-1 text-[8px] font-medium ${
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
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071b2d] text-white transition hover:bg-[#e31b2d]"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}


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
      <span className="flex items-center gap-2 rounded-full border border-[#5b4b31] bg-[#ffb648]/10 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#ffc467]">
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
      <span className="flex items-center gap-2 rounded-full border border-[#25533d] bg-[#32c275]/10 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#64df9a]">
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
      <span className="flex items-center gap-2 rounded-full border border-[#284b68] bg-[#4d9ee8]/10 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#72b5ef]">
        <CircleDot className="h-3 w-3" />

        More data needed
      </span>
    );
  }


  return (
    <span className="flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#8fa3b4]">
      <Zap className="h-3 w-3" />

      Standby
    </span>
  );
}


function RelevanceBadge({
  relevance,
  dark = false,
}: {
  relevance:
    RelevanceLevel;

  dark?: boolean;
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
      className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] ${styles[relevance]}`}
    >
      {relevance}
    </span>
  );
}


function PromptExample({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#e4e7ec] bg-[#fbfcfd] p-3">
      <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e31b2d]" />

      <p className="text-[9px] leading-5 text-[#667085]">
        {children}
      </p>
    </div>
  );
}


function NoActiveVehicle() {
  return (
    <section className="mt-5 flex min-h-[440px] items-center justify-center rounded-[18px] border border-[#d8dee6] bg-white px-6 py-12 shadow-[0_10px_35px_rgba(16,24,40,0.04)]">
      <div className="max-w-[470px] text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f4f7]">
          <CarFront className="h-7 w-7 text-[#83909e]" />
        </div>

        <h2 className="mt-5 text-[20px] font-bold tracking-[-0.03em] text-[#101828]">
          Choose your diagnostic vehicle
        </h2>

        <p className="mt-2 text-[10px] leading-6 text-[#667085]">
          AI Mechanic is vehicle-specific. Set an active vehicle in My Garage before starting a diagnostic session.
        </p>

        <Link
          href="/account/garage"
          className="mx-auto mt-6 flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-[#e31b2d] px-5 text-[10px] font-semibold text-white transition hover:bg-[#c81727]"
        >
          <CarFront className="h-4 w-4" />

          Open My Garage
        </Link>
      </div>
    </section>
  );
}


function VehnexaNavbar() {
  return (
    <header className="border-b border-[#163047] bg-[#071b2d]">
      <div className="mx-auto flex h-[62px] max-w-[1480px] items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
        >
          <VehnexaMark />

          <span className="text-[14px] font-bold tracking-[-0.025em] text-white">
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
            active
          />

          <TopNavLink
            href="#resources"
            label="Resources"
          />
        </nav>


        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/shop"
            aria-label="Shopping cart"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#c4ced7] transition hover:bg-white/5 hover:text-white"
          >
            <ShoppingCart className="h-[16px] w-[16px]" />
          </Link>

          <NavbarNotificationBell />

          <Link
            href="/account"
            aria-label="Account"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#c4ced7] transition hover:bg-white/5 hover:text-white"
          >
            <UserRound className="h-[16px] w-[16px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}


function VehnexaMark() {
  return (
    <div
      aria-label="Vehnexa"
      className="relative h-7 w-7 shrink-0"
    >
      <span className="absolute left-[1px] top-[3px] block h-[22px] w-[10px] -skew-x-[25deg] rounded-[2px] bg-[#e31b2d]" />

      <span className="absolute right-[2px] top-[3px] block h-[22px] w-[10px] skew-x-[25deg] rounded-[2px] bg-[#d8dee5]" />
    </div>
  );
}


function TopNavLink({
  href,
  label,
  active = false,
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
      className={`relative flex h-full items-center text-[10px] font-medium transition ${
        active
          ? "text-white"
          : "text-[#b9c5d0] hover:text-white"
      }`}
    >
      {label}

      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#e31b2d]" />
      )}
    </Link>
  );
}


function formatPrice(
  value: number,
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
