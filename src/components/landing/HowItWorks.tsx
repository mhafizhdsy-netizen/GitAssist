"use client";

import { motion } from "framer-motion";
import { LogIn, Upload, GitBranch, Sparkles } from "lucide-react";

const steps = [
  {
    icon: LogIn,
    title: "Authenticate",
    description: "Securely connect your GitHub account in one click.",
  },
  {
    icon: Upload,
    title: "Upload Files",
    description: "Drag and drop your files or ZIP archives into the app.",
  },
  {
    icon: Sparkles,
    title: "Generate Message",
    description: "Use our AI assistant to generate the perfect commit message.",
  },
  {
    icon: GitBranch,
    title: "Commit to Repo",
    description: "Select your repository and commit your files directly.",
  },
];

export function HowItWorks() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="how-it-works" className="container py-16">
      <div className="text-center">
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold">Four Simple Steps</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          From login to commit in under a minute. Here’s how it works.
        </p>
      </div>

      <div className="relative mt-16">
        {/* Dotted line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-5 bottom-5 w-0.5 bg-border/50 hidden md:block"></div>
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border/50 md:hidden"></div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={itemVariants} className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-headline text-xl font-bold mt-4">{step.title}</h3>
              <p className="text-muted-foreground mt-2">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
