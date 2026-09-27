"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import {
  Bot,
  CarFront,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";


const highlights = [
  {
    icon: ShieldCheck,
    title: "Trusted Brands",
    description:
      "Shop quality automotive parts from trusted and recognizable brands.",
  },
  {
    icon: Wrench,
    title: "Smarter Maintenance",
    description:
      "Use vehicle compatibility to find parts designed for your car.",
  },
  {
    icon: Bot,
    title: "AI Mechanic",
    description:
      "Describe your vehicle symptoms and get intelligent guidance.",
  },
];


export default function AutomotiveHero() {
  return (
    <section
      className="
        relative hidden min-h-dvh overflow-hidden
        bg-[#06101d]
        lg:flex lg:w-[52%] lg:flex-col
      "
    >
      {/* =========================================================
          BACKGROUND CAR
      ========================================================= */}
      <div className="absolute inset-0">
        <Image
          src="/images/partpilot-hero-car.jpg"
          alt="Vehnexa performance vehicle"
          fill
          priority
          sizes="52vw"
          className="
            object-cover
            object-[58%_center]
            brightness-90
            contrast-110
            saturate-110
          "
        />

        {/* Main light darkening layer */}
        <div className="absolute inset-0 bg-[#06101d]/28" />

        {/* Darker area behind text */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-r
            from-[#06101d]/90
            via-[#06101d]/48
            to-[#06101d]/12
          "
        />

        {/* Keep header readable */}
        <div
          className="
            absolute inset-x-0 top-0
            h-[150px]
            bg-gradient-to-b
            from-[#06101d]/90
            via-[#06101d]/45
            to-transparent
          "
        />

        {/* Keep footer/features readable */}
        <div
          className="
            absolute inset-x-0 bottom-0
            h-[300px]
            bg-gradient-to-t
            from-[#06101d]/95
            via-[#06101d]/58
            to-transparent
          "
        />
      </div>


      {/* =========================================================
          DECORATIVE EFFECTS
      ========================================================= */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          opacity-[0.035]
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div
        className="
          pointer-events-none
          absolute -left-28 top-[28%]
          h-[360px] w-[360px]
          rounded-full
          bg-red-600/10
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute right-[-120px] top-[34%]
          h-[320px] w-[320px]
          rounded-full
          bg-blue-500/[0.06]
          blur-[120px]
        "
      />


      {/* =========================================================
          HEADER
      ========================================================= */}
      <header
        className="
          relative z-30
          flex items-center justify-between
          px-10 pt-9
          xl:px-14
        "
      >
        <Brand />

        <div
          className="
            flex items-center gap-2
            rounded-full
            border border-white/10
            bg-[#0c1826]/60
            px-4 py-2
            shadow-[0_10px_30px_rgba(0,0,0,.15)]
            backdrop-blur-xl
          "
        >
          <span className="relative flex h-2 w-2">
            <span
              className="
                absolute inline-flex
                h-full w-full
                animate-ping
                rounded-full
                bg-emerald-400
                opacity-30
              "
            />

            <span
              className="
                relative inline-flex
                h-2 w-2
                rounded-full
                bg-emerald-400
              "
            />
          </span>

          <span
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-white/70
            "
          >
            Platform Online
          </span>
        </div>
      </header>


      {/* =========================================================
          HERO CONTENT
      ========================================================= */}
      <div
        className="
          relative z-30
          flex flex-1 flex-col
          justify-center
          px-10
          pb-8
          pt-12
          xl:px-14
        "
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
          className="max-w-[620px]"
        >
          {/* Badge */}
          <div
            className="
              mb-5
              inline-flex
              items-center gap-2
              rounded-full
              border border-red-400/25
              bg-red-500/10
              px-3.5 py-1.5
              backdrop-blur-lg
            "
          >
            <Sparkles
              className="
                h-3.5 w-3.5
                text-red-400
              "
            />

            <span
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-red-300
              "
            >
              Smarter Automotive Ownership
            </span>
          </div>


          {/* Main title */}
          <h1
            className="
              max-w-[650px]
              text-[48px]
              font-bold
              leading-[0.98]
              tracking-[-0.05em]
              text-white
              drop-shadow-[0_4px_20px_rgba(0,0,0,.4)]
              xl:text-[58px]
              2xl:text-[66px]
            "
          >
            Same passion.
            <br />

            <span className="text-slate-300">
              A smarter way forward.
            </span>
          </h1>


          {/* Description */}
          <p
            className="
              mt-6
              max-w-[560px]
              text-[15px]
              leading-7
              text-slate-200
              drop-shadow-[0_2px_12px_rgba(0,0,0,.45)]
            "
          >
            Vehnexa connects your vehicle, intelligent diagnostics
            and compatible auto parts in one modern automotive
            platform.
          </p>
        </motion.div>


        {/* =====================================================
            FEATURE CARDS
        ===================================================== */}
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
            delay: 0.18,
            duration: 0.65,
            ease: "easeOut",
          }}
          className="
            mt-10
            grid
            max-w-[690px]
            grid-cols-3
            gap-3
          "
        >
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="
                  group
                  rounded-2xl
                  border
                  border-white/[0.11]
                  bg-[#071320]/78
                  p-4
                  shadow-[0_12px_35px_rgba(0,0,0,.18)]
                  backdrop-blur-xl
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:border-white/[0.18]
                  hover:bg-[#0a1927]/88
                "
              >
                <div
                  className="
                    mb-4
                    flex h-9 w-9
                    items-center justify-center
                    rounded-xl
                    border border-white/[0.06]
                    bg-white/[0.07]
                    transition
                    group-hover:bg-red-500/10
                  "
                >
                  <Icon
                    className="
                      h-[18px] w-[18px]
                      text-red-400
                    "
                  />
                </div>

                <p
                  className="
                    text-xs
                    font-semibold
                    text-white
                  "
                >
                  {item.title}
                </p>

                <p
                  className="
                    mt-1.5
                    text-[10px]
                    leading-[1.65]
                    text-slate-400
                  "
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </motion.div>
      </div>


      {/* =========================================================
          FOOTER
      ========================================================= */}
      <div
        className="
          relative z-30
          flex items-center justify-between
          border-t border-white/[0.08]
          bg-[#06101d]/60
          px-10 py-5
          backdrop-blur-lg
          xl:px-14
        "
      >
        <div
          className="
            flex items-center gap-2
            text-[10px]
            text-slate-400
          "
        >
          <div
            className="
              flex h-7 w-7
              items-center justify-center
              rounded-lg
              bg-red-500/10
            "
          >
            <CarFront
              className="
                h-3.5 w-3.5
                text-red-400
              "
            />
          </div>

          <span>
            Your vehicle. Your parts. Your next move.
          </span>
        </div>

        <span
          className="
            text-[9px]
            font-medium
            uppercase
            tracking-[0.2em]
            text-white/40
          "
        >
          Drive Smarter
        </span>
      </div>
    </section>
  );
}


/* =============================================================
   VEHNEXA BRAND
============================================================= */

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="
          flex h-11 w-11
          items-center justify-center
          rounded-xl
          bg-red-600
          shadow-[0_10px_30px_rgba(220,38,38,.28)]
        "
      >
        <span
          className="
            -skew-x-6
            text-xl
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
            text-[21px]
            font-black
            tracking-[-0.035em]
            text-white
          "
        >
          Vehnexa
        </p>

        <p
          className="
            mt-0.5
            text-[7px]
            font-semibold
            uppercase
            tracking-[0.24em]
            text-slate-400
          "
        >
          Parts · People · Smarter Drive
        </p>
      </div>
    </div>
  );
}