import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-sm font-bold uppercase tracking-wider text-brand-blue-700">
          Erro 404
        </span>
        <h1 className="text-3xl font-black text-brand-blue-900 md:text-4xl">
          Página não encontrada
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          O conteúdo que você procura não existe ou foi movido.
        </p>
        <Button asChild className="mt-2 bg-brand-blue-800 hover:bg-brand-blue-900">
          <Link href="/">Voltar para a home</Link>
        </Button>
      </div>
    </main>
  );
}
