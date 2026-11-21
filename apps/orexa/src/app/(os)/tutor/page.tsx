import { redirect } from "next/navigation";
import { TutorClient } from "@/components/TutorClient";
import { getCurrentUser } from "@/lib/auth";
import { getCoursesCatalog, getTutorThread } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; lesson?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const courses = await getCoursesCatalog(user.id);
  const initialCourseId =
    params.course && courses.some((c) => c.id === params.course)
      ? params.course
      : (courses[0]?.id ?? "");

  const initialMessages = initialCourseId ? await getTutorThread(user.id, initialCourseId) : [];

  return (
    <TutorClient
      courses={courses}
      initialCourseId={initialCourseId}
      initialLessonId={params.lesson}
      initialMessages={initialMessages}
      engineMode={process.env.OREXA_LLM_API_KEY ? "llm" : "deterministic"}
    />
  );
}
