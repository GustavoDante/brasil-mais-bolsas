"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Contact2, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MainIcon } from "@/assets/main-icon";

export interface NavLink {
  href: string;
  label: string;
}

const defaultLinks: NavLink[] = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#faq", label: "FAQ" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

interface SiteHeaderProps {
  links?: NavLink[];
}

export function SiteHeader({ links = defaultLinks }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-brand-blue-800 text-neutral-100">
      <div className="mx-auto flex w-full max-w-[1436px] items-center justify-between gap-6 px-4 py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <MainIcon className="h-7 w-auto lg:h-9" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <Button
            variant="ghost"
            className="border-neutral-100/70 text-neutral-100 hover:bg-neutral-100 hover:text-brand-blue-700"
          >
            <Phone className="mr-2 h-4 w-4" />
            Fale conosco
          </Button>
          <Button className="bg-neutral-100 text-brand-blue-700 hover:bg-white">
            <Contact2 className="mr-2 h-4 w-4" />
            Portal do aluno
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          className="text-neutral-100 hover:bg-neutral-100 hover:text-brand-blue-700 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 py-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex flex-col gap-2">
            <Button
              variant="ghost"
              className="w-full justify-center border-neutral-100/70 text-neutral-100 hover:bg-neutral-100 hover:text-brand-blue-700"
            >
              <Phone className="mr-2 h-4 w-4" />
              Fale conosco
            </Button>
            <Button className="w-full justify-center bg-neutral-100 text-brand-blue-700 hover:bg-white">
              <Contact2 className="mr-2 h-4 w-4" />
              Portal do aluno
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
