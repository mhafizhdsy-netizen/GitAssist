
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth/AuthButton";
import { useUser } from "@/firebase";
import NewLogo from "./NewLogo";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';

  // Hide the AuthButton (specifically the "Mulai" button when not logged in) on the home page.
  const showAuthButton = !isHomePage || user || loading;

  const NavLinks = ({ inMobileMenu = false }: { inMobileMenu?: boolean }) => (
    <>
      {user && (
        <Link
            href="/dashboard"
            onClick={() => inMobileMenu && setMobileMenuOpen(false)}
            className={cn(
                "transition-colors hover:text-foreground",
                inMobileMenu 
                    ? "text-2xl font-medium text-foreground/80" 
                    : "text-sm text-muted-foreground"
            )}
        >
            Dasbor
        </Link>
      )}
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={() => inMobileMenu && setMobileMenuOpen(false)}
          className={cn(
            "transition-colors hover:text-foreground",
            inMobileMenu 
                ? "text-2xl font-medium text-foreground/80" 
                : "text-sm text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          isScrolled ? "bg-background/80 backdrop-blur-lg border-b" : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <NewLogo className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">GitAssist</span>
          </Link>

          {!isLoginPage && (
            <>
            <nav className="hidden md:flex items-center gap-6">
                <NavLinks />
            </nav>
            <div className="flex items-center gap-2">
                <div className="hidden md:block">
                    {showAuthButton && <AuthButton />}
                </div>
                <div className="md:hidden flex items-center gap-2">
                  {showAuthButton && <AuthButton />}
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                      <Menu />
                      <span className="sr-only">Buka menu</span>
                  </Button>
                </div>
            </div>
          </>
          )}
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-lg"
          >
            <div className="container flex flex-col h-full">
              <div className="flex h-16 items-center justify-between">
                 <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <NewLogo className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">GitAssist</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                      <X />
                      <span className="sr-only">Tutup menu</span>
                    </Button>
                </div>
              </div>
              <nav className="flex flex-col items-center justify-center flex-1 gap-8">
                 <NavLinks inMobileMenu />
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
