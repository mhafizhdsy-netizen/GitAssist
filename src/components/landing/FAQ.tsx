
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
        <h2 className="text-3xl md:text-5xl font-bold">Pertanyaan yang Sering Diajukan</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Punya pertanyaan? Kami punya jawabannya. Jika Anda memiliki pertanyaan lain, jangan ragu untuk menghubungi kami.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full max-w-3xl mx-auto mt-12"
      >
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-lg hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
