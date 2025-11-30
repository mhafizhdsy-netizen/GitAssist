"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Demo() {
  const demoImage = PlaceHolderImages.find(p => p.id === 'demo-app-screenshot');

  return (
    <section id="demo" className="container py-24 sm:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-bold">See It in Action</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Experience the clean and intuitive interface of GitAssist.
        </p>
      </div>
      
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="bg-background/50 rounded-xl border border-white/10 p-2 shadow-2xl shadow-primary/20 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-2 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
          <div className="aspect-video relative rounded-lg overflow-hidden border border-white/10">
            {demoImage && (
              <Image
                src={demoImage.imageUrl}
                alt={demoImage.description}
                fill
                className="object-cover"
                data-ai-hint={demoImage.imageHint}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
