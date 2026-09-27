"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/enrollment-form", label: "Pre-Enrollment Form" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when navigating
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        {/* Logo + School Name
            Tablet and Desktop */}
        <Link href="/" className="hidden items-center gap-3 md:flex">
          <Image
            src="/assets/logo.png"
            alt="Dimasalang National High School seal"
            width={44}
            height={44}
            className="h-12 w-12 rounded-full object-cover"
            priority
          />

          <span className="font-serif text-lg leading-tight font-semibold text-foreground">
            Dimasalang National
            <br />
            High School
          </span>
        </Link>

        {/* Desktop Navigation + Admin Login */}
        <div className="hidden items-center gap-8 lg:flex">
          <nav className="flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium underline-offset-8 transition-colors",
                    isActive
                      ? "text-foreground underline decoration-2 decoration-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Button
            render={<Link href="/admin/login" />}
            variant="navy"
            size="sm"
          >
            Admin Login
          </Button>
        </div>

        {/* Tablet + Mobile Hamburger */}
        <div ref={menuRef} className="relative ml-auto lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              isMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </Button>

          {/* Tablet / Mobile Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-lg border border-black/5 bg-white shadow-lg">
              <nav className="flex flex-col p-2">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "rounded-md px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
