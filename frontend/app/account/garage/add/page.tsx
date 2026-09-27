"use client";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";

import {
  type FormEvent,
  useEffect,
  useMemo,
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
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Cog,
  Gauge,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserRound,
  WandSparkles,
  Wrench,
} from "lucide-react";

import {
  ApiError,
} from "@/lib/api";

import {
  getAccessToken,
} from "@/lib/auth";

import {
  createVehicle,
  getVehiclePreview,
} from "@/lib/vehicles";

import {
  getVehicleMakes,
  getVehicleModels,
  getVehicleOptions,
  getVehicleYears,
} from "@/lib/vehicleCatalog";


type FormState = {
  year: string;
  make: string;
  model: string;
  engine: string;
  transmission: string;
  nickname: string;
};


const initialState: FormState = {
  year: "",
  make: "",
  model: "",
  engine: "",
  transmission: "",
  nickname: "",
};


/* ============================================================
   ADD VEHICLE
============================================================ */

export default function AddVehiclePage() {
  const router =
    useRouter();


  const reduceMotion =
    useReducedMotion();


  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      initialState,
    );


  const [
    makes,
    setMakes,
  ] =
    useState<string[]>(
      [],
    );


  const [
    models,
    setModels,
  ] =
    useState<string[]>(
      [],
    );


  const [
    years,
    setYears,
  ] =
    useState<number[]>(
      [],
    );


  const [
    engines,
    setEngines,
  ] =
    useState<string[]>(
      [],
    );


  const [
    transmissions,
    setTransmissions,
  ] =
    useState<string[]>(
      [],
    );


  const [
    catalogLoading,
    setCatalogLoading,
  ] =
    useState(
      true,
    );


  const [
    modelsLoading,
    setModelsLoading,
  ] =
    useState(
      false,
    );


  const [
    yearsLoading,
    setYearsLoading,
  ] =
    useState(
      false,
    );


  const [
    optionsLoading,
    setOptionsLoading,
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
    error,
    setError,
  ] =
    useState(
      "",
    );


  const [
    previewLoading,
    setPreviewLoading,
  ] =
    useState(
      false,
    );


  const [
    previewImage,
    setPreviewImage,
  ] =
    useState<
      string | null
    >(
      null,
    );


  const [
    previewMessage,
    setPreviewMessage,
  ] =
    useState(
      "Select your vehicle to load a preview.",
    );


  /* ==========================================================
     LOAD MAKES
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


    async function loadMakes() {
      try {
        setCatalogLoading(
          true,
        );


        const result =
          await getVehicleMakes();


        if (
          !cancelled
        ) {
          setMakes(
            result,
          );
        }

      } catch (
        err
      ) {
        if (
          !cancelled
        ) {
          setError(
            err instanceof
              ApiError
              ? err.message
              : "Unable to load the vehicle catalog.",
          );
        }

      } finally {
        if (
          !cancelled
        ) {
          setCatalogLoading(
            false,
          );
        }
      }
    }


    void loadMakes();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


  /* ==========================================================
     VEHICLE IMAGE PREVIEW
  ========================================================== */

  useEffect(() => {
    const year =
      Number(
        form.year,
      );


    if (
      !form.make ||
      !form.model ||
      !Number.isInteger(
        year,
      )
    ) {
      return;
    }


    let cancelled =
      false;


    const timeout =
      window.setTimeout(
        async () => {
          const token =
            getAccessToken();


          if (!token) {
            return;
          }


          try {
            setPreviewLoading(
              true,
            );


            setPreviewMessage(
              "Identifying your vehicle...",
            );


            const result =
              await getVehiclePreview(
                token,
                year,
                form.make,
                form.model,
              );


            if (
              cancelled
            ) {
              return;
            }


            if (
              result.found &&
              result.image_url
            ) {
              setPreviewImage(
                result.image_url,
              );


              setPreviewMessage(
                "Vehicle matched successfully.",
              );

            } else {
              setPreviewImage(
                null,
              );


              setPreviewMessage(
                result.message ??
                  "No exact vehicle image was found.",
              );
            }

          } catch (
            err
          ) {
            if (
              cancelled
            ) {
              return;
            }


            console.error(
              "Vehicle preview error:",
              err,
            );


            setPreviewImage(
              null,
            );


            setPreviewMessage(
              "Vehicle preview is temporarily unavailable.",
            );

          } finally {
            if (
              !cancelled
            ) {
              setPreviewLoading(
                false,
              );
            }
          }
        },
        500,
      );


    return () => {
      cancelled =
        true;


      window.clearTimeout(
        timeout,
      );
    };
  }, [
    form.year,
    form.make,
    form.model,
  ]);


  /* ==========================================================
     MAKE
  ========================================================== */

  async function handleMakeChange(
    make: string,
  ) {
    setError(
      "",
    );


    setForm(
      (
        current,
      ) => ({
        ...current,
        make,
        model:
          "",
        year:
          "",
        engine:
          "",
        transmission:
          "",
      }),
    );


    setModels(
      [],
    );

    setYears(
      [],
    );

    setEngines(
      [],
    );

    setTransmissions(
      [],
    );


    resetPreview();


    if (!make) {
      return;
    }


    try {
      setModelsLoading(
        true,
      );


      const result =
        await getVehicleModels(
          make,
        );


      setModels(
        result,
      );

    } catch (
      err
    ) {
      setError(
        err instanceof
          ApiError
          ? err.message
          : "Unable to load vehicle models.",
      );

    } finally {
      setModelsLoading(
        false,
      );
    }
  }


  /* ==========================================================
     MODEL
  ========================================================== */

  async function handleModelChange(
    model: string,
  ) {
    setError(
      "",
    );


    setForm(
      (
        current,
      ) => ({
        ...current,
        model,
        year:
          "",
        engine:
          "",
        transmission:
          "",
      }),
    );


    setYears(
      [],
    );

    setEngines(
      [],
    );

    setTransmissions(
      [],
    );


    setPreviewImage(
      null,
    );

    setPreviewLoading(
      false,
    );


    setPreviewMessage(
      model
        ? "Select a model year to continue."
        : "Select your vehicle to load a preview.",
    );


    if (
      !form.make ||
      !model
    ) {
      return;
    }


    try {
      setYearsLoading(
        true,
      );


      const result =
        await getVehicleYears(
          form.make,
          model,
        );


      setYears(
        result,
      );

    } catch (
      err
    ) {
      setError(
        err instanceof
          ApiError
          ? err.message
          : "Unable to load model years.",
      );

    } finally {
      setYearsLoading(
        false,
      );
    }
  }


  /* ==========================================================
     YEAR
  ========================================================== */

  async function handleYearChange(
    yearValue:
      string,
  ) {
    setError(
      "",
    );


    setForm(
      (
        current,
      ) => ({
        ...current,
        year:
          yearValue,
        engine:
          "",
        transmission:
          "",
      }),
    );


    setEngines(
      [],
    );

    setTransmissions(
      [],
    );


    setPreviewImage(
      null,
    );

    setPreviewLoading(
      false,
    );


    if (!yearValue) {
      setPreviewMessage(
        "Select your vehicle to load a preview.",
      );

      return;
    }


    setPreviewMessage(
      "Preparing vehicle preview...",
    );


    if (
      !form.make ||
      !form.model
    ) {
      return;
    }


    const year =
      Number(
        yearValue,
      );


    if (
      !Number.isInteger(
        year,
      )
    ) {
      return;
    }


    try {
      setOptionsLoading(
        true,
      );


      const result =
        await getVehicleOptions(
          form.make,
          form.model,
          year,
        );


      setEngines(
        result.engines,
      );


      setTransmissions(
        result.transmissions,
      );

    } catch (
      err
    ) {
      setError(
        err instanceof
          ApiError
          ? err.message
          : "Unable to load vehicle specifications.",
      );

    } finally {
      setOptionsLoading(
        false,
      );
    }
  }


  /* ==========================================================
     SIMPLE FIELDS
  ========================================================== */

  function updateField(
    field:
      | "engine"
      | "transmission"
      | "nickname",
    value:
      string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,
        [field]:
          value,
      }),
    );
  }


  function resetPreview() {
    setPreviewImage(
      null,
    );

    setPreviewLoading(
      false,
    );


    setPreviewMessage(
      "Select your vehicle to load a preview.",
    );
  }


  /* ==========================================================
     SUBMIT
  ========================================================== */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    setError(
      "",
    );


    const year =
      Number(
        form.year,
      );


    if (
      !form.make ||
      !form.model ||
      !form.year ||
      !form.engine ||
      !form.transmission
    ) {
      setError(
        "Please complete all required vehicle details.",
      );

      return;
    }


    if (
      !Number.isInteger(
        year,
      ) ||
      year <
        1950 ||
      year >
        2100
    ) {
      setError(
        "Please select a valid model year.",
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
      setLoading(
        true,
      );


      await createVehicle(
        token,
        {
          year,
          make:
            form.make,
          model:
            form.model,
          engine:
            form.engine,
          transmission:
            form.transmission,
          nickname:
            form.nickname.trim() ||
            undefined,
          image_url:
            previewImage ||
            undefined,
        },
      );


      router.push(
        "/account/garage",
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
          : "Unable to add vehicle.",
      );

    } finally {
      setLoading(
        false,
      );
    }
  }


  /* ==========================================================
     DERIVED UI
  ========================================================== */

  const formComplete =
    Boolean(
      form.make &&
      form.model &&
      form.year &&
      form.engine &&
      form.transmission,
    );


  const completionItems =
    useMemo(
      () => [
        Boolean(
          form.make,
        ),

        Boolean(
          form.model,
        ),

        Boolean(
          form.year,
        ),

        Boolean(
          form.engine,
        ),

        Boolean(
          form.transmission,
        ),
      ],
      [
        form.make,
        form.model,
        form.year,
        form.engine,
        form.transmission,
      ],
    );


  const completedCount =
    completionItems.filter(
      Boolean,
    ).length;


  const progress =
    Math.round(
      (
        completedCount /
        completionItems.length
      ) *
        100,
    );


  const identityComplete =
    Boolean(
      form.make &&
      form.model &&
      form.year,
    );


  const powertrainComplete =
    Boolean(
      form.engine &&
      form.transmission,
    );


  const vehicleTitle =
    [
      form.year,
      form.make,
      form.model,
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      ) ||
    "Your vehicle";


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f4f7] text-[#101828]">
      <VehnexaNavbar />


      {/* ======================================================
          CONFIGURATOR HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.26)_1px,transparent_1px)] [background-size:72px_72px]"
        />

        <div
          aria-hidden="true"
          className="absolute -right-[240px] -top-[280px] h-[760px] w-[760px] rounded-full bg-[#e31b2d]/15 blur-[130px]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-[350px] left-[10%] h-[650px] w-[800px] rounded-full bg-[#367db6]/10 blur-[155px]"
        />


        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [
                    -90,
                    80,
                    -90,
                  ],

                  opacity: [
                    0.16,
                    0.5,
                    0.16,
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
          className="absolute bottom-[12%] left-[4%] h-[3px] w-[58%] rotate-[-7deg] bg-gradient-to-r from-transparent via-[#e31b2d]/60 to-transparent blur-[2px]"
        />


        <div className="relative mx-auto max-w-[1480px] px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-18 lg:pt-14">
          <Link
            href="/account/garage"
            className="group inline-flex items-center gap-2 text-[8px] font-bold text-[#8599a9] transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />

            Back to My Garage
          </Link>


          <div className="mt-8 grid gap-12 xl:grid-cols-[minmax(0,0.88fr)_minmax(520px,1.12fr)] xl:items-center">
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
                  0.72,

                ease:
                  "easeOut",
              }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.055] px-3.5 py-2 backdrop-blur">
                <WandSparkles className="h-3.5 w-3.5 text-[#ff4b5a]" />

                <span className="text-[8px] font-black uppercase tracking-[0.17em] text-[#cad5dd]">
                  VEHICLE CONFIGURATOR
                </span>
              </div>


              <h1 className="mt-6 text-[52px] font-black leading-[0.92] tracking-[-0.06em] sm:text-[68px] lg:text-[78px]">
                Build your
                <br />

                <span className="text-[#ff394a]">
                  vehicle profile.
                </span>
              </h1>


              <p className="mt-7 max-w-[650px] text-[12px] leading-6 text-[#a8b9c6] sm:text-[13px]">
                Identify the exact make,
                model, year and powertrain.
                Vehnexa will use the saved
                vehicle as context for
                marketplace compatibility and
                other vehicle-aware experiences.
              </p>


              <div className="mt-9 max-w-[650px]">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.13em] text-[#6f8495]">
                    PROFILE COMPLETION
                  </span>

                  <motion.span
                    key={
                      progress
                    }
                    initial={{
                      scale:
                        0.85,
                    }}
                    animate={{
                      scale:
                        1,
                    }}
                    className="text-[15px] font-black text-white"
                  >
                    {
                      progress
                    }%
                  </motion.span>
                </div>


                <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    animate={{
                      width:
                        `${progress}%`,
                    }}
                    transition={{
                      duration:
                        0.55,

                      ease:
                        "easeOut",
                    }}
                    className="h-full bg-gradient-to-r from-[#e31b2d] via-[#ff4555] to-[#61d49b]"
                  />
                </div>


                <div className="mt-4 grid grid-cols-5 gap-2">
                  {[
                    "Make",
                    "Model",
                    "Year",
                    "Engine",
                    "Gearbox",
                  ].map(
                    (
                      label,
                      index,
                    ) => (
                      <ProgressNode
                        key={
                          label
                        }
                        label={
                          label
                        }
                        complete={
                          completionItems[
                            index
                          ]
                        }
                        index={
                          index +
                          1
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            </motion.div>


            <HeroVehicleStage
              title={
                vehicleTitle
              }
              previewImage={
                previewImage
              }
              previewLoading={
                previewLoading
              }
              previewMessage={
                previewMessage
              }
              form={
                form
              }
            />
          </div>
        </div>
      </section>


      {/* ======================================================
          CONFIGURATION SIGNALS
      ====================================================== */}

      <section className="border-b border-[#e1e6ea] bg-white">
        <div className="mx-auto grid max-w-[1480px] sm:grid-cols-3">
          <ConfiguratorSignal
            icon={
              CarFront
            }
            eyebrow="IDENTITY"
            title={
              identityComplete
                ? "Vehicle identified"
                : "Make, model & year"
            }
            description="Start with the core catalog identity of the vehicle."
          />


          <ConfiguratorSignal
            icon={
              Cog
            }
            eyebrow="POWERTRAIN"
            title={
              powertrainComplete
                ? "Powertrain selected"
                : "Engine & transmission"
            }
            description="Complete the mechanical configuration used by the saved vehicle profile."
          />


          <ConfiguratorSignal
            icon={
              ShieldCheck
            }
            eyebrow="COMPATIBILITY"
            title={
              formComplete
                ? "Profile ready"
                : "Waiting for details"
            }
            description="Required vehicle data becomes available to Vehnexa compatibility features."
          />
        </div>
      </section>


      {/* ======================================================
          BUILDER
      ====================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
              VEHICLE BUILD
            </p>

            <h2 className="mt-3 text-[36px] font-black tracking-[-0.045em] text-[#101828] sm:text-[46px]">
              Configure it in three stages.
            </h2>

            <p className="mt-4 max-w-[690px] text-[10px] leading-5 text-[#667085]">
              Each selection unlocks the next
              catalog level. Your preview updates
              automatically once Vehnexa knows
              the make, model and year.
            </p>
          </div>


          <div className="inline-flex h-10 self-start items-center gap-2 rounded-[8px] border border-[#dce2e7] bg-white px-4 text-[8px] font-bold text-[#596775] shadow-sm lg:self-auto">
            <Sparkles className="h-3.5 w-3.5 text-[#e31b2d]" />

            Live catalog matching
          </div>
        </div>


        {error && (
          <motion.div
            initial={{
              y:
                -10,
            }}
            animate={{
              y:
                0,
            }}
            className="mb-7 rounded-[12px] border border-[#f2c2c7] bg-[#fff5f6] px-5 py-4"
          >
            <p className="text-[9px] font-black text-[#b42318]">
              Vehicle configuration needs attention
            </p>

            <p className="mt-1 text-[8px] leading-4 text-[#c2554a]">
              {
                error
              }
            </p>
          </motion.div>
        )}


        <form
          onSubmit={
            handleSubmit
          }
          className="grid gap-7 xl:grid-cols-[minmax(0,1.18fr)_420px]"
        >
          {/* ==================================================
              LEFT BUILDER
          ================================================== */}

          <div className="space-y-6">
            {/* STAGE 1 */}

            <ConfiguratorSection
              number="01"
              eyebrow="VEHICLE IDENTITY"
              title="What are you driving?"
              description="Choose the manufacturer, model and model year in order."
              icon={
                CarFront
              }
              complete={
                identityComplete
              }
            >
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Make"
                  value={
                    form.make
                  }
                  placeholder={
                    catalogLoading
                      ? "Loading makes..."
                      : "Select make"
                  }
                  options={
                    makes
                  }
                  disabled={
                    catalogLoading
                  }
                  loading={
                    catalogLoading
                  }
                  complete={
                    Boolean(
                      form.make,
                    )
                  }
                  onChange={(
                    value,
                  ) => {
                    void handleMakeChange(
                      value,
                    );
                  }}
                />


                <SelectField
                  label="Model"
                  value={
                    form.model
                  }
                  placeholder={
                    !form.make
                      ? "Select make first"
                      : modelsLoading
                        ? "Loading models..."
                        : "Select model"
                  }
                  options={
                    models
                  }
                  disabled={
                    !form.make ||
                    modelsLoading
                  }
                  loading={
                    modelsLoading
                  }
                  complete={
                    Boolean(
                      form.model,
                    )
                  }
                  onChange={(
                    value,
                  ) => {
                    void handleModelChange(
                      value,
                    );
                  }}
                />


                <SelectField
                  label="Model year"
                  value={
                    form.year
                  }
                  placeholder={
                    !form.model
                      ? "Select model first"
                      : yearsLoading
                        ? "Loading years..."
                        : "Select model year"
                  }
                  options={
                    years.map(
                      String,
                    )
                  }
                  disabled={
                    !form.model ||
                    yearsLoading
                  }
                  loading={
                    yearsLoading
                  }
                  complete={
                    Boolean(
                      form.year,
                    )
                  }
                  onChange={(
                    value,
                  ) => {
                    void handleYearChange(
                      value,
                    );
                  }}
                />


                <StageStatusCard
                  title={
                    identityComplete
                      ? "Identity complete"
                      : "Complete vehicle identity"
                  }
                  description={
                    identityComplete
                      ? `${form.year} ${form.make} ${form.model}`
                      : "Make, model and year are required before Vehnexa can load powertrain options."
                  }
                  complete={
                    identityComplete
                  }
                />
              </div>
            </ConfiguratorSection>


            {/* STAGE 2 */}

            <ConfiguratorSection
              number="02"
              eyebrow="POWERTRAIN"
              title="Define the mechanical setup."
              description="Available engine and transmission options are loaded from the selected vehicle configuration."
              icon={
                Wrench
              }
              complete={
                powertrainComplete
              }
              disabled={
                !identityComplete
              }
            >
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Engine"
                  value={
                    form.engine
                  }
                  placeholder={
                    !form.year
                      ? "Select year first"
                      : optionsLoading
                        ? "Loading engines..."
                        : engines.length
                          ? "Select engine"
                          : "No engines available"
                  }
                  options={
                    engines
                  }
                  disabled={
                    !form.year ||
                    optionsLoading ||
                    engines.length ===
                      0
                  }
                  loading={
                    optionsLoading
                  }
                  complete={
                    Boolean(
                      form.engine,
                    )
                  }
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "engine",
                      value,
                    )
                  }
                />


                <SelectField
                  label="Transmission"
                  value={
                    form.transmission
                  }
                  placeholder={
                    !form.year
                      ? "Select year first"
                      : optionsLoading
                        ? "Loading transmissions..."
                        : transmissions.length
                          ? "Select transmission"
                          : "No transmissions available"
                  }
                  options={
                    transmissions
                  }
                  disabled={
                    !form.year ||
                    optionsLoading ||
                    transmissions.length ===
                      0
                  }
                  loading={
                    optionsLoading
                  }
                  complete={
                    Boolean(
                      form.transmission,
                    )
                  }
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "transmission",
                      value,
                    )
                  }
                />
              </div>


              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MechanicalCard
                  icon={
                    Gauge
                  }
                  label="Engine"
                  value={
                    form.engine ||
                    "Waiting for selection"
                  }
                  active={
                    Boolean(
                      form.engine,
                    )
                  }
                />


                <MechanicalCard
                  icon={
                    Cog
                  }
                  label="Transmission"
                  value={
                    form.transmission ||
                    "Waiting for selection"
                  }
                  active={
                    Boolean(
                      form.transmission,
                    )
                  }
                />
              </div>
            </ConfiguratorSection>


            {/* STAGE 3 */}

            <ConfiguratorSection
              number="03"
              eyebrow="PERSONALIZE"
              title="Make it yours."
              description="Give the vehicle an optional nickname so it is easier to recognize inside My Garage."
              icon={
                Sparkles
              }
              complete={
                formComplete
              }
              disabled={
                !powertrainComplete
              }
            >
              <TextField
                label="Vehicle nickname"
                optional
                value={
                  form.nickname
                }
                placeholder="Daily Driver"
                onChange={(
                  value,
                ) =>
                  updateField(
                    "nickname",
                    value,
                  )
                }
              />


              <div className="mt-5 flex gap-3 rounded-[12px] border border-[#dce5e0] bg-[#f4fbf7] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#159b70]" />

                <div>
                  <p className="text-[9px] font-black text-[#234b38]">
                    Compatibility profile
                  </p>

                  <p className="mt-1 text-[8px] leading-4 text-[#668173]">
                    Make, model, year, engine and
                    transmission are the required
                    vehicle fields saved to Vehnexa.
                    Nickname is optional.
                  </p>
                </div>
              </div>
            </ConfiguratorSection>
          </div>


          {/* ==================================================
              STICKY REVIEW
          ================================================== */}

          <aside className="self-start xl:sticky xl:top-[88px]">
            <motion.div
              layout
              className="overflow-hidden rounded-[20px] border border-[#dce2e7] bg-white shadow-[0_18px_55px_rgba(15,23,42,.07)]"
            >
              <div className="bg-[#071b2d] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#718798]">
                      VEHICLE PROFILE
                    </p>

                    <h3 className="mt-1.5 text-[15px] font-black">
                      Review your build
                    </h3>
                  </div>


                  <span
                    className={
                      formComplete
                        ? "flex h-10 w-10 items-center justify-center rounded-full border border-[#61d49a]/20 bg-[#61d49a]/10 text-[#70dda7]"
                        : "flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-[#6f8495]"
                    }
                  >
                    {formComplete ? (
                      <BadgeCheck className="h-4 w-4" />
                    ) : (
                      <CircleGauge className="h-4 w-4" />
                    )}
                  </span>
                </div>


                <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    animate={{
                      width:
                        `${progress}%`,
                    }}
                    transition={{
                      duration:
                        0.45,
                    }}
                    className="h-full bg-gradient-to-r from-[#e31b2d] to-[#61d49a]"
                  />
                </div>


                <div className="mt-2 flex items-center justify-between text-[7px] font-bold">
                  <span className="text-[#718798]">
                    Completion
                  </span>

                  <span className="text-white">
                    {
                      progress
                    }%
                  </span>
                </div>
              </div>


              {/* PREVIEW */}

              <div className="relative flex h-[260px] items-center justify-center overflow-hidden border-b border-[#e7ebef] bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#f6f8fa_62%,#edf1f4_100%)] p-5">
                <div
                  aria-hidden="true"
                  className="absolute h-[230px] w-[230px] rounded-full border border-[#dde4e9]"
                />

                <div
                  aria-hidden="true"
                  className="absolute h-[160px] w-[160px] rounded-full border border-[#ebd7d9]"
                />


                <AnimatePresence
                  mode="wait"
                >
                  {previewLoading ? (
                    <motion.div
                      key="loading"
                      initial={{
                        scale:
                          0.9,
                      }}
                      animate={{
                        scale:
                          1,
                      }}
                      className="relative z-10 text-center"
                    >
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#e31b2d]" />

                      <p className="mt-4 text-[8px] font-semibold text-[#667085]">
                        Identifying your vehicle...
                      </p>
                    </motion.div>
                  ) : previewImage ? (
                    <motion.div
                      key={
                        previewImage
                      }
                      initial={
                        reduceMotion
                          ? false
                          : {
                              scale:
                                0.92,

                              y:
                                12,
                            }
                      }
                      animate={{
                        scale:
                          1,

                        y:
                          0,
                      }}
                      className="relative z-10 h-full w-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}

                      <img
                        src={
                          previewImage
                        }
                        alt={
                          vehicleTitle
                        }
                        className="h-full w-full object-contain p-3 drop-shadow-[0_22px_26px_rgba(15,23,42,.15)]"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{
                        scale:
                          0.95,
                      }}
                      animate={{
                        scale:
                          1,
                      }}
                      className="relative z-10 flex flex-col items-center"
                    >
                      <VehiclePlaceholder />

                      <p className="mt-5 max-w-[250px] text-center text-[8px] leading-4 text-[#667085]">
                        {
                          previewMessage
                        }
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>


                {previewImage && (
                  <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-[#b9e4ca] bg-white/90 px-2.5 py-1 text-[7px] font-black text-[#16804a] shadow-sm backdrop-blur">
                    <CheckCircle2 className="h-3 w-3" />

                    Vehicle matched
                  </span>
                )}
              </div>


              {/* SUMMARY */}

              <div className="p-5">
                <h4 className="line-clamp-2 text-[18px] font-black tracking-[-0.03em] text-[#101828]">
                  {
                    vehicleTitle
                  }
                </h4>


                {form.nickname && (
                  <p className="mt-1 text-[8px] font-semibold text-[#e31b2d]">
                    “
                    {
                      form.nickname
                    }
                    ”
                  </p>
                )}


                <div className="mt-5 space-y-1">
                  <PreviewLine
                    label="Make"
                    value={
                      form.make ||
                      "Not selected"
                    }
                    complete={
                      Boolean(
                        form.make,
                      )
                    }
                  />

                  <PreviewLine
                    label="Model"
                    value={
                      form.model ||
                      "Not selected"
                    }
                    complete={
                      Boolean(
                        form.model,
                      )
                    }
                  />

                  <PreviewLine
                    label="Year"
                    value={
                      form.year ||
                      "Not selected"
                    }
                    complete={
                      Boolean(
                        form.year,
                      )
                    }
                  />

                  <PreviewLine
                    label="Engine"
                    value={
                      form.engine ||
                      "Not selected"
                    }
                    complete={
                      Boolean(
                        form.engine,
                      )
                    }
                  />

                  <PreviewLine
                    label="Transmission"
                    value={
                      form.transmission ||
                      "Not selected"
                    }
                    complete={
                      Boolean(
                        form.transmission,
                      )
                    }
                  />
                </div>


                <div className="mt-5 border-t border-[#edf0f2] pt-5">
                  <motion.button
                    type="submit"
                    disabled={
                      loading ||
                      !formComplete
                    }
                    whileHover={
                      formComplete &&
                      !loading &&
                      !reduceMotion
                        ? {
                            scale:
                              1.015,
                          }
                        : undefined
                    }
                    whileTap={
                      formComplete &&
                      !loading &&
                      !reduceMotion
                        ? {
                            scale:
                              0.985,
                          }
                        : undefined
                    }
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[9px] bg-[#e31b2d] px-5 text-[9px] font-black text-white shadow-[0_12px_28px_rgba(227,27,45,.18)] transition hover:bg-[#c91625] disabled:cursor-not-allowed disabled:bg-[#c7ccd2] disabled:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}


                    {loading
                      ? "Adding vehicle..."
                      : formComplete
                        ? "Add to My Garage"
                        : "Complete configuration"}
                  </motion.button>


                  <Link
                    href="/account/garage"
                    className="mt-2 flex h-10 w-full items-center justify-center rounded-[8px] text-[8px] font-bold text-[#667085] transition hover:bg-[#f5f7f9] hover:text-[#344054]"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </motion.div>
          </aside>
        </form>
      </section>
    </main>
  );
}


/* ============================================================
   HERO VEHICLE STAGE
============================================================ */

function HeroVehicleStage({
  title,
  previewImage,
  previewLoading,
  previewMessage,
  form,
}: {
  title:
    string;

  previewImage:
    string | null;

  previewLoading:
    boolean;

  previewMessage:
    string;

  form:
    FormState;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
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
      className="relative min-h-[470px] overflow-hidden rounded-[24px] border border-white/[0.11] bg-white/[0.055] shadow-[0_34px_90px_rgba(0,0,0,.20)] backdrop-blur-xl"
    >
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full border border-white/[0.06]"
      />

      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-[240px] w-[240px] rounded-full border border-[#e31b2d]/10"
      />


      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#74899a]">
              LIVE VEHICLE PREVIEW
            </p>

            <h2 className="mt-2 max-w-[520px] text-[25px] font-black tracking-[-0.04em] text-white sm:text-[30px]">
              {
                title
              }
            </h2>


            {form.nickname && (
              <p className="mt-1 text-[8px] font-bold text-[#ff6673]">
                {
                  form.nickname
                }
              </p>
            )}
          </div>


          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e31b2d]/25 bg-[#e31b2d]/10 text-[#ff4b5a]">
            <CarFront className="h-4.5 w-4.5" />
          </span>
        </div>


        <div className="relative mt-6 flex h-[300px] items-center justify-center overflow-hidden rounded-[18px] border border-white/[0.07] bg-black/10 p-5">
          <div
            aria-hidden="true"
            className="absolute h-[320px] w-[320px] rounded-full border border-white/[0.05]"
          />

          <div
            aria-hidden="true"
            className="absolute h-[220px] w-[220px] rounded-full border border-[#e31b2d]/10"
          />


          <AnimatePresence
            mode="wait"
          >
            {previewLoading ? (
              <motion.div
                key="preview-loading"
                initial={{
                  scale:
                    0.9,
                }}
                animate={{
                  scale:
                    1,
                }}
                className="relative z-10 text-center"
              >
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#ff4b5a]" />

                <p className="mt-4 text-[8px] font-bold text-[#8da2b2]">
                  Identifying vehicle...
                </p>
              </motion.div>
            ) : previewImage ? (
              <motion.div
                key={
                  previewImage
                }
                initial={
                  reduceMotion
                    ? false
                    : {
                        scale:
                          0.9,

                        y:
                          18,
                      }
                }
                animate={
                  reduceMotion
                    ? {
                        scale:
                          1,

                        y:
                          0,
                      }
                    : {
                        scale:
                          1,

                        y: [
                          0,
                          -7,
                          0,
                        ],
                      }
                }
                transition={
                  reduceMotion
                    ? {
                        duration:
                          0.4,
                      }
                    : {
                        scale: {
                          duration:
                            0.45,
                        },

                        y: {
                          delay:
                            0.45,

                          duration:
                            5,

                          repeat:
                            Infinity,

                          ease:
                            "easeInOut",
                        },
                      }
                }
                className="relative z-10 h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}

                <img
                  src={
                    previewImage
                  }
                  alt={
                    title
                  }
                  className="h-full w-full object-contain p-3 drop-shadow-[0_28px_30px_rgba(0,0,0,.24)]"
                />
              </motion.div>
            ) : (
              <motion.div
                key="vehicle-placeholder"
                initial={{
                  scale:
                    0.95,
                }}
                animate={{
                  scale:
                    1,
                }}
                className="relative z-10 flex flex-col items-center text-[#718899]"
              >
                <VehiclePlaceholder />

                <p className="mt-5 max-w-[300px] text-center text-[8px] leading-4 text-[#8297a7]">
                  {
                    previewMessage
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <DarkStageMetric
            label="Identity"
            value={
              form.make &&
              form.model
                ? `${form.make} ${form.model}`
                : "Waiting"
            }
          />

          <DarkStageMetric
            label="Year"
            value={
              form.year ||
              "Waiting"
            }
          />

          <DarkStageMetric
            label="Powertrain"
            value={
              form.engine
                ? "Selected"
                : "Waiting"
            }
          />
        </div>
      </div>
    </motion.div>
  );
}


/* ============================================================
   CONFIGURATOR SECTION
============================================================ */

function ConfiguratorSection({
  number,
  eyebrow,
  title,
  description,
  icon:
    Icon,
  complete,
  disabled =
    false,
  children,
}: {
  number:
    string;

  eyebrow:
    string;

  title:
    string;

  description:
    string;

  icon:
    typeof CarFront;

  complete:
    boolean;

  disabled?:
    boolean;

  children:
    React.ReactNode;
}) {
  const reduceMotion =
    useReducedMotion();


  return (
    <motion.section
      layout
      initial={
        reduceMotion
          ? false
          : {
              y:
                26,

              scale:
                0.99,
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
          0.18,
      }}
      className={`overflow-hidden rounded-[20px] border bg-white shadow-[0_12px_40px_rgba(15,23,42,.045)] ${
        disabled
          ? "border-[#e5e9ed] opacity-70"
          : complete
            ? "border-[#c9e5d4]"
            : "border-[#dce2e7]"
      }`}
    >
      <div className="flex items-start gap-4 border-b border-[#edf0f2] bg-[#fafbfc] p-5 sm:p-6">
        <span
          className={
            complete
              ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] bg-[#eaf9f0] text-[#16804a]"
              : "flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] bg-[#071b2d] text-white"
          }
        >
          {complete ? (
            <Check className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </span>


        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[7px] font-black uppercase tracking-[0.14em] text-[#e31b2d]">
              {
                number
              } /{" "}
              {
                eyebrow
              }
            </span>


            {complete && (
              <span className="rounded-full bg-[#eaf9f0] px-2 py-1 text-[6px] font-black uppercase tracking-[0.08em] text-[#16804a]">
                COMPLETE
              </span>
            )}
          </div>


          <h3 className="mt-2 text-[19px] font-black tracking-[-0.03em] text-[#101828]">
            {
              title
            }
          </h3>


          <p className="mt-1.5 max-w-[670px] text-[8px] leading-4 text-[#7b8794]">
            {
              description
            }
          </p>
        </div>
      </div>


      <div className="p-5 sm:p-6">
        {
          children
        }
      </div>
    </motion.section>
  );
}


/* ============================================================
   SELECT FIELD
============================================================ */

function SelectField({
  label,
  value,
  placeholder,
  options,
  disabled,
  loading =
    false,
  complete =
    false,
  onChange,
}: {
  label:
    string;

  value:
    string;

  placeholder:
    string;

  options:
    string[];

  disabled?:
    boolean;

  loading?:
    boolean;

  complete?:
    boolean;

  onChange: (
    value:
      string,
  ) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[8px] font-black uppercase tracking-[0.10em] text-[#596775]">
          {
            label
          }
        </span>


        {complete && (
          <span className="inline-flex items-center gap-1 text-[7px] font-bold text-[#16804a]">
            <Check className="h-3 w-3" />

            Selected
          </span>
        )}
      </div>


      <div className="relative">
        <select
          required
          value={
            value
          }
          disabled={
            disabled
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target.value,
            )
          }
          className={`h-[54px] w-full appearance-none rounded-[10px] border bg-white px-4 pr-11 text-[10px] font-semibold outline-none transition ${
            complete
              ? "border-[#b9dfc8] text-[#234b38] ring-2 ring-[#16804a]/[0.04]"
              : "border-[#d2d9df] text-[#17202b] focus:border-[#e31b2d]/55 focus:ring-4 focus:ring-[#e31b2d]/[0.05]"
          } disabled:cursor-not-allowed disabled:bg-[#f6f8fa] disabled:text-[#a0a9b3]`}
        >
          <option value="">
            {
              placeholder
            }
          </option>


          {options.map(
            (
              option,
            ) => (
              <option
                key={
                  option
                }
                value={
                  option
                }
              >
                {
                  option
                }
              </option>
            ),
          )}
        </select>


        {loading ? (
          <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#e31b2d]" />
        ) : complete ? (
          <CheckCircle2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#16804a]" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
        )}
      </div>
    </label>
  );
}


/* ============================================================
   TEXT FIELD
============================================================ */

function TextField({
  label,
  optional =
    false,
  value,
  placeholder,
  onChange,
}: {
  label:
    string;

  optional?:
    boolean;

  value:
    string;

  placeholder:
    string;

  onChange: (
    value:
      string,
  ) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[8px] font-black uppercase tracking-[0.10em] text-[#596775]">
          {
            label
          }
        </span>


        {optional && (
          <span className="rounded-full bg-[#f2f4f7] px-2 py-0.5 text-[6px] font-bold uppercase tracking-[0.08em] text-[#98a2b3]">
            Optional
          </span>
        )}
      </div>


      <input
        type="text"
        value={
          value
        }
        placeholder={
          placeholder
        }
        maxLength={
          50
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        className="h-[54px] w-full rounded-[10px] border border-[#d2d9df] bg-white px-4 text-[10px] font-semibold text-[#17202b] outline-none transition placeholder:text-[#a0a9b3] focus:border-[#e31b2d]/55 focus:ring-4 focus:ring-[#e31b2d]/[0.05]"
      />
    </label>
  );
}


/* ============================================================
   STAGE STATUS
============================================================ */

function StageStatusCard({
  title,
  description,
  complete,
}: {
  title:
    string;

  description:
    string;

  complete:
    boolean;
}) {
  return (
    <div
      className={
        complete
          ? "flex min-h-[78px] gap-3 rounded-[10px] border border-[#bfe3cc] bg-[#f2fbf5] p-4"
          : "flex min-h-[78px] gap-3 rounded-[10px] border border-[#e0e5e9] bg-[#fafbfc] p-4"
      }
    >
      <span
        className={
          complete
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#16804a] text-white"
            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#eef1f4] text-[#8b98a4]"
        }
      >
        {complete ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <CarFront className="h-3.5 w-3.5" />
        )}
      </span>


      <div>
        <p className="text-[8px] font-black text-[#344054]">
          {
            title
          }
        </p>

        <p className="mt-1 text-[7px] leading-4 text-[#7b8794]">
          {
            description
          }
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   MECHANICAL CARD
============================================================ */

function MechanicalCard({
  icon:
    Icon,
  label,
  value,
  active,
}: {
  icon:
    typeof Gauge;

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
          ? "flex items-center gap-3 rounded-[11px] border border-[#c7dfd1] bg-[#f5fbf7] p-4"
          : "flex items-center gap-3 rounded-[11px] border border-[#e0e5e9] bg-[#fafbfc] p-4"
      }
    >
      <span
        className={
          active
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#16804a]/10 text-[#16804a]"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#eef1f4] text-[#8794a0]"
        }
      >
        <Icon className="h-4 w-4" />
      </span>


      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.10em] text-[#98a2b3]">
          {
            label
          }
        </p>

        <p className="mt-1 truncate text-[9px] font-bold text-[#344054]">
          {
            value
          }
        </p>
      </div>
    </div>
  );
}


/* ============================================================
   PREVIEW LINE
============================================================ */

function PreviewLine({
  label,
  value,
  complete,
}: {
  label:
    string;

  value:
    string;

  complete:
    boolean;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-5 border-b border-[#f0f2f4] last:border-b-0">
      <span className="text-[8px] font-semibold text-[#98a2b3]">
        {
          label
        }
      </span>


      <span className="flex min-w-0 items-center gap-1.5">
        {complete && (
          <Check className="h-3 w-3 shrink-0 text-[#16804a]" />
        )}


        <span
          className={
            complete
              ? "max-w-[210px] truncate text-right text-[8px] font-bold text-[#344054]"
              : "max-w-[210px] truncate text-right text-[8px] font-semibold text-[#a0a9b3]"
          }
        >
          {
            value
          }
        </span>
      </span>
    </div>
  );
}


/* ============================================================
   PROGRESS NODE
============================================================ */

function ProgressNode({
  label,
  complete,
  index,
}: {
  label:
    string;

  complete:
    boolean;

  index:
    number;
}) {
  return (
    <div
      className={
        complete
          ? "rounded-[8px] border border-[#60c993]/20 bg-[#60c993]/[0.07] px-2 py-2"
          : "rounded-[8px] border border-white/[0.07] bg-white/[0.035] px-2 py-2"
      }
    >
      <div className="flex items-center gap-1.5">
        <span
          className={
            complete
              ? "flex h-4 w-4 items-center justify-center rounded-full bg-[#61d49a] text-[#061827]"
              : "flex h-4 w-4 items-center justify-center rounded-full border border-white/[0.12] text-[6px] font-black text-[#708596]"
          }
        >
          {complete ? (
            <Check className="h-2.5 w-2.5" />
          ) : (
            index
          )}
        </span>


        <span
          className={
            complete
              ? "truncate text-[6px] font-black uppercase tracking-[0.05em] text-[#7ce1ad]"
              : "truncate text-[6px] font-black uppercase tracking-[0.05em] text-[#6d8293]"
          }
        >
          {
            label
          }
        </span>
      </div>
    </div>
  );
}


/* ============================================================
   DARK METRIC
============================================================ */

function DarkStageMetric({
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

      <p className="mt-1 truncate text-[8px] font-bold text-[#dbe4eb]">
        {
          value
        }
      </p>
    </div>
  );
}


/* ============================================================
   CONFIGURATOR SIGNAL
============================================================ */

function ConfiguratorSignal({
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
   VEHICLE PLACEHOLDER
============================================================ */

function VehiclePlaceholder() {
  return (
    <svg
      viewBox="0 0 240 120"
      className="w-[180px] max-w-[70%] text-current"
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
  );
}
