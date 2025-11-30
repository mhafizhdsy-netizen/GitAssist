import Link from "next/link";
import { Button } from "../ui/button";
import { Heart } from "lucide-react";

export function Donate() {
  return (
    <section id="donate" className="py-16 bg-primary/5">
      <div className="container text-center">
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold">Support GitAssist</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          GitAssist is an open-source project. Your contributions help us improve the tool and keep it free for everyone.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/donate">
              <Heart className="mr-2 h-5 w-5" /> Donate Now
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
