
"use client";

import { type User } from "firebase/auth";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitCommit, AlertCircle, Rocket } from "lucide-react";
import { CommitFeature } from "@/components/dashboard/features/CommitFeature";
import { IssuesFeature } from "@/components/dashboard/features/IssuesFeature";
import { ReleasesFeature } from "@/components/dashboard/features/ReleasesFeature";

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
        staggerChildren: 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }
    },
  };

  return (
    <motion.div
      className="container py-12 sm:py-16"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="text-center mb-12">
        <motion.h1 
          className="text-4xl md:text-5xl font-headline font-bold"
          variants={containerVariants}
        >
          Selamat Datang, {user.displayName || user.email}
        </motion.h1>
        <motion.p 
          className="text-muted-foreground mt-2 text-lg"
          variants={containerVariants}
        >
          Pilih fitur di bawah untuk memulai alur kerja GitHub Anda.
        </motion.p>
      </div>

      <motion.div variants={containerVariants}>
        <Tabs defaultValue="commit" className="w-full">
          <motion.div variants={containerVariants} className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3 h-auto">
              <TabsTrigger value="commit" className="py-2.5">
                <GitCommit className="mr-2" /> Commit
              </TabsTrigger>
              <TabsTrigger value="issues" className="py-2.5">
                <AlertCircle className="mr-2" /> Issues
              </TabsTrigger>
              <TabsTrigger value="releases" className="py-2.5">
                <Rocket className="mr-2" /> Releases
              </TabsTrigger>
            </TabsList>
          </motion.div>
          <TabsContent value="commit">
            <CommitFeature />
          </TabsContent>
          <TabsContent value="issues">
            <IssuesFeature />
          </TabsContent>
          <TabsContent value="releases">
            <ReleasesFeature />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
