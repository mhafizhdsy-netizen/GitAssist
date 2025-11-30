"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FEATURES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const cardColorClasses: { [key: string]: string } = {
    purple: "border-purple-500/50 hover:border-purple-500",
    blue: "border-blue-500/50 hover:border-blue-500",
    green: "border-green-500/50 hover:border-green-500",
    pink: "border-pink-500/50 hover:border-pink-500",
    yellow: "border-yellow-500/50 hover:border-yellow-500",
    indigo: "border-indigo-500/50 hover:border-indigo-500",
};

const iconColorClasses: { [key: string]: string } = {
    purple: "text-purple-400",
    blue: "text-blue-400",
    green: "text-green-400",
    pink: "text-pink-400",
    yellow: "text-yellow-400",
    indigo: "text-indigo-400",
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
    <section id="features" className="container py-16">
      <div className="text-center">
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold">Why You'll Love GitAssist</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Everything you need to streamline your development workflow and focus on what matters: coding.
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
              <Card className={cn("h-full glass-card transition-all", cardColorClasses[feature.color])}>
                <CardHeader>
                  <div className="mb-4">
                    <Icon className={cn("h-10 w-10", iconColorClasses[feature.color])} />
                  </div>
                  <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                  <CardDescription className="pt-2">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
