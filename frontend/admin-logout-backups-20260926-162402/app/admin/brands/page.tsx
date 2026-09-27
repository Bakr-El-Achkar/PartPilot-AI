"use client";

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
  ExternalLink,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Search,
  Shapes,
  ShoppingBag,
  Star,
  Tags,
  Users,
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
  createAdminBrand,
  getAdminBrands,
  getAdminProducts,
  updateAdminBrand,
} from "@/lib/admin";

import type {
  Brand,
  Product,
} from "@/lib/products";


type StatusFilter =
  | "all"
  | "active"
  | "inactive";


type BrandForm = {
  name: string;
  description: string;
  country: string;
  website: string;
  logoUrl: string;
  isActive: boolean;
};


const EMPTY_FORM: BrandForm = {
  name: "",
  description: "",
  country: "",
  website: "",
  logoUrl: "",
  isActive: true,
};


export default function AdminBrandsPage() {
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
    brands,
    setBrands,
  ] =
    useState<Brand[]>(
      [],
    );

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      [],
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
      "all",
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
    formError,
    setFormError,
  ] =
    useState(
      "",
    );

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(
      false,
    );

  const [
    editing,
    setEditing,
  ] =
    useState<Brand | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<BrandForm>(
      EMPTY_FORM,
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
        const currentUser =
          await getCurrentUser(
            accessToken,
          );


        if (
          currentUser.role !==
          "admin"
        ) {
          router.replace(
            "/",
          );

          return;
        }


        const [
          brandResult,
          productResult,
        ] =
          await Promise.all(
            [
              getAdminBrands(
                accessToken,
              ),

              getAdminProducts(
                accessToken,
              ),
            ],
          );


        if (cancelled) {
          return;
        }


        setUser(
          currentUser,
        );

        setBrands(
          brandResult,
        );

        setProducts(
          productResult,
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


        if (!cancelled) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load brands.",
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


    void load();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


  const productCounts =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();


        products.forEach(
          (
            product,
          ) => {
            counts.set(
              product.brand_id,
              (
                counts.get(
                  product.brand_id,
                ) ??
                0
              ) +
                1,
            );
          },
        );


        return counts;
      },
      [
        products,
      ],
    );


  const visible =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLowerCase();


        return brands.filter(
          (
            brand,
          ) => {
            if (
              status ===
                "active" &&
              !brand.is_active
            ) {
              return false;
            }


            if (
              status ===
                "inactive" &&
              brand.is_active
            ) {
              return false;
            }


            if (!needle) {
              return true;
            }


            return [
              brand.name,
              brand.slug,
              brand.country ??
                "",
            ].some(
              (
                value,
              ) =>
                value
                  .toLowerCase()
                  .includes(
                    needle,
                  ),
            );
          },
        );
      },
      [
        brands,
        search,
        status,
      ],
    );


  const activeCount =
    brands.filter(
      (
        brand,
      ) =>
        brand.is_active,
    ).length;


  function openCreate() {
    setEditing(
      null,
    );

    setForm(
      EMPTY_FORM,
    );

    setFormError(
      "",
    );

    setEditorOpen(
      true,
    );
  }


  function openEdit(
    brand: Brand,
  ) {
    setEditing(
      brand,
    );

    setForm(
      {
        name:
          brand.name,

        description:
          brand.description ??
          "",

        country:
          brand.country ??
          "",

        website:
          brand.website ??
          "",

        logoUrl:
          brand.logo_url ??
          "",

        isActive:
          brand.is_active,
      },
    );

    setFormError(
      "",
    );

    setEditorOpen(
      true,
    );
  }


  async function save() {
    const token =
      getAccessToken();


    if (!token) {
      router.replace(
        "/login",
      );

      return;
    }


    if (
      form.name.trim().length <
      2
    ) {
      setFormError(
        "Brand name must contain at least 2 characters.",
      );

      return;
    }


    setSaving(
      true,
    );

    setFormError(
      "",
    );


    try {
      let saved:
        Brand;


      if (editing) {
        saved =
          await updateAdminBrand(
            token,
            editing.id,
            {
              name:
                form.name.trim(),

              description:
                form.description.trim() ||
                null,

              country:
                form.country.trim() ||
                null,

              website:
                form.website.trim() ||
                null,

              logo_url:
                form.logoUrl.trim() ||
                null,

              is_active:
                form.isActive,
            },
          );


        setBrands(
          (
            current,
          ) =>
            current.map(
              (
                brand,
              ) =>
                brand.id ===
                saved.id
                  ? saved
                  : brand,
            ),
        );

      } else {
        saved =
          await createAdminBrand(
            token,
            {
              name:
                form.name.trim(),

              description:
                form.description.trim() ||
                null,

              country:
                form.country.trim() ||
                null,

              website:
                form.website.trim() ||
                null,

              logo_url:
                form.logoUrl.trim() ||
                null,
            },
          );


        setBrands(
          (
            current,
          ) => [
            ...current,
            saved,
          ],
        );
      }


      setEditorOpen(
        false,
      );

      setEditing(
        null,
      );

    } catch (
      saveError
    ) {
      setFormError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save brand.",
      );

    } finally {
      setSaving(
        false,
      );
    }
  }


  async function toggle(
    brand: Brand,
  ) {
    const token =
      getAccessToken();


    if (!token) {
      return;
    }


    const count =
      productCounts.get(
        brand.id,
      ) ??
      0;


    if (
      brand.is_active
    ) {
      const confirmed =
        window.confirm(
          `Deactivate ${brand.name}? ${count} product(s) currently reference this brand. Existing products will not be automatically deactivated.`,
        );


      if (!confirmed) {
        return;
      }
    }


    try {
      const updated =
        await updateAdminBrand(
          token,
          brand.id,
          {
            is_active:
              !brand.is_active,
          },
        );


      setBrands(
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

    } catch (
      toggleError
    ) {
      setError(
        toggleError instanceof
          Error
          ? toggleError.message
          : "Unable to update brand.",
      );
    }
  }


  const adminName =
    user
      ? `${user.first_name} ${user.last_name}`.trim()
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
              className="flex items-center gap-2 rounded-[7px] border border-[#d0d5dd] px-4 py-2 text-[9px] font-semibold"
            >
              <ExternalLink className="h-3.5 w-3.5" />

              Store
            </Link>
          </header>


          <div className="mx-auto max-w-[1400px] p-5 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-[28px] font-bold tracking-[-0.035em]">
                  Brands
                </h1>

                <p className="mt-2 text-[11px] text-[#667085]">
                  Manage automotive brands used throughout the marketplace catalog.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  openCreate
                }
                className="flex h-10 items-center justify-center gap-2 rounded-[7px] bg-[#e31b2d] px-4 text-[9px] font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />

                Add brand
              </button>
            </div>


            <section className="mt-7 grid gap-4 sm:grid-cols-3">
              <Metric label="Total brands" value={brands.length} />
              <Metric label="Active" value={activeCount} />
              <Metric label="Inactive" value={brands.length - activeCount} />
            </section>


            {error && (
              <div className="mt-5 rounded-[8px] border border-[#fecdca] bg-[#fff4f5] px-4 py-3 text-[10px] text-[#b42318]">
                {
                  error
                }
              </div>
            )}


            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="relative w-full max-w-[340px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />

                <input
                  value={
                    search
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setSearch(
                        event.target.value,
                      )
                  }
                  placeholder="Search brands..."
                  className="h-10 w-full rounded-[7px] border border-[#d0d5dd] bg-white pl-9 pr-3 text-[10px] outline-none"
                />
              </div>


              <select
                value={
                  status
                }
                onChange={
                  (
                    event,
                  ) =>
                    setStatus(
                      event.target.value as
                        StatusFilter,
                    )
                }
                className="h-10 rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px]"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>


            <div className="mt-4 overflow-hidden rounded-[14px] border border-[#dfe3e8] bg-white">
              {loading ? (
                <div className="p-6 text-[10px] text-[#667085]">
                  Loading brands...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="border-b border-[#eaecf0] bg-[#fafbfc]">
                      <tr>
                        <Heading>Brand</Heading>
                        <Heading>Country</Heading>
                        <Heading>Products</Heading>
                        <Heading>Status</Heading>
                        <Heading>Actions</Heading>
                      </tr>
                    </thead>


                    <tbody>
                      {visible.map(
                        (
                          brand,
                        ) => (
                          <tr
                            key={
                              brand.id
                            }
                            className="border-b border-[#eaecf0] last:border-0"
                          >
                            <Cell>
                              <p className="font-semibold text-[#101828]">
                                {
                                  brand.name
                                }
                              </p>

                              <p className="mt-1 text-[8px] text-[#98a2b3]">
                                {
                                  brand.slug
                                }
                              </p>
                            </Cell>


                            <Cell>
                              {
                                brand.country ??
                                "—"
                              }
                            </Cell>


                            <Cell>
                              <span className="font-semibold text-[#344054]">
                                {
                                  productCounts.get(
                                    brand.id,
                                  ) ??
                                  0
                                }
                              </span>
                            </Cell>


                            <Cell>
                              <StatusBadge
                                active={
                                  brand.is_active
                                }
                              />
                            </Cell>


                            <Cell>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      brand,
                                    )
                                  }
                                  className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#d0d5dd] px-2.5 text-[8px] font-semibold"
                                >
                                  <Pencil className="h-3 w-3" />

                                  Edit
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    void toggle(
                                      brand,
                                    )
                                  }
                                  className={
                                    brand.is_active
                                      ? "h-8 rounded-[6px] border border-[#fecdca] px-2.5 text-[8px] font-semibold text-[#b42318]"
                                      : "h-8 rounded-[6px] border border-[#abefc6] px-2.5 text-[8px] font-semibold text-[#067647]"
                                  }
                                >
                                  {
                                    brand.is_active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                </button>
                              </div>
                            </Cell>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>


      {editorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              !saving &&
              setEditorOpen(
                false,
              )
            }
            className="absolute inset-0"
          />


          <aside className="relative z-10 h-full w-full max-w-[560px] overflow-y-auto bg-white">
            <div className="flex items-center justify-between border-b border-[#eaecf0] p-6">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
                  Catalog
                </p>

                <h2 className="mt-1 text-[20px] font-bold">
                  {
                    editing
                      ? "Edit brand"
                      : "Add brand"
                  }
                </h2>
              </div>


              <button
                type="button"
                onClick={() =>
                  setEditorOpen(
                    false,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-[#eaecf0]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>


            <div className="space-y-5 p-6">
              {formError && (
                <div className="rounded-[7px] border border-[#fecdca] bg-[#fff4f5] p-3 text-[9px] text-[#b42318]">
                  {
                    formError
                  }
                </div>
              )}


              <Field label="Brand name">
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>


              <Field label="Country">
                <input
                  value={form.country}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>


              <Field label="Description">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={`${inputClass} h-auto py-3`}
                />
              </Field>


              <Field label="Website">
                <input
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>


              <Field label="Logo URL">
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      logoUrl: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>


              {editing && (
                <label className="flex h-11 items-center gap-3 rounded-[7px] border border-[#d0d5dd] px-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive:
                          event.target.checked,
                      }))
                    }
                  />

                  <span className="text-[10px] font-medium">
                    Active brand
                  </span>
                </label>
              )}
            </div>


            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#eaecf0] bg-white p-5">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setEditorOpen(
                    false,
                  )
                }
                className="h-10 rounded-[7px] border border-[#d0d5dd] px-4 text-[9px] font-semibold"
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void save()
                }
                className="h-10 rounded-[7px] bg-[#e31b2d] px-5 text-[9px] font-semibold text-white disabled:opacity-50"
              >
                {
                  saving
                    ? "Saving..."
                    : "Save brand"
                }
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}


