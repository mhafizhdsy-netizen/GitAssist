import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/constants";

export function FAQ() {
  return (
    <section id="faq" className="container py-16">
      <div className="text-center">
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold">Frequently Asked Questions</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Have questions? We've got answers. If you have other questions, feel free to reach out.
        </p>
      </div>

      <div className="mt-12 max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="glass-card mb-4 px-4">
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
