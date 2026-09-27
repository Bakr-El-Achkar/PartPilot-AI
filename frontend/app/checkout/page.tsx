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
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  getAccessToken,
  removeAccessToken,
} from "@/lib/auth";

import {
  ApiError,
} from "@/lib/api";

import {
  createOrder,
  type CreateOrderPayload,
} from "@/lib/orders";

import {
  clearOrderAttemptKey,
  getOrderAttemptKey,
} from "@/lib/order-attempt";

import {
  getVehicles,
  type Vehicle,
} from "@/lib/vehicles";

import {
  getCompatibleProducts,
} from "@/lib/products";

import {
  CART_UPDATED_EVENT,
  clearCart,
  getCartCount,
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";

import {
  getAddresses,
  type Address,
} from "@/lib/addresses";


const DELIVERY_FEE =
  5;

const DISCOUNT =
  0;


/* ============================================================
   ADDRESS FORMAT
============================================================ */

function formatSavedAddress(
  address: Address,
): string {
  const location = [
    address.city,
    address.region,
    address.country,
    address.postal_code,
  ]
    .filter(
      (
        value,
      ): value is string =>
        Boolean(
          value?.trim(),
        ),
    )
    .join(
      ", ",
    );


  return [
    address.recipient_name,
    address.phone,
    address.address_line1,
    address.address_line2,
    location,
  ]
    .filter(
      (
        value,
      ): value is string =>
        Boolean(
          value?.trim(),
        ),
    )
    .join(
      "\n",
    );
}


/* ============================================================
   PAGE
============================================================ */

export default function CheckoutPage() {
  const router =
    useRouter();


  const [
    items,
    setItems,
  ] =
    useState<CartItem[]>(
      [],
    );


  const [
    cartCount,
    setCartCount,
  ] =
    useState(
      0,
    );


  const [
    activeVehicle,
    setActiveVehicle,
  ] =
    useState<Vehicle | null>(
      null,
    );


  const [
    compatibleIds,
    setCompatibleIds,
  ] =
    useState<Set<string>>(
      new Set(),
    );


  const [
    loadingGarage,
    setLoadingGarage,
  ] =
    useState(
      true,
    );


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    shippingAddress,
    setShippingAddress,
  ] =
    useState(
      "",
    );


  const [
    savedAddresses,
    setSavedAddresses,
  ] =
    useState<Address[]>(
      [],
    );


  const [
    selectedAddressId,
    setSelectedAddressId,
  ] =
    useState(
      "__custom__",
    );


  const [
    loadingAddresses,
    setLoadingAddresses,
  ] =
    useState(
      true,
    );


  const [
    checkoutMessage,
    setCheckoutMessage,
  ] =
    useState(
      "",
    );


  const [
    placingOrder,
    setPlacingOrder,
  ] =
    useState(
      false,
    );


  /* ==========================================================
     SAVED ADDRESSES
  ========================================================== */

  useEffect(() => {
    const token =
      getAccessToken();


    if (!token) {
      return;
    }


    const accessToken =
      token;

    let cancelled =
      false;


    async function loadSavedAddresses() {
      try {
        const addresses =
          await getAddresses(
            accessToken,
          );


        if (cancelled) {
          return;
        }


        setSavedAddresses(
          addresses,
        );


        const preferred =
          addresses.find(
            (
              address,
            ) =>
              address.is_default,
          ) ??
          addresses[0] ??
          null;


        if (preferred) {
          setSelectedAddressId(
            preferred.id,
          );

          setShippingAddress(
            formatSavedAddress(
              preferred,
            ),
          );
        } else {
          setSelectedAddressId(
            "__custom__",
          );
        }
      } catch {
        if (!cancelled) {
          setSavedAddresses(
            [],
          );

          setSelectedAddressId(
            "__custom__",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAddresses(
            false,
          );
        }
      }
    }


    void loadSavedAddresses();


    return () => {
      cancelled =
        true;
    };
  }, []);


  /* ==========================================================
     AUTH + GARAGE
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


    async function loadGarage() {
      try {
        const vehicles =
          await getVehicles(
            accessToken,
          );


        if (cancelled) {
          return;
        }


        const active =
          vehicles.find(
            (
              vehicle,
            ) =>
              vehicle.is_active,
          ) ??
          null;


        setActiveVehicle(
          active,
        );


        if (active) {
          try {
            const compatible =
              await getCompatibleProducts(
                accessToken,
                active.id,
              );


            if (!cancelled) {
              setCompatibleIds(
                new Set(
                  compatible.map(
                    (
                      product,
                    ) =>
                      product.id,
                  ),
                ),
              );
            }
          } catch {
            if (!cancelled) {
              setCompatibleIds(
                new Set(),
              );
            }
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingGarage(
            false,
          );
        }
      }
    }


    void loadGarage();


    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);


  /* ==========================================================
     CART
  ========================================================== */

  useEffect(() => {
    function syncCart() {
      setItems(
        getCartItems(),
      );

      setCartCount(
        getCartCount(),
      );
    }


    const timer =
      window.setTimeout(
        syncCart,
        0,
      );


    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCart,
    );

    window.addEventListener(
      "storage",
      syncCart,
    );


    return () => {
      window.clearTimeout(
        timer,
      );

      window.removeEventListener(
        CART_UPDATED_EVENT,
        syncCart,
      );

      window.removeEventListener(
        "storage",
        syncCart,
      );
    };
  }, []);


  /* ==========================================================
     TOTALS
  ========================================================== */

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) => {
            const unitPrice =
              item.sale_price ??
              item.price;


            return (
              total +
              unitPrice *
                item.quantity
            );
          },
          0,
        ),
      [
        items,
      ],
    );


  const delivery =
    items.length >
    0
      ? DELIVERY_FEE
      : 0;


  const total =
    Math.max(
      0,
      subtotal +
        delivery -
        DISCOUNT,
    );


  const compatibleCartItems =
    activeVehicle
      ? items.filter(
          (
            item,
          ) =>
            compatibleIds.has(
              item.product_id,
            ),
        ).length
      : 0;


  /* ==========================================================
     CART ACTIONS
  ========================================================== */

  function changeQuantity(
    item: CartItem,
    nextQuantity: number,
  ) {
    updateCartQuantity(
      item.product_id,
      nextQuantity,
    );


    setItems(
      getCartItems(),
    );

    setCartCount(
      getCartCount(),
    );
  }


  function removeItem(
    productId: string,
  ) {
    removeFromCart(
      productId,
    );


    setItems(
      getCartItems(),
    );

    setCartCount(
      getCartCount(),
    );
  }


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


  /* ==========================================================
     ADDRESS SELECTION
  ========================================================== */

  function selectShippingAddress(
    addressId: string,
  ) {
    setSelectedAddressId(
      addressId,
    );


    if (
      addressId ===
      "__custom__"
    ) {
      setShippingAddress(
        "",
      );

      setCheckoutMessage(
        "",
      );

      return;
    }


    const address =
      savedAddresses.find(
        (
          item,
        ) =>
          item.id ===
          addressId,
      );


    if (!address) {
      return;
    }


    setShippingAddress(
      formatSavedAddress(
        address,
      ),
    );

    setCheckoutMessage(
      "",
    );
  }


  /* ==========================================================
     PLACE ORDER
  ========================================================== */

  async function placeOrder() {
    if (
      items.length ===
      0
    ) {
      return;
    }


    const address =
      shippingAddress.trim();


    if (!address) {
      setCheckoutMessage(
        "Enter a shipping address before placing the order.",
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
      setPlacingOrder(
        true,
      );

      setCheckoutMessage(
        "",
      );


      const payload: CreateOrderPayload = {
            items:
              items.map(
                (
                  item,
                ) => ({
                  product_id:
                    item.product_id,

                  quantity:
                    item.quantity,
                }),
              ),

            shipping_address:
              address,

            payment_method:
              "cash_on_delivery",

            vehicle_id:
              activeVehicle?.id ??
              null,
      };

      const idempotencyKey = await getOrderAttemptKey(payload);
      const order = await createOrder(token, payload, idempotencyKey);

      clearOrderAttemptKey();


      clearCart();

      setItems(
        [],
      );

      setCartCount(
        0,
      );


      try {
        window.sessionStorage.setItem(
          "vehnexa_order_placed",
          order.order_number,
        );
      } catch {
        // This optional confirmation hint must not turn a placed order into an error.
      }


      router.push(
        "/orders",
      );
    } catch (
      orderError
    ) {
      if (
        orderError instanceof
          ApiError &&
        (
          orderError.status ===
            401 ||
          orderError.status ===
            403
        )
      ) {
        removeAccessToken();

        router.replace(
          "/login",
        );

        return;
      }


      setCheckoutMessage(
        orderError instanceof
          ApiError
          ? orderError.message
          : "Vehnexa could not place the order.",
      );
    } finally {
      setPlacingOrder(
        false,
      );
    }
  }


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7f9] text-[#101828]">
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#061827]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-[1480px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <CustomerNavbarBrand />


          <CustomerNavbarLinks />


          <form
            onSubmit={
              submitSearch
            }
            className="ml-auto hidden h-10 w-[260px] items-center overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.05] lg:flex"
          >
            <Search className="ml-4 h-4 w-4 shrink-0 text-[#90a3b4]" />

            <input
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search parts..."
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-[10px] text-white outline-none placeholder:text-[#728798]"
            />
          </form>


          <div className="flex items-center gap-1">
            <CustomerNavbarCart count={cartCount} />


            <NavbarNotificationBell />


            <Link
              href="/account"
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#d0d9e1] transition hover:bg-white/[0.06] hover:text-white"
            >
              <UserRound className="h-[17px] w-[17px]" />
            </Link>


            <CustomerLogoutButton />
          </div>
        </div>
      </header>


      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-140px] top-[-220px] h-[620px] w-[620px] rounded-full bg-[#e31b2d]/[0.15] blur-[140px]" />

          <div className="absolute right-[-80px] top-[20px] h-[480px] w-[480px] rounded-full bg-[#2563eb]/[0.07] blur-[110px]" />

          <div
            className="absolute inset-0 opacity-[0.09]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
              backgroundSize:
                "54px 54px",
            }}
          />
        </div>


        <div className="relative mx-auto max-w-[1480px] px-4 pb-18 pt-18 sm:px-6 sm:pb-22 sm:pt-22 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
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
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.24em] text-[#ff5967]">
                <span className="h-px w-10 bg-[#ff394a]" />

                Final order review
              </div>


              <h1 className="mt-6 max-w-[920px] text-[58px] font-black leading-[0.92] tracking-[-0.06em] sm:text-[74px] lg:text-[90px]">
                Confirm it.
                <span className="block text-[#ff394a]">
                  Then drive.
                </span>
              </h1>


              <p className="mt-7 max-w-[690px] text-[13px] leading-7 text-[#9fb0bf] sm:text-[14px]">
                Review your selected parts, delivery address and active vehicle context before creating the order.
              </p>


              <Link
                href="/cart"
                className="group mt-8 inline-flex h-12 items-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] px-6 text-[9px] font-black uppercase tracking-[0.1em] transition hover:bg-white/[0.08]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />

                Back to cart
              </Link>
            </motion.div>


            <motion.div
              initial={{
                opacity: 0,
                scale: 0.98,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                duration: 0.65,
                delay: 0.08,
              }}
              className="rounded-[28px] border border-white/[0.1] bg-white/[0.055] p-7 shadow-[0_30px_90px_rgba(0,0,0,.22)] backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#91a4b5]">
                    Checkout snapshot
                  </p>

                  <h2 className="mt-3 text-[27px] font-black tracking-[-0.04em]">
                    {cartCount >
                    0
                      ? `${cartCount} ${
                          cartCount ===
                          1
                            ? "item"
                            : "items"
                        } ready`
                      : "No items to checkout"}
                  </h2>
                </div>


                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e31b2d]">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>


              <div className="mt-8 grid grid-cols-3 gap-3">
                <HeroMetric
                  label="Subtotal"
                  value={
                    formatMoney(
                      subtotal,
                    )
                  }
                />

                <HeroMetric
                  label="Delivery"
                  value={
                    formatMoney(
                      delivery,
                    )
                  }
                />

                <HeroMetric
                  label="Total"
                  value={
                    formatMoney(
                      total,
                    )
                  }
                />
              </div>


              <div className="mt-6 flex items-start gap-3 border-t border-white/[0.08] pt-5">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5967]" />

                <p className="text-[9px] leading-5 text-[#9fb0bf]">
                  Payment method: Cash on delivery.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ======================================================
          CHECKOUT PROGRESS
      ====================================================== */}

      <section className="border-b border-[#e3e8ec] bg-white">
        <div className="mx-auto grid max-w-[1480px] md:grid-cols-3">
          <CheckoutStep
            number="01"
            title="Review parts"
            detail={`${cartCount} ${
              cartCount ===
              1
                ? "unit"
                : "units"
            } selected`}
            complete={
              items.length >
              0
            }
          />

          <CheckoutStep
            number="02"
            title="Delivery"
            detail={
              selectedAddressId ===
              "__custom__"
                ? "Custom address"
                : "Saved address"
            }
            complete={
              Boolean(
                shippingAddress.trim(),
              )
            }
          />

          <CheckoutStep
            number="03"
            title="Place order"
            detail="Cash on delivery"
            complete={
              false
            }
          />
        </div>
      </section>


      {/* ======================================================
          BODY
      ====================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {checkoutMessage && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-7 rounded-2xl border border-[#efc7cc] bg-[#fff3f4] px-5 py-4 text-[10px] font-semibold text-[#b4232f]"
          >
            {checkoutMessage}
          </motion.div>
        )}


        {items.length ===
        0 ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[30px] border border-dashed border-[#ccd5dc] bg-white px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#071b2d] text-white">
              <ShoppingCart className="h-8 w-8" />
            </div>

            <p className="mt-7 text-[8px] font-black uppercase tracking-[0.2em] text-[#e31b2d]">
              Checkout empty
            </p>

            <h2 className="mt-3 text-[32px] font-black tracking-[-0.04em]">
              Add parts before checking out.
            </h2>

            <p className="mt-3 max-w-[480px] text-[10px] leading-5 text-[#75818c]">
              Your checkout will populate from the products currently stored in your Vehnexa cart.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex h-12 items-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[9px] font-black uppercase tracking-[0.1em] text-white"
            >
              Browse marketplace

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
            {/* ================================================
                LEFT SIDE
            ================================================ */}

            <div className="space-y-7">
              {/* CART REVIEW */}

              <section className="overflow-hidden rounded-[26px] border border-[#e0e5e9] bg-white shadow-[0_18px_55px_rgba(18,32,45,.045)]">
                <div className="flex flex-col gap-4 border-b border-[#edf0f2] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#e31b2d]">
                      01 / Parts
                    </p>

                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.035em]">
                      Order contents
                    </h2>
                  </div>

                  <Link
                    href="/cart"
                    className="text-[8px] font-black uppercase tracking-[0.1em] text-[#667085] transition hover:text-[#e31b2d]"
                  >
                    Edit in cart
                  </Link>
                </div>


                <div className="divide-y divide-[#edf0f2]">
                  {items.map(
                    (
                      item,
                    ) => {
                      const unitPrice =
                        item.sale_price ??
                        item.price;

                      const lineTotal =
                        unitPrice *
                        item.quantity;

                      const fitsVehicle =
                        Boolean(
                          activeVehicle &&
                            compatibleIds.has(
                              item.product_id,
                            ),
                        );


                      return (
                        <article
                          key={
                            item.product_id
                          }
                          className="grid gap-5 p-6 sm:grid-cols-[112px_minmax(0,1fr)] sm:p-7"
                        >
                          <Link
                            href={`/product/${item.slug}`}
                            className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-[16px] border border-[#edf0f2] bg-[#f6f8f9]"
                          >
                            {item.image_url ? (
                              <img
                                src={
                                  item.image_url
                                }
                                alt={
                                  item.name
                                }
                                className="h-full w-full object-contain p-3"
                              />
                            ) : (
                              <Package className="h-10 w-10 text-[#c2cad1]" />
                            )}
                          </Link>


                          <div className="min-w-0">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-[7px] font-black uppercase tracking-[0.14em] text-[#98a2ab]">
                                  {item.sku}
                                </p>

                                <Link
                                  href={`/product/${item.slug}`}
                                  className="mt-1.5 block text-[14px] font-black leading-6 tracking-[-0.02em] transition hover:text-[#e31b2d]"
                                >
                                  {item.name}
                                </Link>


                                {!loadingGarage &&
                                  activeVehicle && (
                                  <div className="mt-3">
                                    {fitsVehicle ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c6e8d3] bg-[#effbf4] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.08em] text-[#087443]">
                                        <Check className="h-3 w-3" />

                                        Fits active vehicle
                                      </span>
                                    ) : (
                                      <span className="inline-flex rounded-full border border-[#e2e6e9] bg-[#f7f8f9] px-3 py-1.5 text-[7px] font-bold text-[#667085]">
                                        Compatibility not confirmed
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>


                              <button
                                type="button"
                                aria-label={`Remove ${item.name}`}
                                onClick={() =>
                                  removeItem(
                                    item.product_id,
                                  )
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dee3e7] text-[#b4232f] transition hover:bg-[#fff2f3]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>


                            <div className="mt-5 flex flex-col gap-4 border-t border-[#edf0f2] pt-4 sm:flex-row sm:items-end sm:justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-[8px] font-bold text-[#7c8790]">
                                  Qty
                                </span>

                                <div className="flex h-9 overflow-hidden rounded-lg border border-[#dbe1e5]">
                                  <button
                                    type="button"
                                    aria-label={`Decrease ${item.name} quantity`}
                                    onClick={() =>
                                      changeQuantity(
                                        item,
                                        item.quantity -
                                          1,
                                      )
                                    }
                                    className="flex w-9 items-center justify-center text-[#667085] transition hover:bg-[#f7f8f9]"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>

                                  <span className="flex min-w-10 items-center justify-center border-x border-[#e1e5e9] text-[9px] font-black">
                                    {item.quantity}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={
                                      item.quantity >=
                                      item.stock_quantity
                                    }
                                    aria-label={`Increase ${item.name} quantity`}
                                    onClick={() =>
                                      changeQuantity(
                                        item,
                                        item.quantity +
                                          1,
                                      )
                                    }
                                    className="flex w-9 items-center justify-center text-[#667085] transition hover:bg-[#f7f8f9] disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>


                              <div className="text-right">
                                <p className="text-[8px] text-[#8d98a1]">
                                  {formatMoney(
                                    unitPrice,
                                  )}{" "}
                                  each
                                </p>

                                <p className="mt-1 text-[17px] font-black tracking-[-0.03em]">
                                  {formatMoney(
                                    lineTotal,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              </section>


              {/* DELIVERY */}

              <section className="rounded-[26px] border border-[#e0e5e9] bg-white p-6 shadow-[0_18px_55px_rgba(18,32,45,.045)] sm:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#e31b2d]">
                      02 / Delivery
                    </p>

                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.035em]">
                      Shipping address
                    </h2>

                    <p className="mt-2 max-w-[600px] text-[9px] leading-5 text-[#78848e]">
                      Choose one of your saved addresses or enter a custom shipping address for this order.
                    </p>
                  </div>

                  <MapPin className="h-5 w-5 text-[#e31b2d]" />
                </div>


                {loadingAddresses ? (
                  <div className="mt-7 h-[140px] animate-pulse rounded-[18px] bg-[#f3f5f7]" />
                ) : (
                  <>
                    {savedAddresses.length >
                      0 && (
                      <div className="relative mt-7">
                        <select
                          id="shipping-address-choice"
                          value={
                            selectedAddressId
                          }
                          onChange={(
                            event,
                          ) =>
                            selectShippingAddress(
                              event.target.value,
                            )
                          }
                          className="h-12 w-full appearance-none rounded-xl border border-[#d9e0e5] bg-[#f9fafb] px-4 pr-11 text-[10px] font-semibold text-[#344054] outline-none transition focus:border-[#e31b2d]"
                        >
                          {savedAddresses.map(
                            (
                              address,
                            ) => (
                              <option
                                key={
                                  address.id
                                }
                                value={
                                  address.id
                                }
                              >
                                {address.label}
                                {address.is_default
                                  ? " — Default"
                                  : ""}
                              </option>
                            ),
                          )}

                          <option value="__custom__">
                            Use another address
                          </option>
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8993]" />
                      </div>
                    )}


                    <textarea
                      value={
                        shippingAddress
                      }
                      onChange={(
                        event,
                      ) => {
                        setShippingAddress(
                          event.target.value,
                        );

                        setCheckoutMessage(
                          "",
                        );

                        if (
                          selectedAddressId !==
                          "__custom__"
                        ) {
                          setSelectedAddressId(
                            "__custom__",
                          );
                        }
                      }}
                      rows={
                        6
                      }
                      placeholder="Recipient name&#10;Phone number&#10;Street address&#10;City, region, country"
                      className="mt-4 w-full resize-none rounded-[16px] border border-[#d9e0e5] bg-white px-4 py-4 text-[10px] leading-5 text-[#344054] outline-none transition placeholder:text-[#a1aab2] focus:border-[#e31b2d] focus:ring-4 focus:ring-[#e31b2d]/[0.06]"
                    />


                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[8px] text-[#89949d]">
                        The exact text above is submitted as the shipping address for this order.
                      </p>

                      <Link
                        href="/account/addresses"
                        className="text-[8px] font-black text-[#e31b2d]"
                      >
                        Manage saved addresses
                      </Link>
                    </div>
                  </>
                )}
              </section>


              {/* VEHICLE */}

              <section className="rounded-[26px] border border-[#e0e5e9] bg-white p-6 shadow-[0_18px_55px_rgba(18,32,45,.045)] sm:p-7">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#e31b2d]">
                      Vehicle context
                    </p>

                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.035em]">
                      Active Garage vehicle
                    </h2>
                  </div>

                  <CarFront className="h-5 w-5 text-[#e31b2d]" />
                </div>


                {loadingGarage ? (
                  <div className="mt-6 h-[110px] animate-pulse rounded-[18px] bg-[#f3f5f7]" />
                ) : activeVehicle ? (
                  <div className="mt-6 overflow-hidden rounded-[18px] border border-[#dde3e7] bg-[#f8fafb]">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071b2d] text-white">
                          <CarFront className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-[13px] font-black">
                            {activeVehicle.year}{" "}
                            {activeVehicle.make}{" "}
                            {activeVehicle.model}
                          </p>

                          <p className="mt-1 text-[8px] text-[#76828c]">
                            Used as this order&apos;s vehicle context
                          </p>
                        </div>
                      </div>


                      <div className="text-left sm:text-right">
                        <div className="text-[24px] font-black tracking-[-0.04em]">
                          {
                            compatibleCartItems
                          }
                          /
                          {
                            items.length
                          }
                        </div>

                        <p className="text-[7px] font-black uppercase tracking-[0.1em] text-[#7e8992]">
                          Compatibility confirmed
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col gap-5 rounded-[18px] border border-[#e1e5e9] bg-[#f8fafb] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-black">
                        No active vehicle selected.
                      </p>

                      <p className="mt-2 text-[8px] leading-4 text-[#77838d]">
                        You can still place the order, but no Garage vehicle will be attached to it.
                      </p>
                    </div>

                    <Link
                      href="/account/garage"
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#071b2d] px-5 text-[8px] font-black text-white"
                    >
                      Open Garage
                    </Link>
                  </div>
                )}
              </section>
            </div>


            {/* ================================================
                SUMMARY
            ================================================ */}

            <aside>
              <div className="sticky top-[102px] overflow-hidden rounded-[28px] border border-[#dde3e7] bg-white shadow-[0_24px_70px_rgba(18,32,45,.075)]">
                <div className="border-b border-[#edf0f2] bg-[#071b2d] p-7 text-white">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#ff5967]">
                    03 / Confirmation
                  </p>

                  <h2 className="mt-2 text-[25px] font-black tracking-[-0.035em]">
                    Order summary
                  </h2>

                  <p className="mt-2 text-[9px] leading-5 text-[#9fb0bf]">
                    Verify the final amount before creating your order.
                  </p>
                </div>


                <div className="p-7">
                  <SummaryRow
                    label="Subtotal"
                    value={
                      formatMoney(
                        subtotal,
                      )
                    }
                  />

                  <SummaryRow
                    label="Delivery"
                    value={
                      formatMoney(
                        delivery,
                      )
                    }
                  />

                  <SummaryRow
                    label="Discount"
                    value={
                      formatMoney(
                        DISCOUNT,
                      )
                    }
                  />


                  <div className="my-6 border-t border-[#e7ebee]" />


                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#7d8993]">
                        Total
                      </p>

                      <p className="mt-1 text-[8px] text-[#99a2aa]">
                        Cash on delivery
                      </p>
                    </div>

                    <p className="text-[32px] font-black tracking-[-0.05em] text-[#101828]">
                      {formatMoney(
                        total,
                      )}
                    </p>
                  </div>


                  <div className="mt-7 rounded-[17px] bg-[#f6f8f9] p-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#e31b2d]" />

                      <div>
                        <p className="text-[9px] font-black">
                          Cash on delivery
                        </p>

                        <p className="mt-1 text-[8px] leading-4 text-[#7a8690]">
                          This checkout currently places the order with cash on delivery.
                        </p>
                      </div>
                    </div>
                  </div>


                  <button
                    type="button"
                    disabled={
                      placingOrder ||
                      items.length ===
                        0
                    }
                    onClick={() => {
                      void placeOrder();
                    }}
                    className="group mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-5 text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-[0_16px_38px_rgba(227,27,45,.2)] transition hover:bg-[#f32639] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {placingOrder
                      ? "Placing order..."
                      : "Place order"}

                    {!placingOrder && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>


                  <div className="mt-6 flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#e31b2d]" />

                    <p className="text-[8px] leading-4 text-[#7a8690]">
                      Your order is created only after the Place Order action succeeds.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}


/* ============================================================
   HELPERS
============================================================ */

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",
      currency:
        "USD",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}




function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.045] p-4">
      <div className="truncate text-[16px] font-black tracking-[-0.035em]">
        {value}
      </div>

      <div className="mt-1 text-[7px] font-black uppercase tracking-[0.13em] text-[#8da0b1]">
        {label}
      </div>
    </div>
  );
}


function CheckoutStep({
  number,
  title,
  detail,
  complete,
}: {
  number: string;
  title: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <div className="flex min-h-[112px] items-center gap-4 border-b border-[#edf0f2] px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-8">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          complete
            ? "bg-[#e31b2d] text-white"
            : "bg-[#f1f3f5] text-[#667085]"
        }`}
      >
        {complete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <span className="text-[8px] font-black">
            {number}
          </span>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black">
          {title}
        </p>

        <p className="mt-1 text-[7px] text-[#8a959e]">
          {detail}
        </p>
      </div>
    </div>
  );
}


function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-5 text-[9px]">
      <span className="text-[#77838d]">
        {label}
      </span>

      <span className="font-black text-[#1b2832]">
        {value}
      </span>
    </div>
  );
}
