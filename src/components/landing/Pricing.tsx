"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING_PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="container py-24 sm:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-bold">Fair & Simple Pricing</h2>
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
            <Card className={cn("h-full flex flex-col glass-card", plan.isPrimary && "border-primary shadow-lg shadow-primary/20")}>
              <CardHeader>
                {plan.isPrimary && (
                  <div className="flex justify-center">
                    <div className="text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1 rounded-full inline-block">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardTitle className="text-2xl text-center pt-4">{plan.name}</CardTitle>
                <CardDescription className="text-center">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6 text-center">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0 mt-1">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
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
