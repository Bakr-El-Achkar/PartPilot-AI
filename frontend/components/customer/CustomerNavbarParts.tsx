"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { CART_UPDATED_EVENT, getCartCount } from "@/lib/cart";


export function CustomerNavbarBrand() {
  return (
    <Link
      href="/"
      aria-label="Vehnexa home"
      className="group flex shrink-0 items-center gap-2.5"
    >
      <span className="relative h-[25px] w-[30px] shrink-0" aria-hidden="true">
        <span
          className="absolute left-0 top-[2px] h-[18px] w-[12px] bg-[#f03a45]"
          style={{
            clipPath: "polygon(0 0, 100% 0, 66% 100%, 42% 100%)",
            transform: "skewX(7deg)",
          }}
        />
        <span
          className="absolute left-[8px] top-[5px] h-[18px] w-[13px] bg-[#f08c2e]"
          style={{
            clipPath: "polygon(0 0, 100% 0, 52% 100%, 30% 100%)",
            transform: "skewX(-4deg)",
          }}
        />
        <span
          className="absolute right-0 top-[2px] h-[20px] w-[16px] bg-[#d9e1e8]"
          style={{
            clipPath: "polygon(12% 0, 100% 0, 53% 100%, 0 100%)",
            transform: "skewX(-7deg)",
          }}
        />
      </span>
      <span className="text-[14px] font-black tracking-[-0.025em] text-white">
        Vehnexa
      </span>
    </Link>
  );
}


const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/account/garage", label: "My Garage" },
  { href: "/ai-mechanic", label: "AI Mechanic" },
  { href: "/orders", label: "Orders" },
  { href: "/#resources", label: "Resources" },
];

export function CustomerNavbarLinks() {
  const pathname = usePathname();

  return (
    <nav className="ml-10 hidden h-full items-center gap-8 lg:flex" aria-label="Customer navigation">
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href ||
          (href === "/shop" && pathname.startsWith("/product/")) ||
          (href !== "/shop" && pathname.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group relative h-full items-center text-[9px] font-semibold transition ${
              href === "/#resources" ? "hidden xl:flex" : "flex"
            } ${
              active ? "text-white" : "text-[#bcc9d3] hover:text-white"
            }`}
          >
            {label}
            <span className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 bg-[#e31b2d] transition-all duration-300 ${
              active ? "w-full" : "w-0 group-hover:w-full"
            }`} />
          </Link>
        );
      })}
    </nav>
  );
}


export function CustomerNavbarCart({ count }: { count?: number }) {
  const [storedCount, setStoredCount] = useState(0);

  useEffect(() => {
    if (count !== undefined) {
      return;
    }
    const refresh = () => setStoredCount(getCartCount());
    refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [count]);

  const cartCount = count ?? storedCount;

  return (
    <Link
      href="/cart"
      aria-label={`Cart with ${cartCount} items`}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#c7d3dc] transition hover:bg-white/[0.06] hover:text-white"
    >
      <ShoppingCart className="h-[16px] w-[16px]" />
      {cartCount > 0 && (
        <span className="absolute right-0 top-0 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#e31b2d] px-1 text-[7px] font-black leading-none text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
}
