import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentScholarshipSummary } from "@/types/dashboard";

interface CurrentScholarshipProps {
  scholarship: StudentScholarshipSummary | null;
}

/**
 * A bolsa do aluno hoje.
 *
 * Três estados, e nenhum deles é uma tela vazia: sem bolsa vira convite para buscar uma;
 * bolsa expirada fala de renovação; bolsa paga leva ao voucher.
 */
export function CurrentScholarship({ scholarship }: CurrentScholarshipProps) {
  if (!scholarship) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold text-neutral-700">
            Você ainda não tem uma bolsa
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Encontre uma bolsa na sua cidade e garanta o desconto.
          </p>
          <Button asChild className="mt-4 bg-brand-blue-800 hover:bg-brand-blue-900">
            <Link href="/bolsas">Ver bolsas disponíveis</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Minha bolsa</CardTitle>
        <div className="flex gap-2">
          {scholarship.expired && <Badge variant="outline">Expirada</Badge>}
          <Badge variant={scholarship.paid ? "default" : "secondary"}>
            {scholarship.paid ? "Pagamento confirmado" : "Pagamento pendente"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-lg font-bold text-brand-blue-900">
            {scholarship.courseName ?? "Curso não informado"}
          </p>
          <p className="text-sm text-neutral-600">
            {scholarship.institutionName ?? "Instituição não informada"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/aluno/minhas-bolsas">Ver detalhes</Link>
          </Button>
          {scholarship.paid ? (
            <Button asChild className="bg-brand-blue-800 hover:bg-brand-blue-900">
              <Link href="/aluno/minhas-bolsas">Meu voucher</Link>
            </Button>
          ) : (
            <Button asChild className="bg-brand-blue-800 hover:bg-brand-blue-900">
              <Link href="/aluno/pagamentos">Pagar agora</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
