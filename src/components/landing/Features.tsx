
"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FEATURES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconColorClasses: { [key: string]: string } = {
    purple: "text-purple-400 bg-purple-900/20 border-purple-500/30",
    blue: "text-blue-400 bg-blue-900/20 border-blue-500/30",
    green: "text-green-400 bg-green-900/20 border-green-500/30",
    pink: "text-pink-400 bg-pink-900/20 border-pink-500/30",
    yellow: "text-yellow-400 bg-yellow-900/20 border-yellow-500/30",
    indigo: "text-indigo-400 bg-indigo-900/20 border-indigo-500/30",
};

export function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <section id="features" className="container py-24 sm:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-bold">Mengapa Anda Akan Menyukai GitAssist</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Semua yang Anda butuhkan untuk merampingkan alur kerja pengembangan Anda dan fokus pada hal yang paling penting: membuat kode.
        </p>
      </div>

      <motion.div
        className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-transparent border-white/10 hover:bg-white/5 transition-colors group">
                <CardHeader>
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center border", iconColorClasses[feature.color])}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl pt-4">{feature.title}</CardTitle>
                  <CardDescription className="pt-1">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
