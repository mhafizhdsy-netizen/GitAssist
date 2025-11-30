"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Code, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth/AuthButton";

const Header = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 30);
  });
  
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMobileMenuOpen]);

  const isDashboard = pathname.startsWith('/dashboard');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all",
          isScrolled ? "p-2" : "p-4"
        )}
      >
        <motion.div
          className={cn(
            "relative container flex items-center justify-between px-4 py-2 transition-all",
            isScrolled ? "bg-background/50 backdrop-blur-lg border" : "bg-transparent"
          )}
          layout
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          style={{ 
            borderRadius: isScrolled ? 9999 : 0,
          }}
        >
          <Link href="/" className="flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            <motion.span 
              className="font-bold text-lg"
              animate={{ opacity: isScrolled ? 0 : 1, width: isScrolled ? 0 : 'auto' }}
              transition={{ duration: 0.2 }}
            >
             <span className={cn(isScrolled && "hidden")}>GitAssist</span>
            </motion.span>
          </Link>

          <nav className="hidden md:flex">
            <ul className="flex items-center gap-6">
              {!isDashboard && NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              <Menu />
            </Button>
          </div>
        </motion.div>
      </motion.header>
      
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl"
            onClick={toggleMobileMenu}
          >
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <Link href="/" className="flex items-center gap-2" onClick={toggleMobileMenu}>
                  <Code className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">GitAssist</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                  <X />
                </Button>
              </div>
              <nav className="flex-1 p-8">
                <ul className="flex flex-col items-center justify-center h-full gap-8">
                  {!isDashboard && NAV_ITEMS.map((item, index) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className="text-2xl font-semibold text-foreground/80 transition-colors hover:text-foreground"
                        onClick={toggleMobileMenu}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <div className="p-8 border-t w-full">
                <AuthButton />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
