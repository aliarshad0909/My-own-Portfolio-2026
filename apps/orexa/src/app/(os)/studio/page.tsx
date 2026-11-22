import { redirect } from "next/navigation";
import { StudioClient } from "@/components/StudioClient";
import { getCurrentUser } from "@/lib/auth";
import { getStudioData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getStudioData(user.id);
  return <StudioClient initialData={data} />;
}
