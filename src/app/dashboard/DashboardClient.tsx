
"use client";

import { type User } from "firebase/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitCommit, AlertCircle, Rocket } from "lucide-react";
import { CommitFeature } from "@/components/dashboard/features/CommitFeature";
import { IssuesFeature } from "@/components/dashboard/features/IssuesFeature";
import { ReleasesFeature } from "@/components/dashboard/features/ReleasesFeature";
import { cn } from "@/lib/utils";

type DashboardClientProps = {
  user: User;
};

const TABS = [
  { value: "commit", label: "Commit", Icon: GitCommit, component: <CommitFeature /> },
  { value: "issues", label: "Issues", Icon: AlertCircle, component: <IssuesFeature /> },
  { value: "releases", label: "Releases", Icon: Rocket, component: <ReleasesFeature /> },
];

export default function DashboardClient({ user }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState(TABS[0].value);

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
      className="container pt-24 pb-12 sm:pt-28 sm:pb-16"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="text-center mb-10">
        <motion.h1 
          className="text-xl md:text-2xl font-bold"
          variants={containerVariants}
        >
          Selamat Datang, {user.displayName || user.email}
        </motion.h1>
        <motion.p 
          className="text-muted-foreground mt-2 text-sm md:text-base max-w-lg mx-auto"
          variants={containerVariants}
        >
          Pilih fitur di bawah untuk memulai alur kerja GitHub Anda.
        </motion.p>
      </div>

      <motion.div variants={containerVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <motion.div variants={containerVariants} className="flex justify-center mb-8">
            <TabsList className="h-auto p-1.5 rounded-xl glass-card border-none">
              {TABS.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 text-sm sm:text-base font-medium transition-colors rounded-lg",
                    "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/50",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30"
                  )}
                >
                  <tab.Icon className="mr-2 h-5 w-5" /> {tab.label}
                </TabsTrigger>
              ))}
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
