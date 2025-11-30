
'use client';

import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQ } from "@/components/landing/FAQ";
import { motion } from "framer-motion";

export default function FAQPage() {
  return (
    <motion.div
        className="container py-24 sm:py-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="max-w-4xl mx-auto glass-card">
            <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <HelpCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-4xl font-headline">Pertanyaan yang Sering Diajukan</CardTitle>
                <CardDescription>
                    Punya pertanyaan? Kami punya jawabannya.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <FAQ />
            </CardContent>
        </Card>
      </motion.div>
  );
}
