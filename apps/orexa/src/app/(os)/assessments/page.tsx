import { redirect } from "next/navigation";
import { AssessmentsClient } from "@/components/AssessmentsClient";
import { getCurrentUser } from "@/lib/auth";
import { getAssessmentsPageData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const data = await getAssessmentsPageData(user.id);

  return <AssessmentsClient initialData={data} initialCourseId={params.course} />;
}
