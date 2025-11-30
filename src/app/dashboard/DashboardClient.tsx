
"use client";

import { type User } from "firebase/auth";
import { AiCommitHelper } from "@/components/dashboard/AiCommitHelper";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { motion } from "framer-motion";

type DashboardClientProps = {
  user: User;
};

export default function DashboardClient({ user }: DashboardClientProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.2,
        duration: 0.5,
        ease: 'easeOut'
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <motion.div 
      className="container py-24 sm:py-32"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">
          Selamat Datang, {user.displayName || user.email}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Mari kita mulai. Apa yang ingin Anda lakukan hari ini?
        </p>
      </div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto"
        variants={containerVariants}
      >
        <motion.div className="lg:col-span-3" variants={itemVariants}>
          <FileUploader />
        </motion.div>
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <AiCommitHelper />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
