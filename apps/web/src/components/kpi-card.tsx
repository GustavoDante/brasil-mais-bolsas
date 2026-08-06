import { Card, CardContent } from "@/components/ui/card";
import type { KpiValue } from "@/types/dashboard";

/** Formatação pt-BR: 1234 → "1.234". */
const numberFormat = new Intl.NumberFormat("pt-BR");

export function KpiCard({ label, value, hint }: KpiValue) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        <p className="mt-1 text-3xl font-bold text-brand-blue-900">
          {numberFormat.format(value)}
        </p>
        {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function KpiGrid({ items }: { items: KpiValue[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
