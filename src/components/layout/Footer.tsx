
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Instagram } from "lucide-react";
import { FOOTER_LINKS } from "@/lib/constants";
import { Separator } from "../ui/separator";
import NewLogo from "./NewLogo";

const LargeFooter = () => (
  <footer className="border-t bg-background/50 py-12 relative overflow-hidden">
    <div className="container relative z-10">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <NewLogo className="h-12 w-12 text-primary" />
            <span className="text-2xl font-bold">GitAssist</span>
          </Link>
          <p className="text-muted-foreground text-sm max-w-xs">
            Alat berbasis AI untuk menyederhanakan alur kerja GitHub Anda dan meningkatkan produktivitas.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <Link href="https://github.com/mhafizhdsy-netizen/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-6 w-6 text-muted-foreground transition-colors hover:text-primary" />
            </Link>
            <Link href="https://www.instagram.com/elchampionee?igsh=MmVpbjNmdmNmaTJt" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="h-6 w-6 text-muted-foreground transition-colors hover:text-primary" />
            </Link>
          </div>
        </div>
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 pt-8 border-t">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GitAssist. Semua hak dilindungi.
        </p>
      </div>
    </div>
  </footer>
);

const SmallFooter = () => (
    <footer className="py-6 border-t">
        <div className="container flex flex-col items-center justify-center gap-4">
            <div className="flex gap-4">
                 <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    Ketentuan
                </Link>
                <Separator orientation="vertical" className="h-5" />
                 <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    Privasi
                </Link>
            </div>
            <p className="text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} GitAssist. Semua hak dilindungi.
            </p>
        </div>
    </footer>
);


const Footer = () => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
      return <LargeFooter />;
  }

  return <SmallFooter />;
};

export default Footer;
