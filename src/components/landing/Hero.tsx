"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Github, Zap } from "lucide-react";
import { Card } from "../ui/card";

export function Hero() {
  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 animated-gradient-bg" />
      <div className="absolute inset-0 z-10 bg-dot-purple/[mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_100%)]" />
      
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 flex flex-col items-center text-center px-4"
      >
        <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-300">
          Supercharge Your
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            GitHub Workflow
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground">
          GitAssist uses AI to automate your commit messages, handles batch uploads seamlessly, and simplifies repository management.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="group">
            <Link href="/dashboard">
              Get Started <Zap className="ml-2 h-5 w-5 group-hover:animate-ping" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-transparent">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" /> View on GitHub
            </a>
          </Button>
        </div>
      </motion.div>
      
      {/* Floating Cards */}
      <FloatingCard className="top-1/4 left-[5%]" content="feat: add user authentication" />
      <FloatingCard className="hidden md:block bottom-1/4 right-[5%]" content="fix: resolve issue #123" />
      <FloatingCard className="hidden lg:block top-20 right-[15%]" content="docs: update README.md" />
      <FloatingCard className="hidden lg:block bottom-20 left-[15%]" content="refactor: simplify logic" />
    </section>
  );
}

const FloatingCard = ({ className, content }: { className?: string; content: string }) => {
    return (
        <motion.div 
            className={`absolute z-20 ${className}`}
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + Math.random() * 0.5, ease: "easeOut" }}
        >
            <Card className="glass-card px-4 py-2">
                <p className="font-code text-sm">{content}</p>
            </Card>
        </motion.div>
    )
}
