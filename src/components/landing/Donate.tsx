
import Link from "next/link";
import { Button } from "../ui/button";
import { Heart, ArrowRight } from "lucide-react";

export function Donate() {
  return (
    <section id="donate" className="py-24 sm:py-32 bg-background">
      <div className="container text-center">
        <h2 className="text-3xl md:text-5xl font-bold">Dukung GitAssist</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          GitAssist adalah proyek sumber terbuka. Kontribusi Anda membantu kami meningkatkan alat ini dan menjaganya tetap gratis untuk semua orang.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="group">
            <Link href="/donate">
              <Heart className="mr-2 h-5 w-5" /> Donasi Sekarang
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
