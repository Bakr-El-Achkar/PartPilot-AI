"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  UserRound,
} from "lucide-react";

import {
  ApiError,
  getCurrentUser,
} from "@/lib/api";

import {
  getAccessToken,
  removeAccessToken,
} from "@/lib/auth";

import NavbarNotificationBell from "@/components/notifications/NavbarNotificationBell";

import CustomerLogoutButton from "@/components/customer/CustomerLogoutButton";


type SessionState =
  | "checking"
  | "guest"
  | "customer"
  | "hidden";


export default function PublicNavbarAuthActions() {
  const [
    state,
    setState,
  ] =
    useState<SessionState>(
      "checking",
    );


  useEffect(() => {
    let cancelled =
      false;


    const timer =
      window.setTimeout(
        () => {
          async function load() {
            const token =
              getAccessToken();


            if (!token) {
              if (
                !cancelled
              ) {
                setState(
                  "guest",
                );
              }


              return;
            }


            try {
              const user =
                await getCurrentUser(
                  token,
                );


              if (
                cancelled
              ) {
                return;
              }


              setState(
                user.role ===
                  "admin"
                  ? "hidden"
                  : "customer",
              );

            } catch (
              error
            ) {
              if (
                error instanceof
                  ApiError &&
                (
                  error.status ===
                    401 ||
                  error.status ===
                    403
                )
              ) {
                removeAccessToken();
              }


              if (
                !cancelled
              ) {
                setState(
                  "guest",
                );
              }
            }
          }


          void load();
        },
        0,
      );


    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timer,
      );
    };
  }, []);


  if (
    state ===
      "checking" ||
    state ===
      "hidden"
  ) {
    return (
      <div className="h-9 w-[120px]" />
    );
  }


  if (
    state ===
    "guest"
  ) {
    return (
      <div className="ml-2 flex items-center gap-2">
        <Link
          href="/login"
          className="flex h-8 items-center justify-center rounded-[5px] px-3 text-[9px] font-semibold text-[#d0d9e2] transition hover:bg-white/[0.06] hover:text-white"
        >
          Login
        </Link>

        <Link
          href="/register"
          className="flex h-8 items-center justify-center rounded-[5px] bg-[#e31b2d] px-3.5 text-[9px] font-semibold text-white transition hover:bg-[#c91727]"
        >
          Create account
        </Link>
      </div>
    );
  }


  return (
    <div className="flex items-center gap-1">
      <NavbarNotificationBell />

      <Link
        href="/account"
        aria-label="Account"
        title="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#c4ced7] transition hover:bg-white/[0.06] hover:text-white"
      >
        <UserRound className="h-[16px] w-[16px]" />
      </Link>

      <CustomerLogoutButton />
    </div>
  );
}
