import { requireStudentSession } from "@/lib/auth/guards";
import { StudentShell } from "./_components/student-shell";

/**
 * Portal do aluno (e do responsável pelos menores).
 *
 * Admin e gestor que caírem numa URL deste grupo voltam para `/dashboard`: o painel deles
 * é outro, com outras telas — não é uma versão "a mais" deste.
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireStudentSession();

  return <StudentShell email={user.email}>{children}</StudentShell>;
}
