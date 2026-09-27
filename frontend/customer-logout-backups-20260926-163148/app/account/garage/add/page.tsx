"use client";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  UserRound,
} from "lucide-react";

import { ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

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

export default function AddVehiclePage() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>(initialState);

  const [makes, setMakes] =
    useState<string[]>([]);

  const [models, setModels] =
    useState<string[]>([]);

  const [years, setYears] =
    useState<number[]>([]);

  const [engines, setEngines] =
    useState<string[]>([]);

  const [
    transmissions,
    setTransmissions,
  ] = useState<string[]>([]);

  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(true);

  const [
    modelsLoading,
    setModelsLoading,
  ] = useState(false);

  const [
    yearsLoading,
    setYearsLoading,
  ] = useState(false);

  const [
    optionsLoading,
    setOptionsLoading,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState(false);

  const [
    previewImage,
    setPreviewImage,
  ] = useState<string | null>(null);

  const [
    previewMessage,
    setPreviewMessage,
  ] = useState(
    "Select your vehicle to load a preview.",
  );

  /*
   * ==================================================
   * LOAD VEHICLE MAKES
   * ==================================================
   */

  useEffect(() => {
    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadMakes() {
      try {
        setCatalogLoading(true);

        const result =
          await getVehicleMakes();

        if (!cancelled) {
          setMakes(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load the vehicle catalog.",
          );
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    void loadMakes();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * ==================================================
   * VEHICLE IMAGE PREVIEW
   * ==================================================
   */

  useEffect(() => {
    const year =
      Number(form.year);

    if (
      !form.make ||
      !form.model ||
      !Number.isInteger(year)
    ) {
      return;
    }

    let cancelled = false;

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

            if (cancelled) {
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
          } catch (err) {
            if (cancelled) {
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
            if (!cancelled) {
              setPreviewLoading(
                false,
              );
            }
          }
        },
        500,
      );

    return () => {
      cancelled = true;

      window.clearTimeout(
        timeout,
      );
    };
  }, [
    form.year,
    form.make,
    form.model,
  ]);

  /*
   * ==================================================
   * MAKE
   * ==================================================
   */

  async function handleMakeChange(
    make: string,
  ) {
    setError("");

    setForm((current) => ({
      ...current,
      make,
      model: "",
      year: "",
      engine: "",
      transmission: "",
    }));

    setModels([]);
    setYears([]);
    setEngines([]);
    setTransmissions([]);

    resetPreview();

    if (!make) {
      return;
    }

    try {
      setModelsLoading(true);

      const result =
        await getVehicleModels(
          make,
        );

      setModels(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load vehicle models.",
      );
    } finally {
      setModelsLoading(false);
    }
  }

  /*
   * ==================================================
   * MODEL
   * ==================================================
   */

  async function handleModelChange(
    model: string,
  ) {
    setError("");

    setForm((current) => ({
      ...current,
      model,
      year: "",
      engine: "",
      transmission: "",
    }));

    setYears([]);
    setEngines([]);
    setTransmissions([]);

    setPreviewImage(null);
    setPreviewLoading(false);

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
      setYearsLoading(true);

      const result =
        await getVehicleYears(
          form.make,
          model,
        );

      setYears(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load model years.",
      );
    } finally {
      setYearsLoading(false);
    }
  }

  /*
   * ==================================================
   * YEAR
   * ==================================================
   */

  async function handleYearChange(
    yearValue: string,
  ) {
    setError("");

    setForm((current) => ({
      ...current,
      year: yearValue,
      engine: "",
      transmission: "",
    }));

    setEngines([]);
    setTransmissions([]);

    setPreviewImage(null);
    setPreviewLoading(false);

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
      Number(yearValue);

    if (
      !Number.isInteger(year)
    ) {
      return;
    }

    try {
      setOptionsLoading(true);

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
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load vehicle specifications.",
      );
    } finally {
      setOptionsLoading(false);
    }
  }

  /*
   * ==================================================
   * SIMPLE FIELDS
   * ==================================================
   */

  function updateField(
    field:
      | "engine"
      | "transmission"
      | "nickname",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetPreview() {
    setPreviewImage(null);
    setPreviewLoading(false);

    setPreviewMessage(
      "Select your vehicle to load a preview.",
    );
  }

  /*
   * ==================================================
   * SUBMIT
   * ==================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const year =
      Number(form.year);

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
      !Number.isInteger(year) ||
      year < 1950 ||
      year > 2100
    ) {
      setError(
        "Please select a valid model year.",
      );

      return;
    }

    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      await createVehicle(
        token,
        {
          year,
          make: form.make,
          model: form.model,
          engine: form.engine,
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
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 ||
          err.status === 403)
      ) {
        router.replace(
          "/login",
        );

        return;
      }

      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to add vehicle.",
      );
    } finally {
      setLoading(false);
    }
  }

  const formComplete =
    Boolean(
      form.make &&
        form.model &&
        form.year &&
        form.engine &&
        form.transmission,
    );

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-[#0b1f33]">
      <VehnexaNavbar />

      <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        {/* BACK */}

        <Link
          href="/account/garage"
          className="inline-flex items-center gap-2 text-[11px] font-medium text-[#667085] transition hover:text-[#e31b2d]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />

          Back to My Garage
        </Link>

        {/* PAGE HEADING */}

        <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e31b2d]">
              MY GARAGE
            </p>

            <h1 className="mt-4 text-[36px] font-bold leading-none tracking-[-0.045em] text-[#081b31]">
              Add a vehicle
            </h1>

            <p className="mt-5 max-w-[670px] text-[12px] leading-6 text-[#52627a]">
              Select your vehicle
              details. Vehnexa will
              use this vehicle for
              marketplace
              compatibility and AI
              Mechanic context.
            </p>
          </div>

          <div className="flex h-10 w-fit items-center gap-2 rounded-[6px] border border-[#dfe4ea] bg-white px-4 text-[10px] font-medium text-[#52627a]">
            <Sparkles className="h-4 w-4 text-[#e31b2d]" />

            Smart vehicle matching
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-[6px] border border-[#f5c2c7] bg-[#fff5f6] px-4 py-3 text-[11px] text-[#b42318]">
            {error}
          </div>
        )}

        {/* MAIN CONTENT */}

        <div className="mt-10 grid gap-7 xl:grid-cols-[minmax(0,1.95fr)_minmax(330px,1fr)]">
          {/* LEFT FORM */}

          <form
            onSubmit={
              handleSubmit
            }
            className="overflow-hidden rounded-[10px] border border-[#dce2e9] bg-white"
          >
            {/* HEADER */}

            <div className="flex items-start gap-4 border-b border-[#e7eaee] px-8 py-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] bg-[#fff0f1]">
                <CarFront className="h-5 w-5 text-[#e31b2d]" />
              </div>

              <div>
                <h2 className="text-[15px] font-bold text-[#0b1f33]">
                  Vehicle details
                </h2>

                <p className="mt-2 text-[11px] leading-5 text-[#667085]">
                  Choose each option
                  in order so Vehnexa
                  can build the correct
                  vehicle profile.
                </p>
              </div>
            </div>

            {/* FORM CONTENT */}

            <div className="px-8 py-8">
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
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
                  options={years.map(
                    String,
                  )}
                  disabled={
                    !form.model ||
                    yearsLoading
                  }
                  onChange={(
                    value,
                  ) => {
                    void handleYearChange(
                      value,
                    );
                  }}
                />

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
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "transmission",
                      value,
                    )
                  }
                />

                <TextField
                  label="Nickname"
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
              </div>

              {/* COMPATIBILITY */}

              <div className="mt-7 flex gap-3 rounded-[7px] border border-[#dfe4ea] bg-[#f8fafc] px-5 py-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#159b70]" />

                <div>
                  <p className="text-[11px] font-bold text-[#223248]">
                    Compatibility profile
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-[#667085]">
                    Make, model,
                    year, engine and
                    transmission will
                    be used by Vehnexa
                    when checking
                    marketplace
                    compatibility.
                  </p>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#e7eaee] pt-5">
                <Link
                  href="/account/garage"
                  className="flex h-10 items-center justify-center rounded-[6px] border border-[#ccd3dc] bg-white px-6 text-[11px] font-semibold text-[#26374d] transition hover:bg-[#f8fafc]"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formComplete
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#e31b2d] px-6 text-[11px] font-semibold text-white transition hover:bg-[#c81727] disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {loading
                    ? "Adding..."
                    : "Add vehicle"}
                </button>
              </div>
            </div>
          </form>

          {/* RIGHT PREVIEW */}

          <aside className="self-start overflow-hidden rounded-[10px] border border-[#dce2e9] bg-white">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#159b70]">
                  VEHICLE PREVIEW
                </p>

                <h2 className="mt-2 text-[15px] font-bold text-[#0b1f33]">
                  Your vehicle
                </h2>
              </div>

              <CarFront className="h-4 w-4 text-[#98a2b3]" />
            </div>

            {/* PREVIEW IMAGE */}

            <div className="flex h-[285px] flex-col items-center justify-center border-y border-[#e7eaee] bg-[#f1f4f7] px-6 text-center">
              {previewLoading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-[#e31b2d]" />

                  <p className="mt-5 text-[11px] text-[#667085]">
                    Identifying your
                    vehicle...
                  </p>
                </>
              ) : previewImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      previewImage
                    }
                    alt={`${form.year} ${form.make} ${form.model}`}
                    className="h-[195px] w-full object-contain"
                  />

                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-semibold text-[#159b70]">
                    <CheckCircle2 className="h-3.5 w-3.5" />

                    Vehicle matched
                  </div>
                </>
              ) : (
                <>
                  <VehiclePlaceholder />

                  <p className="mt-6 text-[11px] text-[#52627a]">
                    {previewMessage}
                  </p>
                </>
              )}
            </div>

            {/* VEHICLE DETAILS */}

            <div className="px-6 py-5">
              <PreviewLine
                label="Make"
                value={
                  form.make ||
                  "Not selected"
                }
              />

              <PreviewLine
                label="Model"
                value={
                  form.model ||
                  "Not selected"
                }
              />

              <PreviewLine
                label="Year"
                value={
                  form.year ||
                  "Not selected"
                }
              />

              <div className="my-4 h-px bg-[#e7eaee]" />

              <PreviewLine
                label="Engine"
                value={
                  form.engine ||
                  "Not selected"
                }
              />

              <PreviewLine
                label="Transmission"
                value={
                  form.transmission ||
                  "Not selected"
                }
              />

              <PreviewLine
                label="Nickname"
                value={
                  form.nickname ||
                  "Optional"
                }
              />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

