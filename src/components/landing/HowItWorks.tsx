"use client";

import { motion } from "framer-motion";
import { LogIn, AppWindow, Sparkles, Send } from "lucide-react";
import { Card } from "../ui/card";

const steps = [
  {
    icon: LogIn,
    title: "1. Autentikasi Cepat",
    description: "Hubungkan akun GitHub Anda dengan aman hanya dengan satu klik untuk memulai.",
  },
  {
    icon: AppWindow,
    title: "2. Pilih Fitur Anda",
    description: "Pilih tugas yang ingin Anda lakukan, mulai dari Commit file, membuat Issue, hingga merilis versi baru.",
  },
  {
    icon: Sparkles,
    title: "3. Isi & Sempurnakan",
    description: "Lengkapi detail yang diperlukan dan biarkan asisten AI kami membantu menyempurnakan deskripsi Anda.",
  },
  {
    icon: Send,
    title: "4. Eksekusi & Selesai",
    description: "Kirim perubahan Anda langsung ke GitHub. Commit, Issue, atau Rilis Anda berhasil dibuat!",
  },
];

export function HowItWorks() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section id="how-it-works" className="container py-24 sm:py-32">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold">Empat Langkah Sederhana</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Dari login hingga eksekusi tugas GitHub dalam waktu kurang dari satu menit. Begini cara kerjanya.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {steps.map((step, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="p-8 text-center h-full bg-background/50 hover:border-primary/30 transition-colors duration-300">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <step.icon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mt-4">{step.title}</h3>
              <p className="text-muted-foreground mt-2">{step.description}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
