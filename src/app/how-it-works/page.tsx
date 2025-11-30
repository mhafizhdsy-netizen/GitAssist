
'use client';

import { HowItWorks } from "@/components/landing/HowItWorks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { motion } from "framer-motion";

export default function HowItWorksPage() {
  return (
    <motion.div
        className="container py-24 sm:py-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="max-w-5xl mx-auto glass-card">
            <CardHeader className="text-center">
                 <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Layers className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-4xl font-headline">Cara Kerjanya</CardTitle>
                <CardDescription>
                    Dari login hingga commit dalam waktu kurang dari satu menit.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <HowItWorks />
            </CardContent>
        </Card>
      </motion.div>
  );
}
