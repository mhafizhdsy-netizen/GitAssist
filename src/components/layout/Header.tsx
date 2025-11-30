"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Code, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth/AuthButton";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

const Header = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setIsScrolled(latest > 50);
  });

  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden && !isDashboard ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        isScrolled ? "p-2" : "p-4"
      )}
    >
      <motion.div
        className="relative mx-auto flex items-center justify-between bg-background/30 px-4 py-2 backdrop-blur-md border"
        initial={{ borderRadius: "0.5rem" }}
        animate={{
          borderRadius: isScrolled ? "9999px" : "0.5rem",
          width: isScrolled ? "fit-content" : "100%",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Code className="h-6 w-6 text-primary" />
          <span className="font-headline text-lg font-bold">GitAssist</span>
        </Link>

        <nav className="hidden md:flex">
          <ul className="flex items-center gap-6">
            {!isDashboard && NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <AuthButton />
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <div className="flex flex-col h-full">
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <Code className="h-6 w-6 text-primary" />
                        <span className="font-headline text-lg font-bold">GitAssist</span>
                    </Link>
                    <nav>
                    <ul className="flex flex-col gap-6">
                        {!isDashboard && NAV_ITEMS.map((item) => (
                        <li key={item.label}>
                            <Link
                            href={item.href}
                            className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                            >
                            {item.label}
                            </Link>
                        </li>
                        ))}
                    </ul>
                    </nav>
                    <div className="mt-auto">
                        <AuthButton />
                    </div>
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </motion.header>
  );
};

export default Header;
