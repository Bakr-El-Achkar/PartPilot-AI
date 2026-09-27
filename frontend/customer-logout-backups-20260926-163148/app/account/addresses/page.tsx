"use client";

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
  ArrowLeft,
  Check,
  Edit3,
  Heart,
  Home,
  MapPin,
  Package,
  Plus,
  Star,
  Trash2,
  UserRound,
  X,
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


const EMPTY_FORM:
  AddressFormState = {
    label:
      "Home",

    recipient_name:
      "",

    phone:
      "",

    address_line1:
      "",

    address_line2:
      "",

    city:
      "",

    region:
      "",

    country:
      "Lebanon",

    postal_code:
      "",
  };


export default function SavedAddressesPage() {
  const router =
    useRouter();


  const [
    user,
    setUser,
  ] =
    useState<UserPublic | null>(
      null,
    );


  const [
    addresses,
    setAddresses,
  ] =
    useState<Address[]>(
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
    saving,
    setSaving,
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
    success,
    setSuccess,
  ] =
    useState(
      "",
    );


  const [
    formOpen,
    setFormOpen,
  ] =
    useState(
      false,
    );


  const [
    editingId,
    setEditingId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    form,
    setForm,
  ] =
    useState<AddressFormState>(
      EMPTY_FORM,
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


        if (
          cancelled
        ) {
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


        if (
          !cancelled
        ) {
          setError(
            loadError instanceof
              ApiError
              ? loadError.message
              : "Unable to load saved addresses.",
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


    void loadPage();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


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


      if (
        editingId
      ) {
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
        saveError instanceof
          ApiError
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
        defaultError instanceof
          ApiError
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
        deleteError instanceof
          ApiError
          ? deleteError.message
          : "Unable to delete address.",
      );
    }
  }


  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#101828]">
      <header className="border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto flex h-[70px] max-w-[1320px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#ef3d43] text-[18px] font-black italic text-white">
              V
            </div>


            <span className="text-[15px] font-bold">
              Vehnexa
            </span>
          </Link>


          <nav className="ml-8 hidden h-full items-center gap-8 lg:flex">
            <Link
              href="/"
              className="text-[10px] text-[#667085]"
            >
              Home
            </Link>


            <Link
              href="/shop"
              className="text-[10px] text-[#667085]"
            >
              Shop
            </Link>


            <Link
              href="/account/garage"
              className="text-[10px] text-[#667085]"
            >
              My Garage
            </Link>


            <Link
              href="/ai-mechanic"
              className="text-[10px] text-[#667085]"
            >
              AI Mechanic
            </Link>


            <Link
              href="/orders"
              className="text-[10px] text-[#667085]"
            >
              Orders
            </Link>
          </nav>


          <NavbarNotificationBell />

          <Link
            href="/account"
            aria-label="Account"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#071523] text-white"
          >
            <UserRound className="h-4 w-4" />
          </Link>
        </div>
      </header>


      <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#667085]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />

          Back to orders
        </Link>


        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[31px] font-bold tracking-[-0.035em]">
              Saved addresses
            </h1>


            <p className="mt-1.5 text-[12px] text-[#667085]">
              Save delivery addresses and choose the default address used at checkout.
            </p>
          </div>


          <button
            type="button"
            onClick={
              openNewAddress
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] bg-[#ef3d43] px-5 text-[10px] font-semibold text-white"
          >
            <Plus className="h-4 w-4" />

            Add address
          </button>
        </div>


        {error && (
          <div className="mt-5 rounded-[8px] border border-[#f1c7cc] bg-[#fff4f5] px-4 py-3 text-[10px] text-[#b4232f]">
            {
              error
            }
          </div>
        )}


        {success && (
          <div className="mt-5 rounded-[8px] border border-[#b7e4c7] bg-[#ecfdf3] px-4 py-3 text-[10px] text-[#087443]">
            {
              success
            }
          </div>
        )}


        <div className="mt-8 grid gap-7 lg:grid-cols-[235px_1fr]">
          {/* PROFILE */}

          <aside className="min-h-[535px] rounded-[16px] border border-[#dfe3e8] bg-white p-5">
            <div className="flex flex-col items-center py-2 text-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#071523] text-[17px] font-bold text-white">
                {
                  initials
                }
              </div>


              <h2 className="mt-4 text-[14px] font-bold">
                {
                  displayName
                }
              </h2>


              <p className="mt-1 text-[9px] text-[#667085]">
                Customer account
              </p>
            </div>


            <div className="mt-7 space-y-2">
              <ProfileLink
                href="/orders"
                icon={
                  Package
                }
                label="Orders"
              />


              <ProfileLink
                href="/account"
                icon={
                  UserRound
                }
                label="Account details"
              />


              <div className="flex h-11 items-center gap-3 rounded-[7px] bg-[#fff0f1] px-4 text-[10px] font-semibold text-[#e31b2d]">
                <MapPin className="h-4 w-4" />

                Saved addresses
              </div>


              <ProfileLink
                href="/account/wishlist"
                icon={
                  Heart
                }
                label="Wishlist"
              />
            </div>
          </aside>


          {/* CONTENT */}

          <section>
            {formOpen && (
              <form
                onSubmit={
                  submitAddress
                }
                className="mb-6 rounded-[16px] border border-[#dfe3e8] bg-white p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[16px] font-bold">
                      {editingId
                        ? "Edit address"
                        : "Add address"}
                    </h2>


                    <p className="mt-1 text-[9px] text-[#667085]">
                      Enter the delivery information exactly as it should appear on the order.
                    </p>
                  </div>


                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>


                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <AddressInput
                    label="Label"
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
                    placeholder="Tripoli"
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
                    placeholder="North Lebanon"
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


                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    className="h-10 rounded-[7px] border border-[#d0d5dd] px-5 text-[10px] font-semibold text-[#475467]"
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-[7px] bg-[#ef3d43] px-5 text-[10px] font-semibold text-white disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />

                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save changes"
                        : "Save address"}
                  </button>
                </div>
              </form>
            )}


            <h2 className="text-[16px] font-bold">
              Delivery addresses
            </h2>


            {loading ? (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="h-[210px] animate-pulse rounded-[16px] bg-white" />

                <div className="h-[210px] animate-pulse rounded-[16px] bg-white" />
              </div>
            ) : addresses.length ===
              0 ? (
              <div className="mt-5 flex min-h-[300px] flex-col items-center justify-center rounded-[16px] border border-[#dfe3e8] bg-white text-center">
                <MapPin className="h-9 w-9 text-[#b8c0ca]" />


                <h3 className="mt-4 text-[14px] font-bold">
                  No saved addresses
                </h3>


                <p className="mt-2 max-w-[320px] text-[10px] leading-5 text-[#667085]">
                  Add a delivery address so checkout can be completed faster.
                </p>


                <button
                  type="button"
                  onClick={
                    openNewAddress
                  }
                  className="mt-5 rounded-[7px] bg-[#ef3d43] px-5 py-2.5 text-[10px] font-semibold text-white"
                >
                  Add your first address
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {addresses.map(
                  (
                    address,
                  ) => (
                    <article
                      key={
                        address.id
                      }
                      className="rounded-[16px] border border-[#dfe3e8] bg-white p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#f2f4f7] text-[#667085]">
                            <Home className="h-4 w-4" />
                          </div>


                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-[12px] font-bold">
                                {
                                  address.label
                                }
                              </h3>


                              {address.is_default && (
                                <span className="rounded-full bg-[#ecfdf3] px-2 py-1 text-[7px] font-semibold text-[#087443]">
                                  Default
                                </span>
                              )}
                            </div>


                            <p className="mt-1 text-[9px] text-[#667085]">
                              {
                                address.recipient_name
                              }
                            </p>
                          </div>
                        </div>


                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                address,
                              )
                            }
                            aria-label="Edit address"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              void removeAddress(
                                address,
                              )
                            }
                            aria-label="Delete address"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#b42318] hover:bg-[#fff1f1]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>


                      <div className="mt-5 space-y-1.5 text-[9px] leading-5 text-[#667085]">
                        <p>
                          {
                            address.address_line1
                          }
                        </p>


                        {address.address_line2 && (
                          <p>
                            {
                              address.address_line2
                            }
                          </p>
                        )}


                        <p>
                          {
                            [
                              address.city,
                              address.region,
                              address.country,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                ", ",
                              )
                          }
                        </p>


                        {address.postal_code && (
                          <p>
                            {
                              address.postal_code
                            }
                          </p>
                        )}


                        <p className="pt-1">
                          {
                            address.phone
                          }
                        </p>
                      </div>


                      {!address.is_default && (
                        <button
                          type="button"
                          onClick={() =>
                            void makeDefault(
                              address.id,
                            )
                          }
                          className="mt-5 inline-flex items-center gap-2 text-[9px] font-semibold text-[#e31b2d]"
                        >
                          <Star className="h-3.5 w-3.5" />

                          Set as default
                        </button>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}


function AddressInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label:
    string;

  value:
    string;

  placeholder:
    string;

  onChange:
    (
      value:
        string,
    ) =>
      void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-semibold text-[#344054]">
        {
          label
        }
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
        className="h-11 w-full rounded-[7px] border border-[#d0d5dd] bg-white px-3.5 text-[10px] outline-none transition focus:border-[#ef3d43]"
      />
    </label>
  );
}


function ProfileLink({
  href,
  icon:
    Icon,
  label,
}: {
  href:
    string;

  icon:
    typeof Package;

  label:
    string;
}) {
  return (
    <Link
      href={
        href
      }
      className="flex h-11 items-center gap-3 rounded-[7px] px-4 text-[10px] font-medium text-[#475467] transition hover:bg-[#f8f9fb]"
    >
      <Icon className="h-4 w-4" />

      {
        label
      }
    </Link>
  );
}
