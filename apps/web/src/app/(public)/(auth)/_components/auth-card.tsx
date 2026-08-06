import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  /**
   * Largura máxima do cartão. Fica na página, não no layout, porque o cadastro tem 21
   * campos e precisa de duas colunas, enquanto login e recuperação têm dois campos e
   * ficariam com o texto esticado demais na mesma largura.
   */
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
