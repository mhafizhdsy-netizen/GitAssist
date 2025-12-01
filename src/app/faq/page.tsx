
'use client';

import { FAQ } from "@/components/landing/FAQ";
import { motion } from "framer-motion";

export default function FAQPage() {
  return (
    <motion.div
        className="container py-24 sm:py-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">
            Ada Pertanyaan?
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Temukan jawaban untuk pertanyaan yang paling sering diajukan tentang GitAssist.
            </p>
        </div>
        <FAQ />
      </motion.div>
  );
}
