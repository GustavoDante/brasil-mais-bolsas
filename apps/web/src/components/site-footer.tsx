"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";

import { SecondaryIcon } from "@/assets/secondary-icon";
import { FacebookIcon, LinkedinIcon, TwitterIcon } from "@/assets/social-icons";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  newsletterSchema,
  type NewsletterFormData,
} from "@/schemas/newsletter.schema";

interface FooterLinkColumn {
  title: string;
  links: { label: string; href: string }[];
}

const linkColumns: FooterLinkColumn[] = [
  {
    title: "Parceiros",
    links: [
      { label: "Portal do parceiro", href: "#" },
      { label: "Seja um parceiro", href: "#" },
      { label: "Parceria de divulgação", href: "#" },
      { label: "Portal do vendedor", href: "#" },
    ],
  },
  {
    title: "Sobre",
    links: [
      { label: "Como funciona", href: "#" },
      { label: "Quem somos", href: "#" },
    ],
  },
  {
    title: "Links úteis",
    links: [
      { label: "Enem", href: "#" },
      { label: "Sisu", href: "#" },
      { label: "Prouni", href: "#" },
      { label: "Fies", href: "#" },
    ],
  },
];

const legalLinks = [
  { label: "Termos", href: "#" },
  { label: "Privacidade", href: "#" },
  { label: "Cookies", href: "#" },
];

const socialLinks = [
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "Twitter", href: "#", Icon: TwitterIcon },
];

export function SiteFooter() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: NewsletterFormData) => {
    console.log("Newsletter inscrita com:", data);
    reset();
  };

  return (
    <footer className="w-full bg-neutral-300">
      <div className="mx-auto w-full max-w-[1436px] px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_1.2fr]">
          {linkColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-base font-semibold text-brand-blue-800">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-blue-800 transition-colors hover:text-brand-blue-900 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl bg-brand-blue-800/10 p-6 sm:col-span-2 lg:col-span-1">
            <h3 className="text-base font-semibold text-brand-blue-800">
              Contato
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              <InputGroup className="h-11 rounded-lg border-neutral-200 bg-neutral-100">
                <InputGroupInput
                  {...register("email")}
                  type="email"
                  placeholder="Seu e-mail"
                  aria-invalid={!!errors.email}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="submit"
                    size="icon-sm"
                    aria-label="Inscrever e-mail"
                    className="rounded-md bg-white text-brand-blue-800 shadow-sm hover:bg-neutral-100"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {errors.email && (
                <p className="mt-2 text-xs font-semibold text-destructive">
                  {errors.email.message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-brand-blue-800/20" />

        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
          <Link href="/" className="flex items-center">
            <SecondaryIcon variant="colorfull" width={110} height={34} />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-brand-blue-800 transition-colors hover:text-brand-blue-900 hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-blue-800/25 text-brand-blue-800 transition-colors hover:bg-brand-blue-800/10"
              >
                <Icon className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
