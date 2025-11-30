import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/constants";

export function FAQ() {
  return (
    <section id="faq" className="container py-24 sm:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-bold">Frequently Asked Questions</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Have questions? We've got answers. If you have other questions, feel free to reach out.
        </p>
      </div>

      <div className="mt-12 max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="glass-card px-4 border-b-0">
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline text-foreground">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
