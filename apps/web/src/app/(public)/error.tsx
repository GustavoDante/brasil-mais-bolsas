"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-sm font-bold uppercase tracking-wider text-destructive">
          Erro inesperado
        </span>
        <h1 className="text-3xl font-black text-brand-blue-900 md:text-4xl">
          Algo deu errado
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tente novamente. Se o problema persistir, volte mais tarde.
        </p>
        <Button
          onClick={() => reset()}
          className="mt-2 bg-brand-blue-800 hover:bg-brand-blue-900"
        >
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
