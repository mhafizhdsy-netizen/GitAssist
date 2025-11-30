"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING_PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="container py-16">
      <div className="text-center">
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold">Fair & Simple Pricing</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Start for free, and scale as you grow. No hidden fees.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PRICING_PLANS.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <Card className={cn("h-full flex flex-col glass-card", plan.isPrimary && "border-primary")}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" variant={plan.isPrimary ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
