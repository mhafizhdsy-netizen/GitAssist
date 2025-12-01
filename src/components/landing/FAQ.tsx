
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQ_ITEMS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = FAQ_ITEMS[activeIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
      {/* Kolom Kiri: Daftar Pertanyaan */}
      <div className="lg:col-span-1">
        <h3 className="text-xl font-semibold mb-4 px-4">Topik Pertanyaan</h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-full text-left p-4 rounded-lg transition-all duration-300 flex items-center justify-between",
                "hover:bg-primary/10",
                activeIndex === index
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <span>{item.question}</span>
              <ChevronRight className={cn("h-5 w-5 transition-transform duration-300", activeIndex === index ? "translate-x-1" : "")} />
            </button>
          ))}
        </div>
      </div>

      {/* Kolom Kanan: Jawaban */}
      <div className="lg:col-span-2">
        <Card className="glass-card sticky top-24">
          <CardContent className="p-8 md:p-10 min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <HelpCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground mt-1.5">
                    {activeItem.question}
                    </h3>
                </div>
                <p className="text-base lg:text-lg leading-relaxed text-muted-foreground">
                  {activeItem.answer}
                </p>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
