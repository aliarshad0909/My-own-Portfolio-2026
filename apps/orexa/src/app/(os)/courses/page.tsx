import { redirect } from "next/navigation";
import { CoursesClient } from "@/components/CoursesClient";
import { getCurrentUser } from "@/lib/auth";
import { getCoursesCatalog } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; lesson?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const catalog = await getCoursesCatalog(user.id);

  return (
    <CoursesClient
      initialCourses={catalog}
      initialCourseId={params.course}
      initialLessonId={params.lesson}
    />
  );
}
