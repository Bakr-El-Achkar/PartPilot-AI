"use client";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
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
  CircleAlert,
  ExternalLink,
  LayoutDashboard,
  MessageSquare,
  Package,
  Search,
  Shapes,
  ShoppingBag,
  Star,
  Tags,
  Users,
  Wrench,
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
  getAdminAISessions,
  type AdminAISafetyLevel,
  type AdminAISession,
  type AdminAISessionStatus,
} from "@/lib/admin";


type StatusFilter =
  | "all"
  | AdminAISessionStatus;


type SafetyFilter =
  | "all"
  | AdminAISafetyLevel
  | "none";


const PAGE_SIZE =
  50;


export default function AdminAISessionsPage() {
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
    sessions,
    setSessions,
  ] =
    useState<AdminAISession[]>(
      [],
    );


  const [
    selectedSession,
    setSelectedSession,
  ] =
    useState<AdminAISession | null>(
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


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );


  const [
    safetyFilter,
    setSafetyFilter,
  ] =
    useState<SafetyFilter>(
      "all",
    );


  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(
      1,
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


        const result =
          await getAdminAISessions(
            accessToken,
          );


        if (
          cancelled
        ) {
          return;
        }


        setCurrentUser(
          me,
        );

        setSessions(
          result,
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
              : "Unable to load AI sessions.",
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


  const waitingCount =
    sessions.filter(
      (
        session,
      ) =>
        session.status ===
        "waiting_for_user",
    ).length;


  const analysisCount =
    sessions.filter(
      (
        session,
      ) =>
        session.status ===
        "analysis_ready",
    ).length;


  const urgentCount =
    sessions.filter(
      (
        session,
      ) =>
        session.safety_level ===
        "urgent",
    ).length;


  const filteredSessions =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLowerCase();


        return sessions.filter(
          (
            session,
          ) => {
            if (
              statusFilter !==
                "all" &&
              session.status !==
                statusFilter
            ) {
              return false;
            }


            if (
              safetyFilter ===
                "none" &&
              session.safety_level !==
                null
            ) {
              return false;
            }


            if (
              safetyFilter !==
                "all" &&
              safetyFilter !==
                "none" &&
              session.safety_level !==
                safetyFilter
            ) {
              return false;
            }


            if (!needle) {
              return true;
            }


            const vehicle =
              [
                session.vehicle_year ??
                  "",
                session.vehicle_make,
                session.vehicle_model,
                session.vehicle_engine ??
                  "",
                session.vehicle_transmission ??
                  "",
                session.vehicle_nickname ??
                  "",
              ]
                .join(
                  " ",
                );


            const messages =
              session.messages
                .map(
                  (
                    message,
                  ) =>
                    message.content,
                )
                .join(
                  " ",
                );


            return [
              session.id,
              session.user_id,
              session.customer_name,
              session.customer_email,
              session.vehicle_id,
              vehicle,
              session.status,
              session.safety_level ??
                "",
              session.latest_turn
                ?.assistant_message ??
                "",
              messages,
            ].some(
              (
                value,
              ) =>
                String(
                  value,
                )
                  .toLowerCase()
                  .includes(
                    needle,
                  ),
            );
          },
        );
      },
      [
        sessions,
        search,
        statusFilter,
        safetyFilter,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredSessions.length /
          PAGE_SIZE,
      ),
    );


  const safePage =
    Math.min(
      currentPage,
      totalPages,
    );


  const pageSessions =
    filteredSessions.slice(
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
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.035em]">
                AI Sessions
              </h1>

              <p className="mt-2 text-[11px] text-[#667085]">
                Inspect customer AI Mechanic diagnostic sessions and safety outcomes.
              </p>
            </div>


            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total sessions"
                value={
                  sessions.length
                }
              />

              <MetricCard
                label="Waiting for user"
                value={
                  waitingCount
                }
              />

              <MetricCard
                label="Analysis ready"
                value={
                  analysisCount
                }
              />

              <MetricCard
                label="Urgent safety"
                value={
                  urgentCount
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
                  placeholder="Search customer, vehicle or conversation..."
                  className="h-10 w-full rounded-[7px] border border-[#d0d5dd] bg-white pl-9 pr-3 text-[10px] outline-none"
                />
              </div>


              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={
                    statusFilter
                  }
                  onChange={
                    (
                      event,
                    ) => {
                      setStatusFilter(
                        event.target.value as
                          StatusFilter,
                      );

                      setCurrentPage(
                        1,
                      );
                    }
                  }
                  className="h-10 rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px]"
                >
                  <option value="all">
                    All statuses
                  </option>

                  <option value="waiting_for_user">
                    Waiting for user
                  </option>

                  <option value="analysis_ready">
                    Analysis ready
                  </option>

                  <option value="closed">
                    Closed
                  </option>
                </select>


                <select
                  value={
                    safetyFilter
                  }
                  onChange={
                    (
                      event,
                    ) => {
                      setSafetyFilter(
                        event.target.value as
                          SafetyFilter,
                      );

                      setCurrentPage(
                        1,
                      );
                    }
                  }
                  className="h-10 rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px]"
                >
                  <option value="all">
                    All safety levels
                  </option>

                  <option value="normal">
                    Normal
                  </option>

                  <option value="caution">
                    Caution
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>

                  <option value="none">
                    No result yet
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
              ) : pageSessions.length ===
                0 ? (
                <div className="px-6 py-16 text-center">
                  <Bot className="mx-auto h-8 w-8 text-[#98a2b3]" />

                  <p className="mt-4 text-[12px] font-semibold">
                    No AI sessions found
                  </p>

                  <p className="mt-1 text-[9px] text-[#667085]">
                    Try changing the current search or filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#eaecf0] bg-[#fafbfc] text-left">
                        <TableHeading>
                          Customer
                        </TableHeading>

                        <TableHeading>
                          Vehicle
                        </TableHeading>

                        <TableHeading>
                          Status
                        </TableHeading>

                        <TableHeading>
                          Safety
                        </TableHeading>

                        <TableHeading>
                          Messages
                        </TableHeading>

                        <TableHeading>
                          Updated
                        </TableHeading>

                        <TableHeading>
                          Actions
                        </TableHeading>
                      </tr>
                    </thead>


                    <tbody>
                      {pageSessions.map(
                        (
                          session,
                        ) => (
                          <tr
                            key={
                              session.id
                            }
                            className="border-b border-[#eaecf0] last:border-0 hover:bg-[#fafbfc]"
                          >
                            <TableCell>
                              <p className="font-semibold text-[#101828]">
                                {
                                  session.customer_name
                                }
                              </p>

                              <p className="mt-1 max-w-[190px] truncate text-[8px] text-[#98a2b3]">
                                {
                                  session.customer_email ||
                                  session.user_id
                                }
                              </p>
                            </TableCell>


                            <TableCell>
                              <p className="font-semibold text-[#344054]">
                                {
                                  vehicleTitle(
                                    session,
                                  )
                                }
                              </p>

                              <p className="mt-1 text-[8px] text-[#98a2b3]">
                                {
                                  session.vehicle_nickname ??
                                  session.vehicle_engine ??
                                  "Vehicle"
                                }
                              </p>
                            </TableCell>


                            <TableCell>
                              <SessionStatusBadge
                                status={
                                  session.status
                                }
                              />
                            </TableCell>


                            <TableCell>
                              <SafetyBadge
                                level={
                                  session.safety_level
                                }
                              />
                            </TableCell>


                            <TableCell>
                              <span className="inline-flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3 text-[#98a2b3]" />

                                {
                                  session.message_count
                                }
                              </span>
                            </TableCell>


                            <TableCell>
                              {
                                formatDateTime(
                                  session.updated_at,
                                )
                              }
                            </TableCell>


                            <TableCell>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedSession(
                                    session,
                                  )
                                }
                                className="h-8 rounded-[6px] border border-[#d0d5dd] px-3 text-[8px] font-semibold text-[#344054]"
                              >
                                Inspect
                              </button>
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
                    pageSessions.length
                  }{" "}
                  of{" "}
                  {
                    filteredSessions.length
                  }{" "}
                  matching sessions ·{" "}
                  {
                    sessions.length
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


      {selectedSession && (
        <AISessionDrawer
          session={
            selectedSession
          }
          onClose={() =>
            setSelectedSession(
              null,
            )
          }
        />
      )}
    </main>
  );
}


function AISessionDrawer({
  session,
  onClose,
}: {
  session:
    AdminAISession;

  onClose:
    () => void;
}) {
  const turn =
    session.latest_turn;


  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        aria-label="Close AI session drawer"
        onClick={
          onClose
        }
        className="absolute inset-0"
      />


      <aside className="relative z-10 h-full w-full max-w-[680px] overflow-y-auto bg-white">
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-[#eaecf0] bg-white px-6 py-5">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
              AI Mechanic inspection
            </p>

            <h2 className="mt-1 text-[20px] font-bold">
              Diagnostic session
            </h2>
          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-[#eaecf0]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        <div className="space-y-7 p-6">
          <div className="flex flex-wrap gap-2">
            <SessionStatusBadge
              status={
                session.status
              }
            />

            <SafetyBadge
              level={
                session.safety_level
              }
            />
          </div>


          <Section
            title="Customer"
          >
            <Detail
              label="Name"
              value={
                session.customer_name
              }
            />

            <Detail
              label="Email"
              value={
                session.customer_email ||
                "Not available"
              }
            />

            <Detail
              label="User ID"
              value={
                session.user_id
              }
            />
          </Section>


          <Section
            title="Vehicle"
          >
            <Detail
              label="Vehicle"
              value={
                vehicleTitle(
                  session,
                )
              }
            />

            <Detail
              label="Nickname"
              value={
                session.vehicle_nickname ??
                "Not provided"
              }
            />

            <Detail
              label="Engine"
              value={
                session.vehicle_engine ??
                "Not available"
              }
            />

            <Detail
              label="Transmission"
              value={
                session.vehicle_transmission ??
                "Not available"
              }
            />

            <Detail
              label="Vehicle ID"
              value={
                session.vehicle_id
              }
            />
          </Section>


          <Section
            title="Session"
          >
            <Detail
              label="Session ID"
              value={
                session.id
              }
            />

            <Detail
              label="Messages"
              value={
                session.message_count.toString()
              }
            />

            <Detail
              label="Created"
              value={
                formatDateTime(
                  session.created_at,
                )
              }
            />

            <Detail
              label="Last updated"
              value={
                formatDateTime(
                  session.updated_at,
                )
              }
            />
          </Section>


          {turn && (
            <Section
              title="Latest diagnostic result"
            >
              <div className="rounded-[9px] border border-[#dfe3e8] bg-[#fafbfc] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d0d5dd] bg-white px-2.5 py-1 text-[8px] font-semibold text-[#475467]">
                    {
                      turn.response_type ===
                      "analysis"
                        ? "Analysis"
                        : "Follow-up"
                    }
                  </span>

                  <SafetyBadge
                    level={
                      turn.safety.level
                    }
                  />
                </div>


                <p className="mt-4 whitespace-pre-wrap text-[10px] leading-6 text-[#475467]">
                  {
                    turn.assistant_message
                  }
                </p>


                <div className="mt-4 rounded-[7px] border border-[#eaecf0] bg-white p-3">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                    Safety guidance
                  </p>

                  <p className="mt-2 text-[9px] leading-5 text-[#475467]">
                    {
                      turn.safety.message
                    }
                  </p>
                </div>


                {turn.follow_up_question && (
                  <div className="mt-4">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
                      Follow-up question
                    </p>

                    <p className="mt-2 text-[10px] font-medium leading-5 text-[#344054]">
                      {
                        turn.follow_up_question
                      }
                    </p>
                  </div>
                )}
              </div>
            </Section>
          )}


          {turn &&
            turn.possible_causes.length >
              0 && (
            <Section
              title="Possible causes"
            >
              <div className="space-y-3">
                {turn.possible_causes.map(
                  (
                    cause,
                    index,
                  ) => (
                    <div
                      key={`${cause.cause}-${index}`}
                      className="rounded-[8px] border border-[#e4e7ec] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold text-[#101828]">
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

                      <p className="mt-2 text-[9px] leading-5 text-[#667085]">
                        {
                          cause.explanation
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            </Section>
          )}


          {turn &&
            turn.components.length >
              0 && (
            <Section
              title="Suggested components"
            >
              <div className="space-y-3">
                {turn.components.map(
                  (
                    component,
                  ) => (
                    <div
                      key={
                        component.component_key
                      }
                      className="rounded-[8px] border border-[#e4e7ec] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-3.5 w-3.5 text-[#667085]" />

                            <p className="text-[10px] font-bold">
                              {
                                component.label
                              }
                            </p>
                          </div>

                          <p className="mt-1 text-[8px] text-[#98a2b3]">
                            {
                              component.component_key
                            }
                          </p>
                        </div>

                        <RelevanceBadge
                          relevance={
                            component.relevance
                          }
                        />
                      </div>


                      <p className="mt-3 text-[9px] leading-5 text-[#667085]">
                        {
                          component.explanation
                        }
                      </p>


                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <MiniDetail
                          label="Catalog key"
                          value={
                            component.catalog_key
                          }
                        />

                        <MiniDetail
                          label="3D hotspot"
                          value={
                            component.hotspot_key
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </Section>
          )}


          <Section
            title="Conversation"
          >
            {session.messages.length ===
            0 ? (
              <div className="rounded-[8px] border border-dashed border-[#d0d5dd] p-6 text-center text-[9px] text-[#667085]">
                No conversation messages were stored.
              </div>
            ) : (
              <div className="space-y-3">
                {session.messages.map(
                  (
                    message,
                    index,
                  ) => (
                    <div
                      key={`${message.created_at}-${index}`}
                      className={
                        message.role ===
                        "user"
                          ? "ml-8 rounded-[9px] bg-[#071523] p-4 text-white"
                          : "mr-8 rounded-[9px] border border-[#e4e7ec] bg-[#fafbfc] p-4"
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={
                            message.role ===
                            "user"
                              ? "text-[8px] font-semibold uppercase tracking-[0.08em] text-white/60"
                              : "text-[8px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]"
                          }
                        >
                          {
                            message.role ===
                            "user"
                              ? "Customer"
                              : "AI Mechanic"
                          }
                        </p>

                        <span
                          className={
                            message.role ===
                            "user"
                              ? "text-[7px] text-white/50"
                              : "text-[7px] text-[#98a2b3]"
                          }
                        >
                          {
                            formatDateTime(
                              message.created_at,
                            )
                          }
                        </span>
                      </div>

                      <p
                        className={
                          message.role ===
                          "user"
                            ? "mt-2 whitespace-pre-wrap text-[10px] leading-6 text-white"
                            : "mt-2 whitespace-pre-wrap text-[10px] leading-6 text-[#475467]"
                        }
                      >
                        {
                          message.content
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </Section>


          <div className="flex gap-3 rounded-[9px] border border-[#d0d5dd] bg-[#f9fafb] p-4">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#667085]" />

            <p className="text-[8px] leading-5 text-[#667085]">
              Admin inspection is read-only. This screen does not send messages to the AI, alter diagnostic results, or change the customer&apos;s session.
            </p>
          </div>
        </div>
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
        <Nav href="/admin/ai-sessions" icon={Bot} label="AI Sessions" active />
        <Nav href="/admin/notifications" icon={Bell} label="Notifications" />
      </nav>
    

        <AdminLogoutButton />
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
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-[12px] border border-[#dfe3e8] bg-white p-5">
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


function SessionStatusBadge({
  status,
}: {
  status:
    AdminAISessionStatus;
}) {
  const styles = {
    waiting_for_user:
      "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",

    analysis_ready:
      "border-[#abefc6] bg-[#ecfdf3] text-[#067647]",

    closed:
      "border-[#d0d5dd] bg-[#f2f4f7] text-[#667085]",
  };


  const labels = {
    waiting_for_user:
      "Waiting",

    analysis_ready:
      "Analysis ready",

    closed:
      "Closed",
  };


  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-semibold ${styles[status]}`}
    >
      {
        labels[
          status
        ]
      }
    </span>
  );
}


function SafetyBadge({
  level,
}: {
  level:
    AdminAISafetyLevel | null;
}) {
  if (!level) {
    return (
      <span className="inline-flex rounded-full border border-[#d0d5dd] bg-[#f9fafb] px-2.5 py-1 text-[8px] font-semibold text-[#667085]">
        No result
      </span>
    );
  }


  const styles = {
    normal:
      "border-[#abefc6] bg-[#ecfdf3] text-[#067647]",

    caution:
      "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",

    urgent:
      "border-[#fecdca] bg-[#fff4f5] text-[#b42318]",
  };


  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-semibold ${styles[level]}`}
    >
      {
        level.charAt(
          0,
        ).toUpperCase()
        +
        level.slice(
          1,
        )
      }
    </span>
  );
}


function RelevanceBadge({
  relevance,
}: {
  relevance:
    "high"
    | "medium"
    | "low";
}) {
  const styles = {
    high:
      "bg-[#fff4f5] text-[#b42318]",

    medium:
      "bg-[#fffaeb] text-[#b54708]",

    low:
      "bg-[#f2f4f7] text-[#667085]",
  };


  return (
    <span
      className={`rounded-full px-2 py-1 text-[7px] font-semibold uppercase ${styles[relevance]}`}
    >
      {
        relevance
      }
    </span>
  );
}


function Section({
  title,
  children,
}: {
  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#667085]">
        {
          title
        }
      </h3>

      <div className="space-y-3">
        {
          children
        }
      </div>
    </section>
  );
}


function Detail({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#eaecf0] py-2 last:border-0">
      <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
        {
          label
        }
      </span>

      <span className="max-w-[360px] break-all text-right text-[9px] font-medium text-[#344054]">
        {
          value
        }
      </span>
    </div>
  );
}


function MiniDetail({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[6px] bg-[#f8f9fb] p-3">
      <p className="text-[7px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
        {
          label
        }
      </p>

      <p className="mt-1 break-all text-[8px] font-medium text-[#475467]">
        {
          value
        }
      </p>
    </div>
  );
}


function vehicleTitle(
  session:
    AdminAISession,
) {
  return [
    session.vehicle_year,
    session.vehicle_make,
    session.vehicle_model,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
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
