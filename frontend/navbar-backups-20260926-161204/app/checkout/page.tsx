"use client";

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
  CarFront,
  Minus,
  Package,
  Plus,
  Search,
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
} from "@/lib/orders";

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


/* ============================================================
   CONSTANTS
============================================================ */

const DELIVERY_FEE =
  5;


const DISCOUNT =
  0;


/* ============================================================
   PAGE
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
    useState(0);


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
    useState(true);


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    shippingAddress,
    setShippingAddress,
  ] =
    useState("");


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
    useState("");


  const [
    placingOrder,
    setPlacingOrder,
  ] =
    useState(false);


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


        if (
          cancelled
        ) {
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


        if (
          preferred
        ) {
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
        if (
          !cancelled
        ) {
          setSavedAddresses(
            [],
          );

          setSelectedAddressId(
            "__custom__",
          );
        }

      } finally {
        if (
          !cancelled
        ) {
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
     AUTH

     Cart / checkout is a protected customer feature.
  ========================================================== */

  useEffect(() => {
    const token =
      getAccessToken();


    if (
      !token
    ) {
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


        if (
          cancelled
        ) {
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


        if (
          active
        ) {
          try {
            const compatible =
              await getCompatibleProducts(
                accessToken,
                active.id,
              );


            if (
              !cancelled
            ) {
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
            if (
              !cancelled
            ) {
              setCompatibleIds(
                new Set(),
              );
            }
          }
        }
      } finally {
        if (
          !cancelled
        ) {
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
     CART STATE
  ========================================================== */

  useEffect(() => {
    const syncCart =
      () => {
        setItems(
          getCartItems(),
        );

        setCartCount(
          getCartCount(),
        );
      };


    syncCart();


    window.addEventListener(
      CART_UPDATED_EVENT,
      syncCart,
    );


    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
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


  /* ==========================================================
     CART ACTIONS
  ========================================================== */

  function changeQuantity(
    item:
      CartItem,
    nextQuantity:
      number,
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
    productId:
      string,
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
     PLACE ORDER
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


  async function placeOrder() {
    if (
      items.length === 0
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


      const order =
        await createOrder(
          token,
          {
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
          },
        );


      clearCart();


      setItems(
        [],
      );

      setCartCount(
        0,
      );


      window.sessionStorage.setItem(
        "vehnexa_order_placed",
        order.order_number,
      );


      router.push(
        "/orders",
      );

    } catch (orderError) {
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


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#101828]">
      <CheckoutNavbar
        search={
          search
        }
        setSearch={
          setSearch
        }
        submitSearch={
          submitSearch
        }
        cartCount={
          cartCount
        }
      />


      <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-[31px] font-bold tracking-[-0.035em] text-[#101828]">
            Checkout
          </h1>


          <p className="mt-1.5 text-[12px] text-[#667085]">
            Review compatible items, choose delivery details and place the order.
          </p>
        </div>


        <div className="mt-8 grid gap-7 lg:grid-cols-[1.65fr_.88fr]">
          {/* ==================================================
              CART
          ================================================== */}

          <section className="min-h-[535px] rounded-[16px] border border-[#dfe3e8] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.02)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[17px] font-bold text-[#101828]">
                Your cart
              </h2>


              <span className="text-[10px] text-[#667085]">
                {cartCount}{" "}
                {cartCount ===
                1
                  ? "item"
                  : "items"}
              </span>
            </div>


            {items.length ===
            0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f4f7] text-[#98a2b3]">
                  <ShoppingCart className="h-7 w-7" />
                </span>


                <h3 className="mt-5 text-[16px] font-bold text-[#101828]">
                  Your cart is empty
                </h3>


                <p className="mt-2 max-w-[320px] text-[11px] leading-5 text-[#667085]">
                  Browse the marketplace and add parts before starting checkout.
                </p>


                <Link
                  href="/shop"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-[6px] bg-[#e31b2d] px-5 text-[11px] font-semibold text-white transition hover:bg-[#c91625]"
                >
                  Browse parts
                </Link>
              </div>
            ) : (
              <div className="mt-6">
                {items.map(
                  (
                    item,
                    index,
                  ) => {
                    const unitPrice =
                      item.sale_price ??
                      item.price;


                    const lineTotal =
                      unitPrice *
                      item.quantity;


                    const fitsVehicle =
                      activeVehicle &&
                      compatibleIds.has(
                        item.product_id,
                      );


                    return (
                      <article
                        key={
                          item.product_id
                        }
                        className={`grid gap-4 py-6 sm:grid-cols-[74px_1fr_auto] sm:items-center ${
                          index >
                          0
                            ? "border-t border-[#e4e7ec]"
                            : ""
                        }`}
                      >
                        <Link
                          href={
                            `/product/${item.slug}`
                          }
                          className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[8px] bg-[#f1f3f5]"
                        >
                          {item.image_url ? (
                            <img
                              src={
                                item.image_url
                              }
                              alt={
                                item.name
                              }
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-[#c0c8d0]" />
                          )}
                        </Link>


                        <div className="min-w-0">
                          <Link
                            href={
                              `/product/${item.slug}`
                            }
                            className="text-[12px] font-bold text-[#202936] transition hover:text-[#e31b2d]"
                          >
                            {
                              item.name
                            }
                          </Link>


                          {fitsVehicle ? (
                            <p className="mt-2 text-[9px] font-semibold text-[#169b52]">
                              Fits{" "}
                              {
                                activeVehicle.year
                              }{" "}
                              {
                                activeVehicle.make
                              }{" "}
                              {
                                activeVehicle.model
                              }
                            </p>
                          ) : activeVehicle &&
                            !loadingGarage ? (
                            <p className="mt-2 text-[9px] font-medium text-[#667085]">
                              Compatibility not confirmed for active vehicle
                            </p>
                          ) : null}


                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="text-[9px] text-[#667085]">
                              Qty
                            </span>


                            <div className="inline-flex h-8 overflow-hidden rounded-[5px] border border-[#d8dee5]">
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(
                                    item,
                                    item.quantity -
                                      1,
                                  )
                                }
                                aria-label={`Decrease ${item.name} quantity`}
                                className="flex w-8 items-center justify-center text-[#667085] transition hover:bg-[#f5f6f7]"
                              >
                                <Minus className="h-3 w-3" />
                              </button>


                              <span className="flex min-w-[34px] items-center justify-center border-x border-[#e4e7ec] bg-white text-[10px] font-semibold text-[#344054]">
                                {
                                  item.quantity
                                }
                              </span>


                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(
                                    item,
                                    item.quantity +
                                      1,
                                  )
                                }
                                disabled={
                                  item.quantity >=
                                  item.stock_quantity
                                }
                                aria-label={`Increase ${item.name} quantity`}
                                className="flex w-8 items-center justify-center text-[#667085] transition hover:bg-[#f5f6f7] disabled:cursor-not-allowed disabled:text-[#d0d5dd]"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>


                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.product_id,
                                )
                              }
                              className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#98a2b3] transition hover:text-[#e31b2d]"
                            >
                              <Trash2 className="h-3 w-3" />

                              Remove
                            </button>
                          </div>
                        </div>


                        <div className="sm:text-right">
                          <p className="text-[13px] font-bold text-[#101828]">
                            $
                            {
                              lineTotal.toFixed(
                                2,
                              )
                            }
                          </p>


                          {item.quantity >
                            1 && (
                            <p className="mt-1 text-[8px] text-[#98a2b3]">
                              $
                              {
                                unitPrice.toFixed(
                                  2,
                                )
                              }{" "}
                              each
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>


          {/* ==================================================
              SUMMARY
          ================================================== */}

          <aside className="self-start rounded-[16px] border border-[#dfe3e8] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.02)] sm:p-7">
            <h2 className="text-[17px] font-bold text-[#101828]">
              Order summary
            </h2>


            <div className="mt-9 space-y-6">
              <SummaryRow
                label="Subtotal"
                value={`$${subtotal.toFixed(
                  2,
                )}`}
              />


              <SummaryRow
                label="Delivery"
                value={
                  delivery ===
                  0
                    ? "$0.00"
                    : `$${delivery.toFixed(
                        2,
                      )}`
                }
              />


              <SummaryRow
                label="Discount"
                value={
                  DISCOUNT >
                  0
                    ? `-$${DISCOUNT.toFixed(
                        2,
                      )}`
                    : "$0.00"
                }
              />
            </div>


            <div className="mt-7 flex items-end justify-between border-t border-[#dfe3e8] pt-5">
              <span className="text-[12px] font-bold text-[#101828]">
                Total
              </span>


              <span className="text-[22px] font-bold tracking-[-0.03em] text-[#101828]">
                $
                {
                  total.toFixed(
                    2,
                  )
                }
              </span>
            </div>


            <div className="mt-9">
              <label className="text-[10px] font-bold text-[#344054]">
                Payment method
              </label>


              <div className="mt-2.5 flex h-[44px] items-center rounded-[8px] border border-[#d8dee5] bg-[#f8f9fb] px-4 text-[10px] text-[#344054]">
                Cash on delivery
              </div>
            </div>


            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="shipping-address-choice"
                  className="text-[10px] font-bold text-[#344054]"
                >
                  Shipping address
                </label>


                <Link
                  href="/account/addresses"
                  className="text-[8px] font-semibold text-[#e31b2d]"
                >
                  Manage addresses
                </Link>
              </div>


              {loadingAddresses ? (
                <div className="mt-2.5 h-[44px] animate-pulse rounded-[8px] bg-[#f2f4f7]" />
              ) : savedAddresses.length > 0 ? (
                <>
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
                    className="mt-2.5 h-[44px] w-full rounded-[8px] border border-[#d8dee5] bg-white px-3 text-[10px] text-[#344054] outline-none transition focus:border-[#aeb7c2]"
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
                            ? " ? Default"
                            : ""}
                          {" ? "}
                          {address.city}
                        </option>
                      ),
                    )}


                    <option value="__custom__">
                      Use another address
                    </option>
                  </select>


                  {selectedAddressId !==
                  "__custom__" ? (
                    <div className="mt-3 rounded-[8px] border border-[#d8dee5] bg-[#f8f9fb] px-4 py-3">
                      {shippingAddress
                        .split(
                          "\n",
                        )
                        .map(
                          (
                            line,
                            index,
                          ) => (
                            <p
                              key={
                                `${line}-${index}`
                              }
                              className="text-[9px] leading-5 text-[#475467]"
                            >
                              {
                                line
                              }
                            </p>
                          ),
                        )}
                    </div>
                  ) : (
                    <textarea
                      id="shipping-address"
                      value={
                        shippingAddress
                      }
                      onChange={(
                        event,
                      ) =>
                        setShippingAddress(
                          event.target.value,
                        )
                      }
                      placeholder="Enter your address and phone number"
                      rows={
                        4
                      }
                      className="mt-3 w-full resize-none rounded-[8px] border border-[#d8dee5] bg-[#f8f9fb] px-4 py-3 text-[10px] leading-5 text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#aeb7c2] focus:bg-white"
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="mt-2.5 rounded-[8px] border border-[#e4e7ec] bg-[#f8f9fb] px-4 py-3">
                    <p className="text-[9px] leading-4 text-[#667085]">
                      You do not have a saved address yet. Enter one below or{" "}
                      <Link
                        href="/account/addresses"
                        className="font-semibold text-[#e31b2d]"
                      >
                        save an address
                      </Link>
                      .
                    </p>
                  </div>


                  <textarea
                    id="shipping-address"
                    value={
                      shippingAddress
                    }
                    onChange={(
                      event,
                    ) =>
                      setShippingAddress(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your address and phone number"
                    rows={
                      4
                    }
                    className="mt-3 w-full resize-none rounded-[8px] border border-[#d8dee5] bg-[#f8f9fb] px-4 py-3 text-[10px] leading-5 text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#aeb7c2] focus:bg-white"
                  />
                </>
              )}
            </div>


            {checkoutMessage && (
              <p className="mt-4 rounded-[7px] border border-[#f1d6d9] bg-[#fff5f6] px-3 py-2.5 text-[9px] leading-4 text-[#b4232f]">
                {
                  checkoutMessage
                }
              </p>
            )}


            <button
              type="button"
              onClick={
                placeOrder
              }
              disabled={
                placingOrder ||
                items.length ===
                  0 ||
                !shippingAddress.trim()
              }
              className="mt-5 flex h-[44px] w-full items-center justify-center rounded-[7px] bg-[#ef3d43] text-[11px] font-semibold text-white transition hover:bg-[#d92d38] disabled:cursor-not-allowed disabled:bg-[#d0d5dd]"
            >
              {placingOrder
                ? "Placing order..."
                : "Place order"}
            </button>


            {!activeVehicle &&
              !loadingGarage && (
              <div className="mt-4 flex gap-2 rounded-[7px] bg-[#f8fafc] p-3">
                <CarFront className="mt-0.5 h-4 w-4 shrink-0 text-[#667085]" />


                <p className="text-[9px] leading-4 text-[#667085]">
                  No active vehicle selected.{" "}

                  <Link
                    href="/account/garage"
                    className="font-semibold text-[#e31b2d]"
                  >
                    Choose a vehicle
                  </Link>{" "}

                  to verify compatibility before ordering.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>


      <footer className="mt-8 border-t border-[#182a3d] bg-[#071523]">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 text-[8px] uppercase tracking-[0.12em] text-[#8393a3] sm:px-6 lg:px-8">
          <span>
            Vehnexa
          </span>


          <span>
            Cart / Checkout
          </span>
        </div>
      </footer>
    </main>
  );
}


/* ============================================================
   NAVBAR
============================================================ */

function CheckoutNavbar({
  search,
  setSearch,
  submitSearch,
  cartCount,
}: {
  search:
    string;

  setSearch:
    (
      value:
        string,
    ) =>
      void;

  submitSearch:
    (
      event:
        FormEvent<HTMLFormElement>,
    ) =>
      void;

  cartCount:
    number;
}) {
  return (
    <header className="border-b border-[#e4e7ec] bg-white">
      <div className="mx-auto flex h-[70px] max-w-[1320px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
        >
          <VehnexaMark />


          <span className="text-[15px] font-bold tracking-[-0.02em] text-[#17202a]">
            Vehnexa
          </span>
        </Link>


        <nav className="ml-5 hidden h-full items-center gap-8 lg:flex">
          <TopLink
            href="/"
            label="Home"
          />


          <TopLink
            href="/shop"
            label="Shop"
            active
          />


          <TopLink
            href="/account/garage"
            label="My Garage"
          />


          <TopLink
            href="/ai-mechanic"
            label="AI Mechanic"
          />


          <TopLink
            href="/orders"
            label="Orders"
          />
        </nav>


        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={
              submitSearch
            }
            className="relative hidden lg:block"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />


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
              className="h-10 w-[205px] rounded-full border border-[#d8dde3] bg-[#f7f8fa] pl-9 pr-4 text-[10px] text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#b9c1ca] focus:bg-white"
            />
          </form>


          <Link
            href="/checkout"
            aria-label={`Cart with ${cartCount} items`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#f2f4f7]"
          >
            <ShoppingCart className="h-[16px] w-[16px]" />


            {cartCount >
              0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[8px] font-bold text-white">
                {cartCount >
                99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </Link>


          <Link
            href="/account"
            aria-label="Account"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#071523] text-white"
          >
            <UserRound className="h-[15px] w-[15px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}


/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-[9px] text-[#667085]">
        {
          label
        }
      </span>


      <span className="text-[10px] font-semibold text-[#101828]">
        {
          value
        }
      </span>
    </div>
  );
}


/* ============================================================
   TOP NAV LINK
============================================================ */

function TopLink({
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
          ? "text-[#e31b2d]"
          : "text-[#667085] hover:text-[#344054]"
      }`}
    >
      {
        label
      }


      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#e31b2d]" />
      )}
    </Link>
  );
}


/* ============================================================
   LOGO
============================================================ */

function VehnexaMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#ef3d43]">
      <span className="text-[18px] font-black italic tracking-[-0.08em] text-white">
        V
      </span>
    </div>
  );
}
