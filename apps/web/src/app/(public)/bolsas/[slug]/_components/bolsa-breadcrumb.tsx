import Link from "next/link";

export interface BolsaBreadcrumbItem {
  label: string;
  /** Sem `href` o item vira texto — usado no último nível (página atual). */
  href?: string;
}

interface BolsaBreadcrumbProps {
  items: BolsaBreadcrumbItem[];
}

export function BolsaBreadcrumb({ items }: BolsaBreadcrumbProps) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-bold uppercase hover:text-brand-blue-700 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium uppercase" : "font-bold uppercase"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <span className="font-bold">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
