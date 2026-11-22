import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(user.id);
  return <DashboardClient initialData={data} />;
}
