/**
 * Injeta um bloco de dados estruturados (schema.org) na página.
 *
 * Os objetos vêm de `@/lib/structured-data`. O `<` é escapado para evitar que um
 * valor vindo da API feche o `<script>` — os dados não são confiáveis por definição.
 */
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
