import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FAQ } from "@/components/landing/FAQ";
import { Donate } from "@/components/landing/Donate";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <div className="bg-background">
        <Features />
        <HowItWorks />
        <FAQ />
        <Donate />
      </div>
    </div>
  );
}
