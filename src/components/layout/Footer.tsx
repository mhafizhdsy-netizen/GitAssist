import Link from "next/link";
import { Code, Github, Twitter, Linkedin } from "lucide-react";
import { FOOTER_LINKS } from "@/lib/constants";

const Footer = () => {
  return (
    <footer className="border-t bg-background/50 py-12 relative overflow-hidden">
      <div className="container relative z-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Code className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">GitAssist</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              AI-Powered tools to streamline your GitHub workflow and enhance productivity.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github className="h-6 w-6 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
              <Link href="#" aria-label="Twitter">
                <Twitter className="h-6 w-6 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
              <Link href="#" aria-label="LinkedIn">
                <Linkedin className="h-6 w-6 text-muted-foreground transition-colors hover:text-primary" />
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
            © {new Date().getFullYear()} GitAssist. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
