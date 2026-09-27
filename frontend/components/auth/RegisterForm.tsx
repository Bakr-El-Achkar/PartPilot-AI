"use client";

import Link from "next/link";

import {
  FormEvent,
  ReactNode,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  ApiError,
  registerUser,
} from "@/lib/api";


type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};


const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};


export default function RegisterForm() {
  const [form, setForm] =
    useState<FormState>(initialState);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");


    if (
      form.firstName
        .trim()
        .length < 2
    ) {
      setError(
        "Please enter a valid first name.",
      );

      return;
    }


    if (
      form.lastName
        .trim()
        .length < 2
    ) {
      setError(
        "Please enter a valid last name.",
      );

      return;
    }


    if (
      form.password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters.",
      );

      return;
    }


    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );

      return;
    }


    try {
      setLoading(true);

      const user =
        await registerUser({
          first_name:
            form.firstName.trim(),

          last_name:
            form.lastName.trim(),

          email:
            form.email.trim(),

          phone:
            form.phone.trim() ||
            undefined,

          password:
            form.password,
        });


      setSuccess(
        `Account created successfully. Welcome to Vehnexa, ${user.first_name}.`,
      );

      setForm(initialState);
    } catch (err) {
      if (
        err instanceof ApiError
      ) {
        setError(
          err.message,
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
          max-w-[560px]
        "
      >
        <MobileBrand />

        <AuthTabs active="register" />

        {/* HEADER */}
        <div className="mt-8">
          <p
            className="
              text-[11px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-red-600
            "
          >
            Welcome to Vehnexa
          </p>

          <h1
            className="
              mt-2
              text-[38px]
              font-bold
              leading-[1.06]
              tracking-[-0.045em]
              text-[#111827]
              sm:text-[46px]
            "
          >
            Create your account.
          </h1>

          <p
            className="
              mt-3
              max-w-[500px]
              text-sm
              leading-6
              text-slate-500
            "
          >
            Save your vehicles, discover compatible parts
            and unlock AI-assisted automotive guidance.
          </p>
        </div>

        {/* FORM CARD */}
        <div
          className="
            mt-7
            rounded-3xl
            border border-slate-200/80
            bg-white
            p-5
            shadow-[0_20px_55px_rgba(15,23,42,.07)]
            sm:p-7
          "
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* NAMES */}
            <div
              className="
                grid gap-4
                sm:grid-cols-2
              "
            >
              <InputField
                label="First name"
                value={form.firstName}
                placeholder="Bakr"
                icon={
                  <UserRound />
                }
                autoComplete="given-name"
                onChange={(value) =>
                  updateField(
                    "firstName",
                    value,
                  )
                }
              />

              <InputField
                label="Last name"
                value={form.lastName}
                placeholder="El Achkar"
                icon={
                  <UserRound />
                }
                autoComplete="family-name"
                onChange={(value) =>
                  updateField(
                    "lastName",
                    value,
                  )
                }
              />
            </div>

            {/* EMAIL */}
            <InputField
              label="Email address"
              type="email"
              value={form.email}
              placeholder="you@example.com"
              icon={
                <Mail />
              }
              autoComplete="email"
              onChange={(value) =>
                updateField(
                  "email",
                  value,
                )
              }
            />

            {/* PHONE */}
            <InputField
              label="Phone number"
              type="tel"
              value={form.phone}
              placeholder="+961 70 123 456"
              icon={
                <Phone />
              }
              required={false}
              autoComplete="tel"
              onChange={(value) =>
                updateField(
                  "phone",
                  value,
                )
              }
            />

            {/* PASSWORDS */}
            <div
              className="
                grid gap-4
                sm:grid-cols-2
              "
            >
              <PasswordField
                label="Password"
                value={form.password}
                show={showPassword}
                autoComplete="new-password"
                onToggle={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
                onChange={(value) =>
                  updateField(
                    "password",
                    value,
                  )
                }
              />

              <PasswordField
                label="Confirm password"
                value={
                  form.confirmPassword
                }
                show={showPassword}
                autoComplete="new-password"
                onToggle={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
                onChange={(value) =>
                  updateField(
                    "confirmPassword",
                    value,
                  )
                }
              />
            </div>

            {/* TERMS */}
            <div
              className="
                flex items-start gap-3
                rounded-2xl
                bg-slate-50
                px-4 py-3.5
              "
            >
              <ShieldCheck
                className="
                  mt-0.5
                  h-4 w-4
                  shrink-0
                  text-slate-400
                "
              />

              <p
                className="
                  text-[11px]
                  leading-5
                  text-slate-500
                "
              >
                By creating an account, you agree to
                Vehnexa&apos;s terms. AI diagnostic guidance
                is assistive and does not replace a
                professional mechanical inspection.
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <StatusMessage
                type="error"
                message={error}
              />
            )}

            {/* SUCCESS */}
            {success && (
              <StatusMessage
                type="success"
                message={success}
              />
            )}

            {/* SUBMIT */}
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
                  ? "Creating account..."
                  : "Create account"}
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

        {/* LOGIN LINK */}
        <p
          className="
            mt-6
            text-center
            text-sm
            text-slate-500
          "
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="
              font-semibold
              text-[#111827]
              transition
              hover:text-red-600
            "
          >
            Sign in
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
          Secure account · Vehicle compatibility · AI assistance
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


function InputField({
  label,
  value,
  placeholder,
  icon,
  onChange,
  type = "text",
  required = true,
  autoComplete,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: ReactNode;
  onChange: (
    value: string,
  ) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-1.5 block
          text-[13px]
          font-medium
          text-slate-700
        "
      >
        {label}
      </span>

      <div className="relative">
        <div
          className="
            absolute
            left-3.5
            top-1/2
            -translate-y-1/2
            text-slate-400
            [&>svg]:h-4
            [&>svg]:w-4
          "
        >
          {icon}
        </div>

        <input
          required={required}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) =>
            onChange(
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
  );
}


function PasswordField({
  label,
  value,
  show,
  onToggle,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (
    value: string,
  ) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-1.5 block
          text-[13px]
          font-medium
          text-slate-700
        "
      >
        {label}
      </span>

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
            show
              ? "text"
              : "password"
          }
          value={value}
          placeholder="••••••••"
          autoComplete={autoComplete}
          onChange={(event) =>
            onChange(
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
          onClick={onToggle}
          aria-label={
            show
              ? "Hide password"
              : "Show password"
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
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}


function StatusMessage({
  type,
  message,
}: {
  type:
    | "error"
    | "success";
  message: string;
}) {
  const isSuccess =
    type === "success";

  return (
    <div
      className={`
        flex items-start
        gap-3
        rounded-xl
        border
        px-4 py-3
        text-sm
        ${
          isSuccess
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }
      `}
    >
      {isSuccess && (
        <CheckCircle2
          className="
            mt-0.5
            h-4 w-4
            shrink-0
          "
        />
      )}

      {message}
    </div>
  );
}