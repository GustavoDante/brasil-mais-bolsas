import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buildBolsasHref, type BolsasSearch } from "@/lib/search-params";

interface BolsasPaginationProps {
  search: BolsasSearch;
  currentPage: number;
  totalPages: number;
}

/** Quantos números aparecem em volta da página atual antes de virar reticências. */
const WINDOW = 2;

function buildPageWindow(currentPage: number, totalPages: number): Array<number | "…"> {
  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - WINDOW; page <= currentPage + WINDOW; page += 1) {
    if (page >= 1 && page <= totalPages) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "…"> = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("…");
    result.push(page);
  });

  return result;
}

/**
 * Paginação em links reais (`<a href>`), não em botões com `onClick`. Cada página tem
 * URL própria: o robô rastreia a listagem inteira, o usuário compartilha o link e o
 * analytics registra a página como uma pageview distinta.
 */
export function BolsasPagination({
  search,
  currentPage,
  totalPages,
}: BolsasPaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => buildBolsasHref({ ...search, page });
  const items = buildPageWindow(currentPage, totalPages);

  const arrowClassName =
    "size-9 rounded-full border border-brand-blue-800 text-brand-blue-800 hover:bg-brand-blue-800/10";

  return (
    <Pagination className="mt-10">
      <PaginationContent className="gap-2">
        <PaginationItem>
          {currentPage > 1 ? (
            <Link
              href={hrefFor(currentPage - 1)}
              aria-label="Página anterior"
              rel="prev"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                arrowClassName
              )}
            >
              <ChevronLeftIcon />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                arrowClassName,
                "pointer-events-none opacity-40"
              )}
            >
              <ChevronLeftIcon />
            </span>
          )}
        </PaginationItem>

        {items.map((item, index) =>
          item === "…" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <Link
                href={hrefFor(item)}
                aria-label={`Página ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: item === currentPage ? "outline" : "ghost",
                    size: "icon",
                  }),
                  "size-9 rounded-full",
                  item === currentPage
                    ? "border-transparent bg-brand-blue-700 text-white hover:bg-brand-blue-700 hover:text-white"
                    : "border border-brand-blue-800 text-brand-blue-800 hover:bg-brand-blue-800/10"
                )}
              >
                {item}
              </Link>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          {currentPage < totalPages ? (
            <Link
              href={hrefFor(currentPage + 1)}
              aria-label="Próxima página"
              rel="next"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                arrowClassName
              )}
            >
              <ChevronRightIcon />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                arrowClassName,
                "pointer-events-none opacity-40"
              )}
            >
              <ChevronRightIcon />
            </span>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
