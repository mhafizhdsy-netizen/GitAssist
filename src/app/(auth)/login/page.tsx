
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-grid-pattern">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md glass-card shadow-2xl shadow-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Selamat Datang Kembali</CardTitle>
            <CardDescription>Masuk dengan GitHub untuk mengakses dasbor Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
