"use client";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";
import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  CART_UPDATED_EVENT,
  getCartCount,
  getCartItems,
  getCartSubtotal,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";


export default function CartPage() {
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
    hydrated,
    setHydrated,
  ] =
    useState(
      false,
    );


  const [
    message,
    setMessage,
  ] =
    useState(
      "",
    );


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
        () => {
          syncCart();

          setHydrated(
            true,
          );
        },
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


  const subtotal =
    items.reduce(
      (
        total,
        item,
      ) =>
        total +
        (
          item.sale_price ??
          item.price
        ) *
        item.quantity,
      0,
    );


  const distinctProducts =
    items.length;


  const availableProducts =
    items.filter(
      (
        item,
      ) =>
        item.stock_quantity >
        0,
    ).length;


  function changeQuantity(
    item: CartItem,
    nextQuantity: number,
  ) {
    const updated =
      updateCartQuantity(
        item.product_id,
        nextQuantity,
      );


    setItems(
      updated,
    );

    setCartCount(
      getCartCount(),
    );

    setMessage(
      "Cart updated.",
    );
  }


  function removeItem(
    item: CartItem,
  ) {
    const updated =
      removeFromCart(
        item.product_id,
      );


    setItems(
      updated,
    );

    setCartCount(
      getCartCount(),
    );

    setMessage(
      "Item removed from cart.",
    );
  }


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7f9] text-[#0b1520]">
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#061827]/95 text-white shadow-[0_8px_40px_rgba(2,12,22,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#e31b2d] font-black italic text-white shadow-[0_0_30px_rgba(227,27,45,0.28)]">
              <span className="relative z-10">
                V
              </span>

              <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
            </div>


            <div>
              <div className="text-[15px] font-black tracking-[-0.02em]">
                Vehnexa
              </div>

              <div className="text-[7px] font-semibold uppercase tracking-[0.28em] text-[#8ba0b4]">
                Drive smarter
              </div>
            </div>
          </Link>


          <nav className="ml-12 hidden items-center gap-8 xl:flex">
            <NavbarLink
              href="/shop"
              label="Shop"
            />

            <NavbarLink
              href="/account/garage"
              label="My Garage"
            />

            <NavbarLink
              href="/ai-mechanic"
              label="AI Mechanic"
            />

            <NavbarLink
              href="/orders"
              label="Orders"
            />
          </nav>


          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              aria-label="Search parts"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[#c4ced7] transition hover:bg-white/[0.06] hover:text-white sm:flex"
            >
              <Search className="h-[17px] w-[17px]" />
            </Link>


            <Link
              href="/cart"
              aria-label={`Cart with ${cartCount} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-white"
            >
              <ShoppingBag className="h-[17px] w-[17px]" />


              {cartCount > 0 && (
                <span className="absolute right-[1px] top-[1px] flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[8px] font-black leading-none text-white ring-2 ring-[#061827]">
                  {cartCount >
                  99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>


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


      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061827] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-12%] top-[-50%] h-[680px] w-[680px] rounded-full bg-[#e31b2d]/[0.14] blur-[140px]" />

          <div className="absolute right-[-8%] top-[18%] h-[500px] w-[500px] rounded-full bg-[#2563eb]/[0.08] blur-[120px]" />

          <div
            className="absolute inset-0 opacity-[0.1]"
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
                "-25%",
                "125%",
              ],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-[47%] h-px w-[38%] bg-gradient-to-r from-transparent via-[#ff394a] to-transparent opacity-70 shadow-[0_0_22px_rgba(255,57,74,0.75)]"
          />
        </div>


        <div className="relative mx-auto max-w-[1480px] px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-28">
          <div className="grid gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
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
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-[#ff394a]" />

                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff5967]">
                  Purchase staging
                </span>
              </div>


              <h1 className="max-w-[900px] text-[58px] font-black leading-[0.91] tracking-[-0.06em] sm:text-[76px] lg:text-[92px] xl:text-[102px]">
                Your parts.
                <span className="block text-[#ff394a]">
                  Ready to move.
                </span>
              </h1>


              <p className="mt-8 max-w-[680px] text-[14px] leading-7 text-[#9fb0c0] sm:text-[15px]">
                Review the products you selected, adjust quantities against available stock, and move into checkout when the order looks right.
              </p>


              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex h-13 items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] px-7 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-white/[0.08]"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />

                  Continue shopping
                </Link>


                {cartCount > 0 && (
                  <Link
                    href="/checkout"
                    className="group inline-flex h-13 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-[0_16px_38px_rgba(227,27,45,0.24)] transition hover:bg-[#f32639]"
                  >
                    Proceed to checkout

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </motion.div>


            <motion.div
              initial={{
                opacity: 0,
                y: 26,
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
              <div className="absolute inset-0 translate-y-8 rounded-[32px] bg-[#e31b2d]/10 blur-3xl" />


              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.055] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#91a6b8]">
                      Cart status
                    </p>

                    <h2 className="mt-3 text-[30px] font-black tracking-[-0.04em]">
                      {!hydrated
                        ? "Loading your cart..."
                        : cartCount ===
                            0
                          ? "Your cart is ready for a part."
                          : `${cartCount} ${
                              cartCount ===
                              1
                                ? "item"
                                : "items"
                            } selected.`}
                    </h2>
                  </div>


                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#e31b2d] text-white shadow-[0_12px_30px_rgba(227,27,45,0.26)]">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </div>


                <div className="mt-9 grid grid-cols-3 gap-3">
                  <HeroStat
                    value={
                      hydrated
                        ? String(
                            distinctProducts,
                          )
                        : "—"
                    }
                    label="Products"
                  />

                  <HeroStat
                    value={
                      hydrated
                        ? String(
                            cartCount,
                          )
                        : "—"
                    }
                    label="Units"
                  />

                  <HeroStat
                    value={
                      hydrated
                        ? formatMoney(
                            subtotal,
                          )
                        : "—"
                    }
                    label="Subtotal"
                  />
                </div>


                <div className="mt-7 flex items-start gap-3 border-t border-white/[0.08] pt-6">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5967]" />

                  <p className="text-[10px] leading-5 text-[#9fb0c0]">
                    Cart quantities are limited by the stock values stored with each cart item.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ======================================================
          METRICS
      ====================================================== */}

      <section className="border-b border-[#e4e8ec] bg-white">
        <div className="mx-auto grid max-w-[1480px] divide-y divide-[#edf0f2] px-4 sm:px-6 md:grid-cols-4 md:divide-x md:divide-y-0 lg:px-8">
          <MetricStrip
            icon={
              Package
            }
            value={
              hydrated
                ? String(
                    distinctProducts,
                  )
                : "—"
            }
            label="Distinct parts"
            detail="Different products currently in cart"
          />


          <MetricStrip
            icon={
              ShoppingBag
            }
            value={
              hydrated
                ? String(
                    cartCount,
                  )
                : "—"
            }
            label="Total units"
            detail="Quantity across all cart products"
          />


          <MetricStrip
            icon={
              CheckCircle2
            }
            value={
              hydrated
                ? String(
                    availableProducts,
                  )
                : "—"
            }
            label="Available products"
            detail="Cart products with stock above zero"
          />


          <MetricStrip
            icon={
              ShoppingCart
            }
            value={
              hydrated
                ? formatMoney(
                    subtotal,
                  )
                : "—"
            }
            label="Cart subtotal"
            detail="Current effective cart price"
          />
        </div>
      </section>


      {/* ======================================================
          BODY
      ====================================================== */}

      <section className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {message && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-7 flex items-center gap-3 rounded-2xl border border-[#bde6ce] bg-[#effbf4] px-5 py-4 text-[11px] font-semibold text-[#087443]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            {message}
          </motion.div>
        )}


        {!hydrated ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-5">
              {[
                1,
                2,
                3,
              ].map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item
                    }
                    className="h-[220px] animate-pulse rounded-[26px] border border-[#e1e6ea] bg-white"
                  />
                ),
              )}
            </div>

            <div className="h-[420px] animate-pulse rounded-[26px] border border-[#e1e6ea] bg-white" />
          </div>
        ) : items.length ===
          0 ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-[32px] border border-dashed border-[#cdd5db] bg-white px-6 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 scale-[2.1] rounded-full bg-[#e31b2d]/10 blur-2xl" />

              <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-[28px] bg-[#071b2d] text-white shadow-[0_20px_50px_rgba(7,27,45,0.18)]">
                <ShoppingCart className="h-9 w-9" />
              </div>
            </div>


            <div className="mt-9 text-[9px] font-black uppercase tracking-[0.22em] text-[#e31b2d]">
              Cart empty
            </div>


            <h2 className="mt-3 text-[34px] font-black tracking-[-0.045em]">
              Start building your next order.
            </h2>


            <p className="mt-4 max-w-[520px] text-[11px] leading-6 text-[#71808c]">
              Browse the Vehnexa marketplace and add the parts you want to purchase.
            </p>


            <Link
              href="/shop"
              className="group mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[10px] font-black uppercase tracking-[0.09em] text-white shadow-[0_14px_32px_rgba(227,27,45,0.2)]"
            >
              Browse marketplace

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
            {/* ITEMS */}

            <div className="min-w-0">
              <div className="mb-7">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#e31b2d]">
                  <ShoppingCart className="h-4 w-4" />

                  Order builder
                </div>


                <h2 className="mt-3 text-[38px] font-black tracking-[-0.045em] sm:text-[48px]">
                  Review your cart.
                </h2>


                <p className="mt-3 max-w-[680px] text-[12px] leading-6 text-[#697682]">
                  Adjust quantities, remove products you no longer need, or open a product before continuing.
                </p>
              </div>


              <div className="space-y-5">
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


                    return (
                      <motion.article
                        key={
                          item.product_id
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
                              index *
                                0.05,
                              0.3,
                            ),
                        }}
                        className="overflow-hidden rounded-[26px] border border-[#e0e5e9] bg-white shadow-[0_18px_55px_rgba(18,32,45,0.05)]"
                      >
                        <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
                          <Link
                            href={`/product/${item.slug}`}
                            className="block border-b border-[#edf0f2] bg-[#f7f9fa] md:border-b-0 md:border-r"
                          >
                            <div
                              className="h-[220px] bg-contain bg-center bg-no-repeat"
                              style={
                                item.image_url
                                  ? {
                                      backgroundImage:
                                        `url("${item.image_url}")`,
                                    }
                                  : undefined
                              }
                            >
                              {!item.image_url && (
                                <div className="flex h-full items-center justify-center">
                                  <Package className="h-14 w-14 text-[#c6ced5]" />
                                </div>
                              )}
                            </div>
                          </Link>


                          <div className="flex flex-col p-6 sm:p-7">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#929da7]">
                                  {item.sku}
                                </p>


                                <Link
                                  href={`/product/${item.slug}`}
                                  className="mt-2 block text-[18px] font-black leading-7 tracking-[-0.025em] text-[#13202b] transition hover:text-[#e31b2d]"
                                >
                                  {item.name}
                                </Link>


                                <div className="mt-4 flex flex-wrap gap-2">
                                  <span
                                    className={
                                      item.stock_quantity >
                                      0
                                        ? "rounded-full border border-[#c7e9d4] bg-[#effbf4] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#087443]"
                                        : "rounded-full border border-[#f0c8cc] bg-[#fff2f3] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#b4232f]"
                                    }
                                  >
                                    {item.stock_quantity >
                                    0
                                      ? `${item.stock_quantity} in stock`
                                      : "Out of stock"}
                                  </span>


                                  {item.sale_price !==
                                    null && (
                                    <span className="rounded-full bg-[#fff0f2] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#e31b2d]">
                                      Sale price
                                    </span>
                                  )}
                                </div>
                              </div>


                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    item,
                                  )
                                }
                                aria-label={`Remove ${item.name} from cart`}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9dfe4] text-[#b4232f] transition hover:border-[#efc2c7] hover:bg-[#fff2f3]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>


                            <div className="mt-auto flex flex-col gap-5 border-t border-[#edf0f2] pt-5 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8b96a0]">
                                  Unit price
                                </p>


                                <div className="mt-1 flex items-end gap-2">
                                  <span className="text-[21px] font-black tracking-[-0.04em]">
                                    {formatMoney(
                                      unitPrice,
                                    )}
                                  </span>


                                  {item.sale_price !==
                                    null && (
                                    <span className="pb-1 text-[9px] font-semibold text-[#9ca6af] line-through">
                                      {formatMoney(
                                        item.price,
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>


                              <div className="flex items-end gap-5">
                                <div>
                                  <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.12em] text-[#8b96a0]">
                                    Quantity
                                  </p>


                                  <div className="flex h-11 items-center overflow-hidden rounded-xl border border-[#d9dfe4] bg-[#fafbfc]">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeQuantity(
                                          item,
                                          item.quantity -
                                            1,
                                        )
                                      }
                                      aria-label={`Decrease quantity of ${item.name}`}
                                      className="flex h-full w-10 items-center justify-center text-[#56636e] transition hover:bg-white hover:text-[#e31b2d]"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>


                                    <div className="flex h-full min-w-12 items-center justify-center border-x border-[#e1e5e9] bg-white px-3 text-[10px] font-black">
                                      {item.quantity}
                                    </div>


                                    <button
                                      type="button"
                                      disabled={
                                        item.quantity >=
                                        item.stock_quantity
                                      }
                                      onClick={() =>
                                        changeQuantity(
                                          item,
                                          item.quantity +
                                            1,
                                        )
                                      }
                                      aria-label={`Increase quantity of ${item.name}`}
                                      className="flex h-full w-10 items-center justify-center text-[#56636e] transition hover:bg-white hover:text-[#e31b2d] disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>


                                <div className="min-w-[110px] text-right">
                                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8b96a0]">
                                    Line total
                                  </p>

                                  <p className="mt-1 text-[21px] font-black tracking-[-0.04em] text-[#e31b2d]">
                                    {formatMoney(
                                      lineTotal,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  },
                )}
              </div>
            </div>


            {/* SUMMARY */}

            <aside className="lg:pt-[104px]">
              <div className="sticky top-[102px] overflow-hidden rounded-[28px] border border-[#dfe4e8] bg-white shadow-[0_24px_65px_rgba(15,30,45,0.075)]">
                <div className="border-b border-[#edf0f2] p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#071b2d] text-white">
                      <ShoppingBag className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#e31b2d]">
                        Order summary
                      </p>

                      <h3 className="mt-1 text-[18px] font-black tracking-[-0.03em]">
                        Cart total
                      </h3>
                    </div>
                  </div>
                </div>


                <div className="p-7">
                  <SummaryRow
                    label="Products"
                    value={
                      String(
                        distinctProducts,
                      )
                    }
                  />

                  <SummaryRow
                    label="Total units"
                    value={
                      String(
                        cartCount,
                      )
                    }
                  />


                  <div className="my-6 border-t border-[#e7ebee]" />


                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#8b96a0]">
                        Subtotal
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-[#8a959f]">
                        Before checkout details
                      </p>
                    </div>

                    <p className="text-[30px] font-black tracking-[-0.045em]">
                      {formatMoney(
                        subtotal,
                      )}
                    </p>
                  </div>


                  <Link
                    href="/checkout"
                    className="group mt-8 flex h-14 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-6 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-[0_16px_38px_rgba(227,27,45,0.2)] transition hover:bg-[#f32639]"
                  >
                    Proceed to checkout

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>


                  <Link
                    href="/shop"
                    className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce2e6] text-[9px] font-bold text-[#5c6974] transition hover:bg-[#fafbfc]"
                  >
                    Continue shopping
                  </Link>


                  <div className="mt-7 flex gap-3 rounded-2xl bg-[#f6f8fa] p-4">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#e31b2d]" />

                    <p className="text-[8px] leading-4 text-[#6f7c87]">
                      Final delivery and order details are completed in checkout.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}


        {/* ==================================================
            LOWER INFO
        ================================================== */}

        {hydrated &&
          items.length >
            0 && (
            <>
              <section className="mt-12 grid gap-5 md:grid-cols-3">
                <InfoCard
                  icon={
                    ShoppingCart
                  }
                  title="Quantity control"
                  description="Increase or decrease quantities while respecting the stock stored with each cart product."
                />

                <InfoCard
                  icon={
                    Package
                  }
                  title="Product access"
                  description="Open any item directly from the cart to review its full product page before checkout."
                />

                <InfoCard
                  icon={
                    ShieldCheck
                  }
                  title="Checkout next"
                  description="Your cart remains the source for quantities and subtotal when you continue into checkout."
                />
              </section>


              <section className="relative mt-10 overflow-hidden rounded-[30px] bg-[#071b2d] px-7 py-10 text-white sm:px-10 sm:py-12">
                <div className="pointer-events-none absolute right-[-80px] top-[-120px] h-[320px] w-[320px] rounded-full bg-[#e31b2d]/20 blur-[90px]" />


                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.22em] text-[#ff5967]">
                      <Sparkles className="h-4 w-4" />

                      Ready when you are
                    </div>


                    <h3 className="mt-4 max-w-[690px] text-[32px] font-black leading-[1.02] tracking-[-0.045em] sm:text-[42px]">
                      Review complete?
                      <span className="text-[#ff394a]">
                        {" "}
                        Continue the order.
                      </span>
                    </h3>


                    <p className="mt-4 max-w-[620px] text-[11px] leading-6 text-[#9eb0bf]">
                      Checkout will use the products and quantities currently stored in this cart.
                    </p>
                  </div>


                  <Link
                    href="/checkout"
                    className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#e31b2d] px-7 text-[9px] font-black uppercase tracking-[0.1em] shadow-[0_14px_34px_rgba(227,27,45,0.22)]"
                  >
                    Checkout

                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </section>
            </>
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


function NavbarLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={
        href
      }
      className="relative py-2 text-[10px] font-bold text-[#b5c2cd] transition hover:text-white"
    >
      {label}
    </Link>
  );
}


function HeroStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4">
      <div className="text-[20px] font-black tracking-[-0.04em]">
        {value}
      </div>

      <div className="mt-1 text-[7px] font-black uppercase tracking-[0.16em] text-[#899dae]">
        {label}
      </div>
    </div>
  );
}


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
    <div className="flex min-h-[132px] items-center gap-4 px-2 py-6 md:px-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3f5f7] text-[#e31b2d]">
        <Icon className="h-4 w-4" />
      </div>


      <div className="min-w-0">
        <div className="truncate text-[18px] font-black tracking-[-0.035em]">
          {value}
        </div>

        <div className="mt-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-[#44515c]">
          {label}
        </div>

        <div className="mt-1 line-clamp-1 text-[7px] text-[#89949e]">
          {detail}
        </div>
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
    <div className="mb-4 flex items-center justify-between gap-4 text-[10px]">
      <span className="text-[#78858f]">
        {label}
      </span>

      <span className="font-black text-[#1a2731]">
        {value}
      </span>
    </div>
  );
}


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

