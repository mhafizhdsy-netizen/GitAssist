
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/constants";

export function FAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <Accordion
        type="single"
        collapsible
        className="w-full space-y-4"
        defaultValue="item-0"
      >
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg px-6 transition-all hover:border-primary/50"
          >
            <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pt-2 text-base text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
