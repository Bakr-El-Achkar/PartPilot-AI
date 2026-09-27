"use client";

import {
  LogOut,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  removeAccessToken,
} from "@/lib/auth";


export default function CustomerLogoutButton() {
  const router =
    useRouter();


  function logout() {
    removeAccessToken();


    router.replace(
      "/login",
    );


    router.refresh();
  }


  return (
    <button
      type="button"
      onClick={
        logout
      }
      aria-label="Sign out"
      title="Sign out"
      className="flex h-9 w-9 items-center justify-center rounded-full text-[#c4ced7] transition hover:bg-white/[0.06] hover:text-white"
    >
      <LogOut className="h-[16px] w-[16px]" />
    </button>
  );
}
