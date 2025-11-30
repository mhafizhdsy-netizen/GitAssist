"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Demo() {
  const demoImage = PlaceHolderImages.find(p => p.id === 'demo-app-screenshot');

  return (
    <section id="demo" className="container py-16">
      <div className="text-center">
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold">See It in Action</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Experience the clean and intuitive interface of GitAssist.
        </p>
      </div>
      
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="bg-card/30 rounded-xl border-2 border-primary/20 p-4 shadow-2xl shadow-primary/10">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="aspect-video relative rounded-lg overflow-hidden border border-border/20">
            {demoImage && (
              <Image
                src={demoImage.imageUrl}
                alt={demoImage.description}
                fill
                className="object-cover"
                data-ai-hint={demoImage.imageHint}
              />
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
