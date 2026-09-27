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


export default function AdminLogoutButton() {
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
    <div className="border-t border-white/10 p-4">
      <button
        type="button"
        onClick={
          logout
        }
        className="flex h-10 w-full items-center justify-center gap-2 rounded-[7px] border border-white/15 text-[9px] font-semibold text-[#d0d5dd] transition hover:border-[#ef3d43]/50 hover:bg-[#ef3d43]/10 hover:text-white"
      >
        <LogOut className="h-3.5 w-3.5" />

        Sign out
      </button>
    </div>
  );
}
