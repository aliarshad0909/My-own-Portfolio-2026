import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminSession, isAdminAuthConfigured } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;
  return (
    <AdminLoginForm
      authConfigured={isAdminAuthConfigured()}
      sessionExpired={params.expired === "1"}
    />
  );
}
