"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  ApiError,
  getCurrentUser,
} from "@/lib/api";

import {
  getAccessToken,
  removeAccessToken,
} from "@/lib/auth";


type SessionRole =
  | "checking"
  | "guest"
  | "customer"
  | "admin"
  | "error";


export default function RoleAccessGuard({
  children,
}: {
  children:
    ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();


  const [
    role,
    setRole,
  ] =
    useState<SessionRole>(
      "checking",
    );


  const isAdminRoute =
    pathname ===
      "/admin" ||
    pathname.startsWith(
      "/admin/",
    );


  const isPublicRoute =
    pathname ===
      "/" ||
    pathname ===
      "/shop" ||
    pathname.startsWith(
      "/product/",
    ) ||
    pathname ===
      "/login" ||
    pathname ===
      "/register";


  const isProtectedCustomerRoute =
    pathname ===
      "/account" ||
    pathname.startsWith(
      "/account/",
    ) ||
    pathname ===
      "/orders" ||
    pathname.startsWith(
      "/orders/",
    ) ||
    pathname ===
      "/cart" ||
    pathname.startsWith(
      "/cart/",
    ) ||
    pathname ===
      "/checkout" ||
    pathname.startsWith(
      "/checkout/",
    ) ||
    pathname ===
      "/ai-mechanic" ||
    pathname.startsWith(
      "/ai-mechanic/",
    );


  useEffect(() => {
    let cancelled =
      false;


    const timer =
      window.setTimeout(
        () => {
          async function verify() {
            const token =
              getAccessToken();


            if (!token) {
              if (
                cancelled
              ) {
                return;
              }


              setRole(
                "guest",
              );


              if (
                isAdminRoute ||
                isProtectedCustomerRoute
              ) {
                router.replace(
                  "/login",
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


              if (
                user.role ===
                "admin"
              ) {
                setRole(
                  "admin",
                );


                if (
                  !isAdminRoute
                ) {
                  router.replace(
                    "/admin",
                  );
                }


                return;
              }


              setRole(
                "customer",
              );


              if (
                isAdminRoute
              ) {
                router.replace(
                  "/",
                );


                return;
              }


              if (
                pathname ===
                  "/login" ||
                pathname ===
                  "/register"
              ) {
                router.replace(
                  "/",
                );
              }

            } catch (
              verifyError
            ) {
              if (
                cancelled
              ) {
                return;
              }


              if (
                verifyError instanceof
                  ApiError &&
                (
                  verifyError.status ===
                    401 ||
                  verifyError.status ===
                    403
                )
              ) {
                removeAccessToken();

                setRole(
                  "guest",
                );


                if (
                  isAdminRoute ||
                  isProtectedCustomerRoute
                ) {
                  router.replace(
                    "/login",
                  );
                }


                return;
              }


              setRole(
                "error",
              );
            }
          }


          void verify();
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
  }, [
    pathname,
    router,
    isAdminRoute,
    isProtectedCustomerRoute,
  ]);


  /*
   * Public storefront pages must appear immediately.
   * Authentication is checked in the background.
   */
  if (
    isPublicRoute &&
    role ===
      "checking"
  ) {
    return (
      <>
        {
          children
        }
      </>
    );
  }


  if (
    role ===
    "checking"
  ) {
    return (
      <RoleLoadingScreen />
    );
  }


  if (
    role ===
      "admin" &&
    !isAdminRoute
  ) {
    return (
      <RoleLoadingScreen />
    );
  }


  if (
    role ===
      "customer" &&
    isAdminRoute
  ) {
    return (
      <RoleLoadingScreen />
    );
  }


  if (
    role ===
      "guest" &&
    (
      isAdminRoute ||
      isProtectedCustomerRoute
    )
  ) {
    return (
      <RoleLoadingScreen />
    );
  }


  if (
    role ===
    "error"
  ) {
    if (
      isPublicRoute
    ) {
      return (
        <>
          {
            children
          }
        </>
      );
    }


    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-5">
        <div className="rounded-[12px] border border-[#dfe3e8] bg-white p-7 text-center">
          <p className="text-[12px] font-bold text-[#101828]">
            Unable to verify your account
          </p>

          <p className="mt-2 text-[9px] text-[#667085]">
            Please refresh and try again.
          </p>
        </div>
      </main>
    );
  }


  return (
    <>
      {
        children
      }
    </>
  );
}


function RoleLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
      <div className="text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[9px] bg-[#071523] text-[17px] font-black italic text-white">
          V
        </div>

        <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#667085]">
          Loading Vehnexa
        </p>
      </div>
    </main>
  );
}
