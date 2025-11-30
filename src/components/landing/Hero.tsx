"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Github, ArrowRight } from "lucide-react";
import { Card } from "../ui/card";

export function Hero() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-grid-pattern">
      <div className="absolute inset-0 z-0 pointer-events-none" 
           style={{
             background: "radial-gradient(ellipse at 50% 50%, hsl(var(--background)/0) 0%, hsl(var(--background)) 90%)"
           }} />
      
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center px-4"
      >
        <motion.div 
          className="mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-sm text-primary-foreground">Sekarang dengan pesan commit berbasis AI</p>
        </motion.div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          Percepat Alur Kerja
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground">
            GitHub Anda
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground">
          GitAssist menggunakan AI untuk mengotomatiskan pesan commit Anda, menangani unggahan massal dengan mulus, dan menyederhanakan manajemen repositori.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="group">
            <Link href="/dashboard">
              Mulai <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-transparent text-neutral-200 border-neutral-700 hover:bg-neutral-800 hover:text-white">
            <a href="https://github.com/mhafizhdsy-netizen/GitAssist" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" /> View Source Code
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
