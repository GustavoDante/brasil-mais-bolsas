/**
 * Moldura das telas de autenticação: centraliza o conteúdo, sem lógica de sessão.
 *
 * A largura do cartão é decidida por cada página (`AuthCard`), porque o cadastro precisa
 * de bem mais espaço que o login.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-start justify-center bg-neutral-50 px-4 py-10 sm:items-center sm:py-14">
      {children}
    </main>
  );
}