function AdminSidebar() {
  return (
    <aside className="hidden w-[230px] shrink-0 bg-[#071523] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/admin" className="flex items-center gap-3">
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
        <Nav href="/admin/brands" icon={Tags} label="Brands" active />
        <Nav href="/admin/fitments"
icon={CarFront} label="Fitments" />
        <Nav href="/admin/orders" icon={ShoppingBag} label="Orders" />
        <Nav href="/admin/users"
icon={Users} label="Users" />
        <Nav href="/admin/reviews" icon={Star} label="Reviews" />
        <Nav href="/admin/ai-sessions" icon={Bot} label="AI Sessions" />
        <Nav href="/admin/notifications" icon={Bell} label="Notifications" />
      </nav>
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
      {label}
    </>
  );


  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>
      {content}
    </div>
  );
}


function Metric({
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
        {label}
      </p>

      <p className="mt-2 text-[23px] font-bold">
        {value}
      </p>
    </div>
  );
}


function Heading({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-[8px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">
      {children}
    </th>
  );
}


function Cell({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <td className="px-5 py-4 text-[9px] text-[#475467]">
      {children}
    </td>
  );
}


function StatusBadge({
  active,
}: {
  active:
    boolean;
}) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-[#abefc6] bg-[#ecfdf3] px-2.5 py-1 text-[8px] font-semibold text-[#067647]"
          : "rounded-full border border-[#d0d5dd] bg-[#f2f4f7] px-2.5 py-1 text-[8px] font-semibold text-[#667085]"
      }
    >
      {
        active
          ? "Active"
          : "Inactive"
      }
    </span>
  );
}


function Field({
  label,
  children,
}: {
  label:
    string;

  children:
    ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-semibold text-[#344054]">
        {label}
      </span>

      {children}
    </label>
  );
}


const inputClass =
  "h-10 w-full rounded-[7px] border border-[#d0d5dd] bg-white px-3 text-[10px] outline-none";