/*
 * ==================================================
 * NAVBAR
 * ==================================================
 */

function VehnexaNavbar() {
  return (
    <header className="border-b border-[#163047] bg-[#071b2d]">
      <div className="mx-auto flex h-[62px] max-w-[1320px] items-center px-4 sm:px-6 lg:px-8">
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
            active
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
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#c4ced7] transition hover:bg-white/5 hover:text-white"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Shopping cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-[#c4ced7] transition hover:bg-white/5 hover:text-white"
          >
            <ShoppingCart className="h-4 w-4" />

            <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#e31b2d]" />
          </button>

          <NavbarNotificationBell />

          <Link
            href="/account"
            aria-label="Account"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#c4ced7] transition hover:bg-white/5 hover:text-white"
          >
            <UserRound className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/*
 * ==================================================
 * LOGO
 * ==================================================
 */

function VehnexaMark() {
  return (
    <div className="relative h-7 w-7 shrink-0">
      <span className="absolute left-[1px] top-[3px] block h-[22px] w-[10px] -skew-x-[25deg] rounded-[2px] bg-[#e31b2d]" />

      <span className="absolute right-[2px] top-[3px] block h-[22px] w-[10px] skew-x-[25deg] rounded-[2px] bg-[#d8dee5]" />
    </div>
  );
}

/*
 * ==================================================
 * NAV LINK
 * ==================================================
 */

function TopNavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
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

/*
 * ==================================================
 * SELECT FIELD
 * ==================================================
 */

function SelectField({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium text-[#15263c]">
        {label}
      </span>

      <div className="relative">
        <select
          required
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className="h-12 w-full appearance-none rounded-[7px] border border-[#ccd4de] bg-white px-4 pr-10 text-[11px] text-[#0b1f33] outline-none transition focus:border-[#e31b2d] focus:ring-2 focus:ring-[#e31b2d]/10 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#98a2b3]"
        >
          <option value="">
            {placeholder}
          </option>

          {options.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ),
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
      </div>
    </label>
  );
}

/*
 * ==================================================
 * TEXT FIELD
 * ==================================================
 */

function TextField({
  label,
  optional = false,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  optional?: boolean;
  value: string;
  placeholder: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium text-[#15263c]">
        {label}

        {optional && (
          <span className="ml-1 font-normal text-[#98a2b3]">
            (optional)
          </span>
        )}
      </span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={50}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-12 w-full rounded-[7px] border border-[#ccd4de] bg-white px-4 text-[11px] text-[#0b1f33] outline-none transition placeholder:text-[#98a2b3] focus:border-[#e31b2d] focus:ring-2 focus:ring-[#e31b2d]/10"
      />
    </label>
  );
}

/*
 * ==================================================
 * PREVIEW LINE
 * ==================================================
 */

function PreviewLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-5">
      <span className="text-[10px] text-[#667085]">
        {label}
      </span>

      <span className="max-w-[190px] truncate text-right text-[10px] font-bold text-[#15263c]">
        {value}
      </span>
    </div>
  );
}

/*
 * ==================================================
 * VEHICLE PLACEHOLDER
 * ==================================================
 */

function VehiclePlaceholder() {
  return (
    <svg
      viewBox="0 0 240 120"
      className="w-[130px] text-[#adb8c6]"
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
        fill="#f1f4f7"
        stroke="currentColor"
        strokeWidth="7"
      />

      <circle
        cx="171"
        cy="81"
        r="23"
        fill="#f1f4f7"
        stroke="currentColor"
        strokeWidth="7"
      />
    </svg>
  );
}