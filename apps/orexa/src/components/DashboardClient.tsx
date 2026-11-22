"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  GraduationCap,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import type { DifficultyTier } from "@/db/schema";
import type { DashboardData } from "@/lib/queries";

function tierBadgeStyle(tier: DifficultyTier) {
  if (tier === "advanced") {
    return "border-violet-500/35 bg-violet-500/15 text-violet-200";
  }
  if (tier === "intermediate") {
    return "border-amber-500/35 bg-amber-500/15 text-amber-200";
  }
  return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 60) return "text-amber-300";
  return "text-[#ff6b4a]";
}

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);

  useEffect(() => {
    const onRefresh = async () => {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const next = (await res.json()) as DashboardData;
        setData(next);
      }
    };
    window.addEventListener("orexa:refresh", onRefresh);
    return () => window.removeEventListener("orexa:refresh", onRefresh);
  }, []);

  const { kpis, readiness, quickResume, courses, recommendations, recentAttempts } = data;

  return (
    <div className="space-y-6">
      {/* Hero Adaptive Readiness + Quick Resume Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#262d3d] bg-gradient-to-br from-[#161b26] via-[#131722] to-[#1a151b] p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-8 h-48 w-48 rounded-full bg-[#ff6b4a]/15 blur-3xl"
        />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6b4a]/40 bg-[#ff6b4a]/15 px-3 py-1 text-xs font-semibold text-[#ffb4a2]">
                <Flame className="h-3.5 w-3.5 text-[#ff6b4a]" />
                <span>Adaptive Readiness: {readiness.label}</span>
              </span>
              <span className="rounded-full border border-[#2d3548] bg-[#0f131b] px-2.5 py-1 text-xs text-[#9ca7bc]">
                {readiness.advancedUnlockedCount} Advanced Tier{readiness.advancedUnlockedCount === 1 ? "" : "s"} Unlocked
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Your Personalized AI Learning Command Center
            </h1>
            <p className="text-sm leading-relaxed text-[#a8b2c5]">{readiness.summary}</p>
          </div>

          {quickResume ? (
            <div className="w-full shrink-0 rounded-xl border border-[#ff6b4a]/35 bg-[#0f131b]/90 p-4 lg:w-80">
              <p className="text-[11px] font-semibold tracking-wider text-[#ff6b4a] uppercase">
                Quick Resume Next Lesson
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-bold text-white">{quickResume.lessonTitle}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-[#9ca7bc]">
                {quickResume.courseTitle} · {quickResume.durationMins} min
              </p>
              <Link
                href={`/courses?course=${quickResume.courseId}&lesson=${quickResume.lessonId}`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#ff6b4a]/20 transition hover:brightness-110"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Resume Lesson</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ca7bc]">Overall Completion</span>
            <CheckCircle2 className="h-4 w-4 text-[#ff6b4a]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{kpis.overallCompletionPct}%</p>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#0d0f14]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#f97316] transition-all"
              style={{ width: `${kpis.overallCompletionPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[#8d99ae]">
            {kpis.completedLessons} of {kpis.totalLessons} lessons completed
          </p>
        </div>

        <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ca7bc]">Avg Adaptive Quiz Score</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{kpis.avgQuizScorePct}%</p>
          <p className="mt-2 text-xs text-[#8d99ae]">
            {recentAttempts.length} recent graded assessment{recentAttempts.length === 1 ? "" : "s"}
          </p>
          <Link
            href="/assessments"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#ff8a6f] hover:text-[#ff6b4a]"
          >
            <span>Run adaptive quiz</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ca7bc]">Active Tracks</span>
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{kpis.activeCourses}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8d99ae]">
            <Clock className="h-3.5 w-3.5 text-[#7e8a9f]" />
            <span>{kpis.studyMinsCompleted} study minutes logged</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ca7bc]">AI Tutor Sessions</span>
            <Bot className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{kpis.tutorTurns}</p>
          <p className="mt-2 text-xs text-[#8d99ae]">Curriculum-grounded turns persisted</p>
          <Link
            href="/tutor"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#ff8a6f] hover:text-[#ff6b4a]"
          >
            <span>Open AI Tutor</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Main Two-Column Grid: Active Courses + Adaptive Recommendations & Recent Scores */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Active Courses */}
        <section className="space-y-4 xl:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Active Courses</h2>
              <p className="text-xs text-[#8d99ae]">
                Real-time PostgreSQL completion progress across your enrolled tracks
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 rounded-lg border border-[#2a3245] bg-[#141821] px-3 py-1.5 text-xs font-semibold text-[#cbd4e4] hover:border-[#ff6b4a]/60 hover:text-white"
            >
              <span>All Courses</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4 transition hover:border-[#37425b]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#1d2332] px-2 py-0.5 text-[11px] font-medium text-[#cbd4e4]">
                        {course.category}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${tierBadgeStyle(course.difficulty)}`}
                      >
                        {course.difficulty}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-white">{course.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#9ca7bc]">
                      {course.description}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-white">{course.completionPct}%</span>
                    <span className="block text-[11px] text-[#8d99ae]">
                      {course.completedLessons}/{course.totalLessons} lessons
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0d0f14]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#f97316]"
                    style={{ width: `${course.completionPct}%` }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#8d99ae]">
                    Instructor: <strong className="font-medium text-[#cbd4e4]">{course.instructorName}</strong> ·{" "}
                    {course.totalDurationMins} min
                  </span>
                  <Link
                    href={
                      course.nextLesson
                        ? `/courses?course=${course.id}&lesson=${course.nextLesson.id}`
                        : `/courses?course=${course.id}`
                    }
                    className="inline-flex items-center gap-1 font-semibold text-[#ff8a6f] hover:text-[#ff6b4a]"
                  >
                    <span>{course.completedLessons > 0 ? "Continue" : "Start Course"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Personalized Learning Recommendations & Recent Quiz Scores */}
        <div className="space-y-6 xl:col-span-5">
          {/* Adaptive Recommendations */}
          <section className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#ff6b4a]" />
              <h2 className="text-base font-bold text-white">Adaptive Recommendations</h2>
            </div>
            <p className="mt-1 text-xs text-[#8d99ae]">
              Computed live from your assessment attempts and unfinished syllabus modules
            </p>

            <div className="mt-4 space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-[#262e40] bg-[#0f131b] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{rec.courseTitle}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tierBadgeStyle(rec.tier)}`}
                    >
                      {rec.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#a8b2c5]">{rec.reason}</p>
                  <Link
                    href={rec.href}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#ff8a6f] hover:text-[#ff6b4a]"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{rec.ctaLabel}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Quiz Scores */}
          <section className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#ff6b4a]" />
                <h2 className="text-base font-bold text-white">Recent Quiz Scores</h2>
              </div>
              <Link
                href="/assessments"
                className="text-xs font-semibold text-[#ff8a6f] hover:text-[#ff6b4a]"
              >
                View all
              </Link>
            </div>

            {recentAttempts.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-[#2d3548] p-4 text-center text-xs text-[#8d99ae]">
                No assessment attempts yet. Launch your first adaptive quiz to calibrate difficulty.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#262e40] bg-[#0f131b] px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {attempt.assessmentTitle}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#8d99ae]">
                        {attempt.courseTitle} · {attempt.actionLabel}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-base font-bold ${scoreColor(attempt.scorePct)}`}>
                        {attempt.scorePct}%
                      </span>
                      <span className="block text-[10px] capitalize text-[#7e8a9f]">
                        {attempt.difficultyLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
