"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpenText, MessageCircle, Radar } from "lucide-react";

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const pillars = [
  {
    title: "Katalog Digital",
    description:
      "Akses informasi komoditas, mutu, dan ketersediaan hasil tani dalam satu tampilan yang rapi.",
    icon: BookOpenText,
  },
  {
    title: "Pantauan Real-time",
    description:
      "Pantau stok, harga, dan status distribusi dengan update cepat untuk keputusan yang tepat.",
    icon: Radar,
  },
  {
    title: "Forum Chat",
    description:
      "Diskusi langsung antara petani, mitra, dan distributor untuk koordinasi yang efisien.",
    icon: MessageCircle,
  },
];

export default function ModernLandingEnhancements() {
  return (
    <div className="space-y-16">
      <motion.section
        className="relative overflow-hidden rounded-[28px] border border-cyan-100 bg-cyan-50/80 p-6 sm:p-10"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
          viewBox="0 0 1200 500"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          {[120, 260, 420, 560, 760, 900, 1040].map((x, index) => (
            <motion.line
              key={`line-a-${x}`}
              x1={x}
              y1="40"
              x2={x - 90}
              y2="450"
              stroke="#0ea5a8"
              strokeWidth="1"
              strokeOpacity="0.28"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: index * 0.08 }}
            />
          ))}
          {[100, 320, 540, 780, 990].map((x, index) => (
            <motion.line
              key={`line-b-${x}`}
              x1={x}
              y1="90"
              x2={x + 180}
              y2="410"
              stroke="#06b6d4"
              strokeWidth="1"
              strokeOpacity="0.22"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.3 + index * 0.08 }}
            />
          ))}
          {[
            [120, 86],
            [210, 250],
            [320, 90],
            [450, 200],
            [560, 110],
            [700, 280],
            [820, 130],
            [960, 210],
            [1040, 92],
          ].map(([cx, cy], index) => (
            <motion.circle
              key={`dot-${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="4"
              fill="#06b6d4"
              fillOpacity="0.6"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.45, 0.9, 0.45],
              }}
              transition={{
                duration: 2.6,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.22,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>

        <div className="relative z-10 max-w-3xl">
          <motion.p
            className="mb-4 inline-flex rounded-full bg-white/75 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-cyan-700"
            variants={revealUp}
          >
            PLATFORM SMART FARMING
          </motion.p>
          <motion.h1
            className="text-balance text-3xl font-bold leading-tight text-slate-900 sm:text-5xl"
            variants={revealUp}
          >
            Wawasan Real-time untuk Hasil Panen Maksimal
          </motion.h1>
          <motion.p
            className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg"
            variants={revealUp}
          >
            Platform Smart Farming untuk menghubungkan petani dan distributor
            besar di Lampung. Pantau stok, validasi kualitas, dan percepat
            transaksi dalam satu dashboard yang ringkas.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            variants={revealUp}
          >
            <button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Mulai Jelajah
            </button>
            <button className="rounded-full border border-cyan-500 bg-white/80 px-5 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100">
              Pelajari Fitur
            </button>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="grid gap-5 md:grid-cols-3"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;

          return (
            <motion.article
              key={pillar.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              <div className="mb-4 inline-flex rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                <Icon size={34} strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {pillar.description}
              </p>
            </motion.article>
          );
        })}
      </motion.section>

      <motion.section
        className="grid items-center gap-7 rounded-[28px] bg-white/80 p-5 sm:p-7 lg:grid-cols-2 lg:p-9"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/Gambar1.webp"
            alt="Panen modern dengan dukungan teknologi"
            width={1100}
            height={780}
            className="h-80 w-full rounded-3xl object-cover lg:h-95"
            priority
            sizes="(max-width: 1024px) 100vw, 550px"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Overview
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            Transparansi data dan kualitas terstandar untuk pasar besar
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            InfoTani membantu rantai pasok berjalan lebih transparan dari kebun
            hingga pasar. Dengan standar kualitas yang sama untuk setiap
            komoditas, mitra besar dapat melakukan verifikasi lebih cepat tanpa
            kebingungan data.
          </p>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            implementasi awal
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}