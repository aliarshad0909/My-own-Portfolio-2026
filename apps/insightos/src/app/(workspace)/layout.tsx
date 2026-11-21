import { WorkspaceShell } from "@/components/WorkspaceShell";
import { requirePageUser } from "@/lib/auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}
