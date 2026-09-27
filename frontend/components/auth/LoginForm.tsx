"use client";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  motion,
} from "framer-motion";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  ApiError,
  getCurrentUser,
  loginUser,
} from "@/lib/api";

import {
  saveAccessToken,
} from "@/lib/auth";


export default function LoginForm() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    try {
      setLoading(true);

      const result =
        await loginUser({
          email:
            email.trim(),

          password,
        });

      saveAccessToken(
        result.access_token,
      );


      const currentUser =
        await getCurrentUser(
          result.access_token,
        );


      router.replace(
        currentUser.role ===
          "admin"
          ? "/admin"
          : "/",
      );
    } catch (err) {
      if (
        err instanceof ApiError
      ) {
        setError(
          err.status === 401
            ? "Invalid email or password."
            : err.message,
        );
      } else {
        setError(
          "Unable to connect to Vehnexa. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <section
      className="
        flex min-h-dvh flex-1
        items-center justify-center
        bg-[#f5f7fa]
        px-5 py-8
        sm:px-8
        lg:px-10
        xl:px-14
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          x: 18,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="
          w-full
          max-w-[530px]
        "
      >
        <MobileBrand />

        <AuthTabs active="login" />

        {/* HEADER */}
        <div className="mt-9">
          <p
            className="
              text-[11px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-red-600
            "
          >
            Account Access
          </p>

          <h1
            className="
              mt-2
              text-[40px]
              font-bold
              leading-[1.05]
              tracking-[-0.045em]
              text-[#111827]
              sm:text-[48px]
            "
          >
            Welcome back.
          </h1>

          <p
            className="
              mt-3
              max-w-[460px]
              text-sm
              leading-6
              text-slate-500
            "
          >
            Sign in to access your garage, compatible parts,
            orders and Vehnexa AI Mechanic.
          </p>
        </div>

        {/* FORM CARD */}
        <div
          className="
            mt-7
            rounded-3xl
            border
            border-slate-200/80
            bg-white
            p-5
            shadow-[0_20px_55px_rgba(15,23,42,.07)]
            sm:p-7
          "
        >
          {/* SECURITY NOTICE */}
          <div
            className="
              mb-5
              flex items-center
              gap-3
              rounded-2xl
              bg-slate-50
              px-4 py-3.5
            "
          >
            <div
              className="
                flex h-9 w-9
                items-center
                justify-center
                rounded-xl
                bg-white
                shadow-sm
              "
            >
              <ShieldCheck
                className="
                  h-[18px]
                  w-[18px]
                  text-red-600
                "
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                Secure account access
              </p>

              <p
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-500
                "
              >
                Your garage and account data stay tied to your profile.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* EMAIL */}
            <label className="block">
              <span
                className="
                  mb-1.5 block
                  text-[13px]
                  font-medium
                  text-slate-700
                "
              >
                Email address
              </span>

              <div className="relative">
                <Mail
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  required
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  className="
                    h-11 w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    pl-10 pr-3.5
                    text-sm
                    text-[#111827]
                    outline-none
                    transition
                    placeholder:text-slate-400
                    hover:border-slate-300
                    focus:border-red-400
                    focus:ring-4
                    focus:ring-red-50
                  "
                />
              </div>
            </label>

            {/* PASSWORD */}
            <label className="block">
              <div
                className="
                  mb-1.5
                  flex items-center
                  justify-between
                "
              >
                <span
                  className="
                    text-[13px]
                    font-medium
                    text-slate-700
                  "
                >
                  Password
                </span>

                <span
                  className="
                    text-[11px]
                    font-medium
                    text-slate-400
                  "
                >
                  Minimum 8 characters
                </span>
              </div>

              <div className="relative">
                <LockKeyhole
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  required
                  minLength={8}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  className="
                    h-11 w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    pl-10 pr-11
                    text-sm
                    text-[#111827]
                    outline-none
                    transition
                    placeholder:text-slate-400
                    hover:border-slate-300
                    focus:border-red-400
                    focus:ring-4
                    focus:ring-red-50
                  "
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  className="
                    absolute
                    right-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition
                    hover:text-slate-700
                  "
                >
                  {showPassword ? (
                    <EyeOff
                      className="
                        h-4 w-4
                      "
                    />
                  ) : (
                    <Eye
                      className="
                        h-4 w-4
                      "
                    />
                  )}
                </button>
              </div>
            </label>

            {/* ERROR */}
            {error && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4 py-3
                  text-sm
                  text-red-700
                "
              >
                {error}
              </div>
            )}

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="
                group
                flex h-12 w-full
                items-center
                justify-between
                rounded-xl
                bg-red-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-[0_8px_20px_rgba(220,38,38,.18)]
                transition
                hover:bg-red-700
                focus:outline-none
                focus:ring-4
                focus:ring-red-100
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <span>
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </span>

              {loading ? (
                <Loader2
                  className="
                    h-5 w-5
                    animate-spin
                  "
                />
              ) : (
                <ArrowRight
                  className="
                    h-5 w-5
                    transition-transform
                    group-hover:translate-x-1
                  "
                />
              )}
            </button>
          </form>
        </div>

        {/* REGISTER */}
        <p
          className="
            mt-6
            text-center
            text-sm
            text-slate-500
          "
        >
          New to Vehnexa?{" "}
          <Link
            href="/register"
            className="
              font-semibold
              text-[#111827]
              transition
              hover:text-red-600
            "
          >
            Create account
          </Link>
        </p>

        <p
          className="
            mt-5
            text-center
            text-[11px]
            text-slate-400
          "
        >
          Secure access · Personal garage · AI assistance
        </p>
      </motion.div>
    </section>
  );
}


function AuthTabs({
  active,
}: {
  active: "login" | "register";
}) {
  return (
    <div
      className="
        flex
        border-b
        border-slate-200
      "
    >
      <Link
        href="/login"
        className={`
          relative
          px-4 pb-3
          text-sm
          font-semibold
          transition
          ${
            active === "login"
              ? "text-[#111827]"
              : "text-slate-400 hover:text-slate-700"
          }
        `}
      >
        Login

        {active === "login" && (
          <span
            className="
              absolute
              inset-x-0
              bottom-[-1px]
              h-0.5
              rounded-full
              bg-red-600
            "
          />
        )}
      </Link>

      <Link
        href="/register"
        className={`
          relative
          px-4 pb-3
          text-sm
          font-semibold
          transition
          ${
            active === "register"
              ? "text-[#111827]"
              : "text-slate-400 hover:text-slate-700"
          }
        `}
      >
        Create Account

        {active === "register" && (
          <span
            className="
              absolute
              inset-x-0
              bottom-[-1px]
              h-0.5
              rounded-full
              bg-red-600
            "
          />
        )}
      </Link>
    </div>
  );
}


function MobileBrand() {
  return (
    <div
      className="
        mb-8
        flex items-center
        gap-3
        lg:hidden
      "
    >
      <div
        className="
          flex h-10 w-10
          items-center justify-center
          rounded-xl
          bg-red-600
        "
      >
        <span
          className="
            -skew-x-6
            text-lg
            font-black
            text-white
          "
        >
          V
        </span>
      </div>

      <div>
        <p
          className="
            text-lg
            font-black
            tracking-[-0.03em]
            text-[#111827]
          "
        >
          Vehnexa
        </p>

        <p
          className="
            text-[7px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-slate-400
          "
        >
          Drive smarter
        </p>
      </div>
    </div>
  );
}