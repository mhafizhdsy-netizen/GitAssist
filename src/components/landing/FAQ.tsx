
"use client";

import { motion } from "framer-motion";
import { FAQ_ITEMS } from "@/lib/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
        className="max-w-3xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQ_ITEMS.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
                <AccordionItem value={`item-${index}`} className="glass-card border-white/10 rounded-xl transition-all duration-300 hover:border-primary/50 overflow-hidden">
                    <AccordionTrigger className="p-6 text-left font-bold text-lg hover:no-underline">
                        {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="px-6 pb-6 pt-0 text-muted-foreground">
                            {item.answer}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </motion.div>
            ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
