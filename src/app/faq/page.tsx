
'use client';

import { FAQ } from "@/components/landing/FAQ";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
  return (
    <motion.div
        className="container py-24 sm:py-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline">
                Ada Pertanyaan?
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Temukan jawaban untuk pertanyaan yang paling sering diajukan tentang GitAssist.
            </p>
        </div>
        <FAQ />
      </motion.div>
  );
}
