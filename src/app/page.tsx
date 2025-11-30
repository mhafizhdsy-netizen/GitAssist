import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Demo } from "@/components/landing/Demo";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { About } from "@/components/landing/About";
import { Donate } from "@/components/landing/Donate";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <div className="bg-background">
        <Features />
        <HowItWorks />
        <Demo />
        <Pricing />
        <About />
        <FAQ />
        <Donate />
      </div>
    </div>
  );
}
