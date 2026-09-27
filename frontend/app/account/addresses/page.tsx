"use client";

import { CustomerNavbarBrand, CustomerNavbarLinks, CustomerNavbarCart } from "@/components/customer/CustomerNavbarParts";

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
  motion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Edit3,
  Heart,
  Home,
  Layers3,
  MapPin,
  Navigation,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  UserRound,
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
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressPayload,
} from "@/lib/addresses";

import {
  CART_UPDATED_EVENT,
  getCartCount,
} from "@/lib/cart";


type AddressFormState = {
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  country: string;
  postal_code: string;
};


const EMPTY_FORM: AddressFormState = {
  label: "Home",
  recipient_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  region: "",
  country: "Lebanon",
  postal_code: "",
};


const reveal = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};


export default function SavedAddressesPage() {
  const router = useRouter();

  const [
    user,
    setUser,
  ] = useState<UserPublic | null>(
    null,
  );

  const [
    addresses,
    setAddresses,
  ] = useState<Address[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false,
  );

  const [
    error,
    setError,
  ] = useState(
    "",
  );

  const [
    success,
    setSuccess,
  ] = useState(
    "",
  );

  const [
    formOpen,
    setFormOpen,
  ] = useState(
    false,
  );

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<AddressFormState>(
    EMPTY_FORM,
  );

  const [
    cartCount,
    setCartCount,
  ] = useState(
    0,
  );


  /* ==========================================================
     LOAD
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

    const accessToken =
      token;

    let cancelled =
      false;

    async function loadPage() {
      try {
        const [
          currentUser,
          savedAddresses,
        ] =
          await Promise.all([
            getCurrentUser(
              accessToken,
            ),

            getAddresses(
              accessToken,
            ),
          ]);

        if (cancelled) {
          return;
        }

        setUser(
          currentUser,
        );

        setAddresses(
          savedAddresses,
        );
      } catch (loadError) {
        if (
          loadError instanceof ApiError &&
          (
            loadError.status === 401 ||
            loadError.status === 403
          )
        ) {
          removeAccessToken();

          router.replace(
            "/login",
          );

          return;
        }

        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Unable to load saved addresses.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadPage();

    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


  /* ==========================================================
     REAL CART COUNT
  ========================================================== */

  useEffect(() => {
    function syncCartCount() {
      setCartCount(
        getCartCount(),
      );
    }

    syncCartCount();

    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCartCount,
    );

    window.addEventListener(
      "storage",
      syncCartCount,
    );

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCartCount,
      );

      window.removeEventListener(
        "storage",
        syncCartCount,
      );
    };
  }, []);


  /* ==========================================================
     USER
  ========================================================== */

  const displayName =
    useMemo(() => {
      if (!user) {
        return "Customer";
      }

      return (
        `${user.first_name ?? ""} ${user.last_name ?? ""}`
          .trim() ||
        "Customer"
      );
    }, [
      user,
    ]);

  const initials =
    useMemo(() => {
      if (!user) {
        return "V";
      }

      const first =
        user.first_name?.[0] ??
        "";

      const last =
        user.last_name?.[0] ??
        "";

      return (
        `${first}${last}`
          .toUpperCase() ||
        "V"
      );
    }, [
      user,
    ]);


  /* ==========================================================
     REAL ADDRESS METRICS
  ========================================================== */

  const defaultAddress =
    useMemo(
      () =>
        addresses.find(
          (address) =>
            address.is_default,
        ) ??
        null,
      [
        addresses,
      ],
    );

  const uniqueCities =
    useMemo(
      () =>
        new Set(
          addresses
            .map(
              (address) =>
                address.city
                  .trim()
                  .toLowerCase(),
            )
            .filter(
              Boolean,
            ),
        ).size,
      [
        addresses,
      ],
    );

  const countries =
    useMemo(
      () =>
        new Set(
          addresses
            .map(
              (address) =>
                address.country
                  .trim()
                  .toLowerCase(),
            )
            .filter(
              Boolean,
            ),
        ).size,
      [
        addresses,
      ],
    );


  /* ==========================================================
     FORM
  ========================================================== */

  function resetForm() {
    setForm(
      EMPTY_FORM,
    );

    setEditingId(
      null,
    );

    setFormOpen(
      false,
    );
  }


  function openNewAddress() {
    setError(
      "",
    );

    setSuccess(
      "",
    );

    setEditingId(
      null,
    );

    setForm({
      ...EMPTY_FORM,

      recipient_name:
        displayName ===
        "Customer"
          ? ""
          : displayName,

      phone:
        user?.phone ??
        "",
    });

    setFormOpen(
      true,
    );
  }


  function openEdit(
    address: Address,
  ) {
    setError(
      "",
    );

    setSuccess(
      "",
    );

    setEditingId(
      address.id,
    );

    setForm({
      label:
        address.label,

      recipient_name:
        address.recipient_name,

      phone:
        address.phone,

      address_line1:
        address.address_line1,

      address_line2:
        address.address_line2 ??
        "",

      city:
        address.city,

      region:
        address.region ??
        "",

      country:
        address.country,

      postal_code:
        address.postal_code ??
        "",
    });

    setFormOpen(
      true,
    );
  }


  function updateField(
    field:
      keyof AddressFormState,
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


  async function submitAddress(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      getAccessToken();

    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }

    const payload:
      AddressPayload = {
        label:
          form.label.trim(),

        recipient_name:
          form.recipient_name.trim(),

        phone:
          form.phone.trim(),

        address_line1:
          form.address_line1.trim(),

        address_line2:
          form.address_line2.trim() ||
          null,

        city:
          form.city.trim(),

        region:
          form.region.trim() ||
          null,

        country:
          form.country.trim(),

        postal_code:
          form.postal_code.trim() ||
          null,
      };

    try {
      setSaving(
        true,
      );

      setError(
        "",
      );

      setSuccess(
        "",
      );

      if (editingId) {
        const updated =
          await updateAddress(
            token,
            editingId,
            payload,
          );

        setAddresses(
          (
            current,
          ) =>
            current.map(
              (
                item,
              ) =>
                item.id ===
                updated.id
                  ? updated
                  : item,
            ),
        );

        setSuccess(
          "Address updated.",
        );
      } else {
        const created =
          await createAddress(
            token,
            payload,
          );

        setAddresses(
          (
            current,
          ) => [
            created,
            ...current,
          ],
        );

        setSuccess(
          "Address saved.",
        );
      }

      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Unable to save address.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }


  async function makeDefault(
    addressId: string,
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
      setError(
        "",
      );

      setSuccess(
        "",
      );

      const updated =
        await setDefaultAddress(
          token,
          addressId,
        );

      setAddresses(
        (
          current,
        ) =>
          current
            .map(
              (
                item,
              ) => ({
                ...item,

                is_default:
                  item.id ===
                  updated.id,
              }),
            )
            .sort(
              (
                first,
                second,
              ) =>
                Number(
                  second.is_default,
                ) -
                Number(
                  first.is_default,
                ),
            ),
      );

      setSuccess(
        "Default address updated.",
      );
    } catch (defaultError) {
      setError(
        defaultError instanceof ApiError
          ? defaultError.message
          : "Unable to update default address.",
      );
    }
  }


  async function removeAddress(
    address: Address,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${address.label}" address?`,
      );

    if (!confirmed) {
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
      setError(
        "",
      );

      setSuccess(
        "",
      );

      await deleteAddress(
        token,
        address.id,
      );

      const refreshed =
        await getAddresses(
          token,
        );

      setAddresses(
        refreshed,
      );

      if (
        editingId ===
        address.id
      ) {
        resetForm();
      }

      setSuccess(
        "Address deleted.",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError
          ? deleteError.message
          : "Unable to delete address.",
      );
    }
  }


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7f9] text-[#0b1520]">
      {/* ========================================================
          NAVBAR
      ======================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#061827]/95 text-white shadow-[0_8px_40px_rgba(2,12,22,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-[1480px] items-center px-4 sm:px-6 lg:px-8">
          <CustomerNavbarBrand />


          <CustomerNavbarLinks />


          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              aria-label="Search parts"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[#c4ced7] transition hover:bg-white/[0.06] hover:text-white sm:flex"
            >
              <Search className="h-[17px] w-[17px]" />
            </Link>


            <CustomerNavbarCart count={cartCount} />


            <NavbarNotificationBell />


            <Link
              href="/account"
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
            >
              <UserRound className="h-[17px] w-[17px]" />
            </Link>


            <CustomerLogoutButton />
          </div>
        </div>
      </header>


      {/* ========================================================
          HERO
      ======================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-35%] h-[620px] w-[620px] rounded-full bg-[#e31b2d]/[0.12] blur-[120px]" />

          <div className="absolute right-[-12%] top-[4%] h-[560px] w-[560px] rounded-full bg-[#3b82f6]/[0.08] blur-[130px]" />

          <div
            className="absolute inset-0 opacity-[0.11]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
              backgroundSize:
                "54px 54px",
            }}
          />

          <motion.div
            aria-hidden="true"
            animate={{
              x: [
                "-10%",
                "110%",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-[38%] h-px w-[36%] bg-gradient-to-r from-transparent via-[#ff394a] to-transparent opacity-70 shadow-[0_0_22px_rgba(255,57,74,0.75)]"
          />
        </div>


        <div className="relative mx-auto max-w-[1480px] px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <motion.div
              initial={{
                opacity: 0,
                y: 24,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.65,
              }}
            >
              <Link
                href="/account"
                className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9fb0c0] transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />

                Account command center
              </Link>


              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#ff394a]" />

                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff5967]">
                  Delivery profile
                </span>
              </div>


              <h1 className="max-w-[900px] text-[52px] font-black leading-[0.94] tracking-[-0.055em] sm:text-[68px] lg:text-[82px] xl:text-[94px]">
                Every delivery.
                <span className="block text-[#ff394a]">
                  Ready to go.
                </span>
              </h1>


              <p className="mt-7 max-w-[700px] text-[14px] leading-7 text-[#9fb0c0] sm:text-[15px]">
                Keep your real delivery locations organized, choose the address you want used by default, and move through checkout with less friction.
              </p>


              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    openNewAddress
                  }
                  className="group inline-flex h-13 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-[0_16px_38px_rgba(227,27,45,0.24)] transition hover:bg-[#f32639]"
                >
                  <Plus className="h-4 w-4" />

                  Add address

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>


                <Link
                  href="/checkout"
                  className="inline-flex h-13 items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] px-7 text-[11px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-white/[0.08]"
                >
                  <ShoppingBag className="h-4 w-4" />

                  Checkout
                </Link>
              </div>
            </motion.div>


            <motion.div
              initial={{
                opacity: 0,
                y: 28,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: 0.7,
                delay: 0.08,
              }}
              className="relative"
            >
              <div className="absolute inset-0 translate-y-6 rounded-[32px] bg-[#e31b2d]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.055] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#91a6b8]">
                      <Navigation className="h-3.5 w-3.5 text-[#ff4657]" />

                      Default delivery location
                    </div>

                    <h2 className="mt-3 text-[24px] font-black tracking-[-0.035em]">
                      {loading
                        ? "Loading delivery profile..."
                        : defaultAddress
                          ? defaultAddress.label
                          : "No default address yet"}
                    </h2>
                  </div>


                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e31b2d] text-white shadow-[0_12px_30px_rgba(227,27,45,0.24)]">
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>


                {loading ? (
                  <div className="mt-8 space-y-3">
                    <div className="h-4 w-[72%] animate-pulse rounded-full bg-white/[0.08]" />
                    <div className="h-4 w-[55%] animate-pulse rounded-full bg-white/[0.08]" />
                    <div className="h-4 w-[63%] animate-pulse rounded-full bg-white/[0.08]" />
                  </div>
                ) : defaultAddress ? (
                  <>
                    <div className="mt-8 border-l-2 border-[#e31b2d] pl-5">
                      <p className="text-[15px] font-bold text-white">
                        {defaultAddress.recipient_name}
                      </p>

                      <p className="mt-3 text-[12px] leading-6 text-[#a9bac9]">
                        {defaultAddress.address_line1}
                      </p>

                      {defaultAddress.address_line2 && (
                        <p className="text-[12px] leading-6 text-[#a9bac9]">
                          {defaultAddress.address_line2}
                        </p>
                      )}

                      <p className="text-[12px] leading-6 text-[#a9bac9]">
                        {[
                          defaultAddress.city,
                          defaultAddress.region,
                          defaultAddress.country,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            ", ",
                          )}
                      </p>

                      {defaultAddress.postal_code && (
                        <p className="text-[12px] leading-6 text-[#a9bac9]">
                          {defaultAddress.postal_code}
                        </p>
                      )}
                    </div>


                    <div className="mt-7 flex items-center justify-between border-t border-white/[0.08] pt-5">
                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#75d49d]">
                        <CheckCircle2 className="h-4 w-4" />

                        Current default
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            defaultAddress,
                          )
                        }
                        className="text-[9px] font-black uppercase tracking-[0.14em] text-white transition hover:text-[#ff5967]"
                      >
                        Edit location
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-8">
                    <p className="max-w-[460px] text-[12px] leading-6 text-[#9fb0c0]">
                      Add a saved delivery address and choose one as your default when you are ready.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openNewAddress
                      }
                      className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5967]"
                    >
                      Add delivery location

                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ========================================================
          STATUS STRIP
      ======================================================== */}

      <section className="border-b border-[#e4e8ec] bg-white">
        <div className="mx-auto grid max-w-[1480px] divide-y divide-[#edf0f2] px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          <MetricStrip
            icon={
              MapPin
            }
            value={
              loading
                ? "—"
                : String(
                    addresses.length,
                  )
            }
            label="Saved locations"
            detail="Real addresses stored in your account"
          />

          <MetricStrip
            icon={
              Navigation
            }
            value={
              loading
                ? "—"
                : defaultAddress
                  ? "Ready"
                  : "Not set"
            }
            label="Default address"
            detail={
              defaultAddress
                ? defaultAddress.label
                : "Choose a preferred delivery location"
            }
          />

          <MetricStrip
            icon={
              Layers3
            }
            value={
              loading
                ? "—"
                : String(
                    uniqueCities,
                  )
            }
            label="Cities represented"
            detail={
              loading
                ? "Loading address profile"
                : `${countries} ${
                    countries === 1
                      ? "country"
                      : "countries"
                  } across saved addresses`
            }
          />
        </div>
      </section>


      {/* ========================================================
          FEEDBACK
      ======================================================== */}

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
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
            className="mt-7 flex items-start gap-3 rounded-2xl border border-[#f1b9bf] bg-[#fff2f3] px-5 py-4 text-[11px] font-medium text-[#a3202c]"
          >
            <X className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {error}
            </span>
          </motion.div>
        )}


        {success && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-7 flex items-start gap-3 rounded-2xl border border-[#bde6ce] bg-[#effbf4] px-5 py-4 text-[11px] font-medium text-[#087443]"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {success}
            </span>
          </motion.div>
        )}
      </div>


      {/* ========================================================
          MAIN ACCOUNT AREA
      ======================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* SIDEBAR */}

          <aside>
            <div className="sticky top-[100px] overflow-hidden rounded-[24px] border border-[#e0e5e9] bg-white shadow-[0_18px_50px_rgba(20,35,50,0.055)]">
              <div className="border-b border-[#edf0f2] p-6">
                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-[#071b2d] text-[16px] font-black text-white shadow-[0_12px_30px_rgba(7,27,45,0.16)]">
                  {initials}
                </div>

                <h2 className="mt-5 truncate text-[15px] font-black tracking-[-0.025em] text-[#101828]">
                  {displayName}
                </h2>

                <p className="mt-1 truncate text-[9px] text-[#7d8995]">
                  {user?.email ??
                    "Customer account"}
                </p>
              </div>


              <div className="p-3">
                <ProfileLink
                  href="/account"
                  icon={
                    CircleUserRound
                  }
                  label="Overview"
                />

                <ProfileLink
                  href="/orders"
                  icon={
                    Package
                  }
                  label="Orders"
                />

                <ProfileLink
                  href="/account/garage"
                  icon={
                    Home
                  }
                  label="My Garage"
                />

                <div className="relative my-1 flex min-h-12 items-center gap-3 overflow-hidden rounded-xl bg-[#fff0f2] px-4 text-[10px] font-black text-[#df1e30]">
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#e31b2d]" />

                  <MapPin className="h-4 w-4" />

                  Addresses
                </div>

                <ProfileLink
                  href="/account/wishlist"
                  icon={
                    Heart
                  }
                  label="Wishlist"
                />

                <ProfileLink
                  href="/account/notifications"
                  icon={
                    Bell
                  }
                  label="Notifications"
                />
              </div>


              <div className="border-t border-[#edf0f2] p-4">
                <Link
                  href="/shop"
                  className="group flex items-center justify-between rounded-xl bg-[#071b2d] px-4 py-4 text-white transition hover:bg-[#0b263d]"
                >
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#8da2b4]">
                      Marketplace
                    </div>

                    <div className="mt-1 text-[10px] font-black">
                      Continue shopping
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </aside>


          {/* MAIN CONTENT */}

          <div className="min-w-0 space-y-8">
            {/* SECTION INTRO */}

            <motion.div
              variants={
                reveal
              }
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.5,
              }}
              className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#e31b2d]">
                  <ShieldCheck className="h-4 w-4" />

                  Saved delivery data
                </div>

                <h2 className="mt-3 text-[34px] font-black tracking-[-0.045em] text-[#0b1520] sm:text-[42px]">
                  Your address book.
                </h2>

                <p className="mt-3 max-w-[650px] text-[12px] leading-6 text-[#697682]">
                  Manage the delivery information stored in your Vehnexa account. Only addresses you save here are displayed.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  openNewAddress
                }
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e31b2d] px-6 text-[10px] font-black uppercase tracking-[0.09em] text-white shadow-[0_12px_30px_rgba(227,27,45,0.2)] transition hover:bg-[#f1263a]"
              >
                <Plus className="h-4 w-4" />

                Add address
              </button>
            </motion.div>


            {/* ==================================================
                ADD / EDIT CONFIGURATOR
            ================================================== */}

            {formOpen && (
              <motion.form
                initial={{
                  opacity: 0,
                  y: 22,
                  scale: 0.99,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                onSubmit={
                  submitAddress
                }
                className="overflow-hidden rounded-[28px] border border-[#dfe4e8] bg-white shadow-[0_22px_60px_rgba(22,34,47,0.07)]"
              >
                <div className="relative overflow-hidden bg-[#071b2d] px-6 py-7 text-white sm:px-8">
                  <div className="pointer-events-none absolute right-[-70px] top-[-100px] h-[250px] w-[250px] rounded-full bg-[#e31b2d]/20 blur-[80px]" />

                  <div className="relative flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e31b2d] shadow-[0_12px_28px_rgba(227,27,45,0.24)]">
                        {editingId
                          ? (
                            <Edit3 className="h-5 w-5" />
                          )
                          : (
                            <Plus className="h-5 w-5" />
                          )}
                      </div>

                      <div>
                        <div className="text-[8px] font-black uppercase tracking-[0.22em] text-[#8fa4b6]">
                          {editingId
                            ? "Update delivery profile"
                            : "New delivery profile"}
                        </div>

                        <h3 className="mt-2 text-[23px] font-black tracking-[-0.035em]">
                          {editingId
                            ? "Edit saved address"
                            : "Add a saved address"}
                        </h3>

                        <p className="mt-2 max-w-[650px] text-[11px] leading-5 text-[#9fb0c0]">
                          Enter the delivery information exactly as it should appear on your order.
                        </p>
                      </div>
                    </div>


                    <button
                      type="button"
                      onClick={
                        resetForm
                      }
                      aria-label="Close address form"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#aebdca] transition hover:bg-white/[0.09] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>


                <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="p-6 sm:p-8">
                    <div className="mb-7 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f2] text-[10px] font-black text-[#e31b2d]">
                        01
                      </div>

                      <div>
                        <h4 className="text-[12px] font-black">
                          Delivery identity
                        </h4>

                        <p className="mt-0.5 text-[9px] text-[#7c8995]">
                          Label and recipient details
                        </p>
                      </div>
                    </div>


                    <div className="grid gap-5 sm:grid-cols-2">
                      <AddressInput
                        label="Address label"
                        value={
                          form.label
                        }
                        placeholder="Home"
                        onChange={(
                          value,
                        ) =>
                          updateField(
                            "label",
                            value,
                          )
                        }
                      />

                      <AddressInput
                        label="Recipient name"
                        value={
                          form.recipient_name
                        }
                        placeholder="Full name"
                        onChange={(
                          value,
                        ) =>
                          updateField(
                            "recipient_name",
                            value,
                          )
                        }
                      />

                      <AddressInput
                        label="Phone"
                        value={
                          form.phone
                        }
                        placeholder="+961..."
                        onChange={(
                          value,
                        ) =>
                          updateField(
                            "phone",
                            value,
                          )
                        }
                      />

                      <AddressInput
                        label="Country"
                        value={
                          form.country
                        }
                        placeholder="Lebanon"
                        onChange={(
                          value,
                        ) =>
                          updateField(
                            "country",
                            value,
                          )
                        }
                      />
                    </div>


                    <div className="my-8 h-px bg-[#edf0f2]" />


                    <div className="mb-7 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f2] text-[10px] font-black text-[#e31b2d]">
                        02
                      </div>

                      <div>
                        <h4 className="text-[12px] font-black">
                          Location details
                        </h4>

                        <p className="mt-0.5 text-[9px] text-[#7c8995]">
                          Street, city and regional information
                        </p>
                      </div>
                    </div>


                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <AddressInput
                          label="Address line 1"
                          value={
                            form.address_line1
                          }
                          placeholder="Street, building, floor..."
                          onChange={(
                            value,
                          ) =>
                            updateField(
                              "address_line1",
                              value,
                            )
                          }
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <AddressInput
                          label="Address line 2 (optional)"
                          value={
                            form.address_line2
                          }
                          placeholder="Apartment, landmark..."
                          onChange={(
                            value,
                          ) =>
                            updateField(
                              "address_line2",
                              value,
                            )
                          }
                        />
                      </div>

                      <AddressInput
                        label="City"
                        value={
                          form.city
                        }
                        placeholder="City"
                        onChange={(
                          value,
                        ) =>
                          updateField(
                            "city",
                            value,
                          )
                        }
                      />

                      <AddressInput
                        label="Region"
                        value={
                          form.region
                        }
                        placeholder="Region"
                        onChange={(
                          value,
                        ) =>
                          updateField(
                            "region",
                            value,
                          )
                        }
                      />

                      <AddressInput
                        label="Postal code (optional)"
                        value={
                          form.postal_code
                        }
                        placeholder="Postal code"
                        onChange={(
                          value,
                        ) =>
                          updateField(
                            "postal_code",
                            value,
                          )
                        }
                      />
                    </div>
                  </div>


                  <div className="border-t border-[#edf0f2] bg-[#f8fafb] p-6 lg:border-l lg:border-t-0">
                    <div className="sticky top-[110px]">
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#8a96a2]">
                        Build review
                      </div>

                      <h4 className="mt-3 text-[18px] font-black tracking-[-0.03em]">
                        {form.label.trim() ||
                          "New address"}
                      </h4>


                      <div className="mt-6 rounded-2xl border border-[#e0e5e9] bg-white p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071b2d] text-white">
                          <MapPin className="h-4 w-4" />
                        </div>

                        <p className="mt-5 text-[11px] font-bold text-[#25313c]">
                          {form.recipient_name.trim() ||
                            "Recipient name"}
                        </p>

                        <p className="mt-3 min-h-[72px] text-[9px] leading-5 text-[#788590]">
                          {form.address_line1.trim() ||
                            "Street and building details will appear here."}

                          {form.city.trim() && (
                            <>
                              <br />

                              {[
                                form.city.trim(),
                                form.region.trim(),
                                form.country.trim(),
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ", ",
                                )}
                            </>
                          )}
                        </p>
                      </div>


                      <div className="mt-5 rounded-2xl border border-[#e0e5e9] bg-white p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#e31b2d]" />

                          <p className="text-[9px] leading-5 text-[#6d7984]">
                            This form saves only the address information you enter. It does not use automatic geolocation.
                          </p>
                        </div>
                      </div>


                      <div className="mt-6 grid gap-3">
                        <button
                          type="submit"
                          disabled={
                            saving
                          }
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e31b2d] px-5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[0_12px_26px_rgba(227,27,45,0.18)] transition hover:bg-[#f1263a] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          <Check className="h-4 w-4" />

                          {saving
                            ? "Saving..."
                            : editingId
                              ? "Save changes"
                              : "Save address"}
                        </button>

                        <button
                          type="button"
                          onClick={
                            resetForm
                          }
                          className="h-11 w-full rounded-xl border border-[#d8dee3] bg-white px-5 text-[9px] font-black uppercase tracking-[0.08em] text-[#5c6873] transition hover:bg-[#f4f6f8]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.form>
            )}


            {/* ==================================================
                DEFAULT ADDRESS SPOTLIGHT
            ================================================== */}

            {!loading &&
              defaultAddress && (
                <motion.section
                  variants={
                    reveal
                  }
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: 0.55,
                  }}
                  className="relative overflow-hidden rounded-[28px] border border-[#dfe4e8] bg-white shadow-[0_20px_60px_rgba(21,35,48,0.06)]"
                >
                  <div className="grid lg:grid-cols-[1fr_310px]">
                    <div className="p-7 sm:p-9">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-[#087443]">
                          <CheckCircle2 className="h-3.5 w-3.5" />

                          Default delivery location
                        </div>

                        <span className="text-[9px] text-[#8a96a2]">
                          Used as your preferred saved address
                        </span>
                      </div>


                      <div className="mt-7 flex items-start gap-5">
                        <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#071b2d] text-white sm:flex">
                          <Navigation className="h-6 w-6" />
                        </div>

                        <div>
                          <h3 className="text-[28px] font-black tracking-[-0.04em]">
                            {defaultAddress.label}
                          </h3>

                          <p className="mt-2 text-[13px] font-bold text-[#3b4854]">
                            {defaultAddress.recipient_name}
                          </p>

                          <div className="mt-5 space-y-1 text-[11px] leading-6 text-[#6f7c87]">
                            <p>
                              {defaultAddress.address_line1}
                            </p>

                            {defaultAddress.address_line2 && (
                              <p>
                                {defaultAddress.address_line2}
                              </p>
                            )}

                            <p>
                              {[
                                defaultAddress.city,
                                defaultAddress.region,
                                defaultAddress.country,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ", ",
                                )}
                            </p>

                            {defaultAddress.postal_code && (
                              <p>
                                {defaultAddress.postal_code}
                              </p>
                            )}

                            <p className="pt-2 font-semibold text-[#36434f]">
                              {defaultAddress.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>


                    <div className="flex flex-col justify-between border-t border-[#edf0f2] bg-[#071b2d] p-7 text-white lg:border-l lg:border-t-0">
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#8298aa]">
                          Primary profile
                        </div>

                        <p className="mt-4 text-[11px] leading-6 text-[#a8b7c4]">
                          This saved address currently has default status in your account.
                        </p>
                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            defaultAddress,
                          )
                        }
                        className="mt-8 inline-flex h-11 items-center justify-between rounded-xl border border-white/[0.09] bg-white/[0.05] px-4 text-[9px] font-black uppercase tracking-[0.1em] transition hover:bg-white/[0.09]"
                      >
                        Edit default address

                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}


            {/* ==================================================
                ADDRESS COLLECTION
            ================================================== */}

            <section>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#e31b2d]">
                    Delivery locations
                  </div>

                  <h2 className="mt-2 text-[28px] font-black tracking-[-0.04em]">
                    Saved addresses
                  </h2>
                </div>

                {!loading &&
                  addresses.length > 0 && (
                    <div className="hidden rounded-full border border-[#dde3e7] bg-white px-4 py-2 text-[9px] font-bold text-[#6f7c87] sm:block">
                      {addresses.length}{" "}
                      {addresses.length === 1
                        ? "address"
                        : "addresses"}
                    </div>
                  )}
              </div>


              {loading ? (
                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  {[0, 1].map(
                    (
                      item,
                    ) => (
                      <div
                        key={
                          item
                        }
                        className="h-[330px] animate-pulse rounded-[24px] border border-[#e3e7eb] bg-white"
                      />
                    ),
                  )}
                </div>
              ) : addresses.length ===
                0 ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 16,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-6 flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-[#ccd4db] bg-white px-6 text-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 scale-[2.1] rounded-full bg-[#e31b2d]/10 blur-2xl" />

                    <div className="relative flex h-[82px] w-[82px] items-center justify-center rounded-[24px] bg-[#071b2d] text-white shadow-[0_18px_45px_rgba(7,27,45,0.16)]">
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>


                  <div className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] text-[#e31b2d]">
                    Address book empty
                  </div>

                  <h3 className="mt-3 text-[28px] font-black tracking-[-0.04em]">
                    Create your delivery profile.
                  </h3>

                  <p className="mt-4 max-w-[480px] text-[11px] leading-6 text-[#71808c]">
                    Save a delivery address so you can select stored delivery information during checkout.
                  </p>


                  <button
                    type="button"
                    onClick={
                      openNewAddress
                    }
                    className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e31b2d] px-6 text-[10px] font-black uppercase tracking-[0.09em] text-white shadow-[0_12px_30px_rgba(227,27,45,0.18)]"
                  >
                    <Plus className="h-4 w-4" />

                    Add your first address
                  </button>
                </motion.div>
              ) : (
                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  {addresses.map(
                    (
                      address,
                      index,
                    ) => (
                      <motion.article
                        key={
                          address.id
                        }
                        initial={{
                          opacity: 0,
                          y: 18,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            Math.min(
                              index * 0.05,
                              0.3,
                            ),
                        }}
                        whileHover={{
                          y: -4,
                        }}
                        className={`group relative overflow-hidden rounded-[24px] border bg-white shadow-[0_18px_50px_rgba(22,34,47,0.05)] transition ${
                          address.is_default
                            ? "border-[#efb6bc]"
                            : "border-[#e1e6ea]"
                        }`}
                      >
                        {address.is_default && (
                          <div className="h-1 w-full bg-[#e31b2d]" />
                        )}


                        <div className="p-6 sm:p-7">
                          <div className="flex items-start justify-between gap-5">
                            <div className="flex min-w-0 items-center gap-4">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                  address.is_default
                                    ? "bg-[#e31b2d] text-white shadow-[0_10px_26px_rgba(227,27,45,0.2)]"
                                    : "bg-[#f1f4f6] text-[#62707c]"
                                }`}
                              >
                                {address.is_default
                                  ? (
                                    <Navigation className="h-5 w-5" />
                                  )
                                  : (
                                    <Home className="h-5 w-5" />
                                  )}
                              </div>


                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-[17px] font-black tracking-[-0.025em]">
                                    {address.label}
                                  </h3>

                                  {address.is_default && (
                                    <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.1em] text-[#087443]">
                                      Default
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 truncate text-[10px] font-semibold text-[#75818c]">
                                  {address.recipient_name}
                                </p>
                              </div>
                            </div>


                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    address,
                                  )
                                }
                                aria-label={`Edit ${address.label} address`}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#64727e] transition hover:bg-[#f0f3f5] hover:text-[#17232e]"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void removeAddress(
                                    address,
                                  )
                                }
                                aria-label={`Delete ${address.label} address`}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#b4232f] transition hover:bg-[#fff0f1]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>


                          <div className="mt-7 rounded-2xl bg-[#f7f9fa] p-5">
                            <div className="space-y-1 text-[10px] leading-5 text-[#667480]">
                              <p className="font-semibold text-[#35424e]">
                                {address.address_line1}
                              </p>

                              {address.address_line2 && (
                                <p>
                                  {address.address_line2}
                                </p>
                              )}

                              <p>
                                {[
                                  address.city,
                                  address.region,
                                  address.country,
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    ", ",
                                  )}
                              </p>

                              {address.postal_code && (
                                <p>
                                  {address.postal_code}
                                </p>
                              )}
                            </div>


                            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#e4e8eb] pt-4">
                              <span className="text-[9px] font-semibold text-[#5f6c77]">
                                {address.phone}
                              </span>

                              <MapPin className="h-4 w-4 text-[#a1abb4]" />
                            </div>
                          </div>


                          <div className="mt-6 flex min-h-10 items-center justify-between gap-4">
                            {address.is_default ? (
                              <div className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.13em] text-[#087443]">
                                <CheckCircle2 className="h-4 w-4" />

                                Preferred address
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  void makeDefault(
                                    address.id,
                                  )
                                }
                                className="group/default inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.13em] text-[#e31b2d]"
                              >
                                <Star className="h-4 w-4 transition-transform group-hover/default:rotate-12" />

                                Set as default
                              </button>
                            )}


                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  address,
                                )
                              }
                              className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.12em] text-[#53616d] transition hover:text-[#111d28]"
                            >
                              Manage

                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    ),
                  )}
                </div>
              )}
            </section>


            {/* ==================================================
                INFORMATION STRIP
            ================================================== */}

            <section className="grid gap-5 md:grid-cols-3">
              <InfoCard
                icon={
                  ShieldCheck
                }
                title="Account based"
                description="Only addresses returned by your saved-address account data are displayed here."
              />

              <InfoCard
                icon={
                  Navigation
                }
                title="One default"
                description="Choose the stored location you want marked as your default delivery address."
              />

              <InfoCard
                icon={
                  ShoppingBag
                }
                title="Checkout ready"
                description="Keep saved delivery details organized for use throughout your customer journey."
              />
            </section>


            {/* ==================================================
                FINAL CTA
            ================================================== */}

            <section className="relative overflow-hidden rounded-[30px] bg-[#071b2d] px-7 py-10 text-white sm:px-10 sm:py-12">
              <div className="pointer-events-none absolute right-[-80px] top-[-120px] h-[320px] w-[320px] rounded-full bg-[#e31b2d]/20 blur-[90px]" />

              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.22em] text-[#ff5967]">
                    <Sparkles className="h-4 w-4" />

                    Delivery profile
                  </div>

                  <h3 className="mt-4 max-w-[650px] text-[32px] font-black leading-[1.02] tracking-[-0.045em] sm:text-[40px]">
                    Your delivery details,
                    <span className="text-[#ff394a]">
                      {" "}
                      under control.
                    </span>
                  </h3>

                  <p className="mt-4 max-w-[620px] text-[11px] leading-6 text-[#9eb0bf]">
                    Add, update, remove, or switch your default saved address whenever your delivery profile changes.
                  </p>
                </div>


                <div className="flex shrink-0 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      openNewAddress
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e31b2d] px-6 text-[9px] font-black uppercase tracking-[0.1em]"
                  >
                    <Plus className="h-4 w-4" />

                    Add address
                  </button>

                  <Link
                    href="/shop"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-6 text-[9px] font-black uppercase tracking-[0.1em] transition hover:bg-white/[0.09]"
                  >
                    Browse parts

                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}


/* ============================================================
   ADDRESS INPUT
============================================================ */

function AddressInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange:
    (
      value: string,
    ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[9px] font-black uppercase tracking-[0.08em] text-[#53616c]">
        {label}
      </span>

      <input
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className="h-12 w-full rounded-xl border border-[#d7dde2] bg-[#fbfcfd] px-4 text-[11px] text-[#17232e] outline-none transition placeholder:text-[#a4adb5] hover:border-[#c7cfd6] focus:border-[#e31b2d] focus:bg-white focus:ring-4 focus:ring-[#e31b2d]/[0.06]"
      />
    </label>
  );
}


/* ============================================================
   NAVBAR LINK
============================================================ */



/* ============================================================
   PROFILE LINK
============================================================ */

function ProfileLink({
  href,
  icon:
    Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={
        href
      }
      className="group my-1 flex min-h-12 items-center gap-3 rounded-xl px-4 text-[10px] font-semibold text-[#596773] transition hover:bg-[#f5f7f9] hover:text-[#17232e]"
    >
      <Icon className="h-4 w-4 text-[#7b8792] transition group-hover:text-[#e31b2d]" />

      {label}
    </Link>
  );
}


/* ============================================================
   METRIC STRIP
============================================================ */

function MetricStrip({
  icon:
    Icon,
  value,
  label,
  detail,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[132px] items-center gap-5 px-2 py-6 md:px-7">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3f5f7] text-[#e31b2d]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <div className="text-[20px] font-black tracking-[-0.035em] text-[#101828]">
          {value}
        </div>

        <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#44515c]">
          {label}
        </div>

        <div className="mt-1 truncate text-[8px] text-[#89949e]">
          {detail}
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   INFO CARD
============================================================ */

function InfoCard({
  icon:
    Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="rounded-[22px] border border-[#e1e6ea] bg-white p-6 shadow-[0_14px_40px_rgba(20,34,47,0.04)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f2] text-[#e31b2d]">
        <Icon className="h-4 w-4" />
      </div>

      <h3 className="mt-5 text-[13px] font-black tracking-[-0.02em]">
        {title}
      </h3>

      <p className="mt-2 text-[9px] leading-5 text-[#77848f]">
        {description}
      </p>
    </motion.div>
  );
}
