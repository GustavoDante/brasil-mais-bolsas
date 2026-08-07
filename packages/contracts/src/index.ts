/**
 * `@repo/contracts` — o contrato HTTP da API, compartilhado pelo NestJS e pelo Next.
 *
 * Camadas:
 * - `generated/` — forma das entidades, gerada do `schema.prisma` (não editar);
 * - `models` / `enums` — o que dessa geração faz parte do contrato público;
 * - `primitives` — blocos de validação reutilizáveis;
 * - `errors` — catálogo de erros: código → status HTTP + mensagem em pt-BR;
 * - `<módulo>/` — schemas de request e response de cada módulo da API.
 *
 * Isomórfico: depende só de `zod`. Nada aqui pode importar `@repo/db`, `@prisma/client`
 * ou API do Node — este pacote entra no bundle do browser.
 */

export * from './common';
export * from './enums';
export * from './errors';
export * from './models';
export * from './primitives';
export * from './user-types';

// --- Módulos da API ----------------------------------------------------------------
// Um módulo aqui = um módulo da API. Rota nova ⇒ schema novo no módulo correspondente.
export * from './addresses';
export * from './auth';
export * from './calls';
export * from './checkout';
export * from './contact';
export * from './course-categories';
export * from './courses';
export * from './external-clients';
export * from './faq';
export * from './indications';
export * from './institutions';
export * from './minors';
export * from './notifications';
export * from './orders';
export * from './partners';
export * from './payments';
export * from './possible-partners';
export * from './reports';
export * from './scholarships';
export * from './sellers';
export * from './signed-contracts';
export * from './uploads';
export * from './user-identities';
export * from './users';
