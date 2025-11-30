
"use client";

import { motion } from "framer-motion";
import { FAQ_ITEMS } from "@/lib/constants";
import { Card } from "../ui/card";

export function FAQ() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <section id="faq" className="container py-24 sm:py-32">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold font-headline">
          Pertanyaan yang Sering Diajukan
        </h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          Punya pertanyaan? Kami punya jawabannya. Jika Anda tidak menemukan
          jawaban di sini, jangan ragu untuk menghubungi kami.
        </p>
      </div>

      <motion.div
        className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {FAQ_ITEMS.map((item, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="glass-card p-6 h-full transition-all duration-300 hover:border-primary/50 hover:bg-card">
              <h3 className="font-bold text-lg text-primary">{item.question}</h3>
              <p className="mt-2 text-muted-foreground text-sm">
                {item.answer}
              </p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
