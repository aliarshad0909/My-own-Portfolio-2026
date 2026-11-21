import type { DifficultyTier, GradedAnswer, QuizQuestion } from "@/db/schema";

export type AdaptiveAction = "review_foundation" | "intermediate_practice" | "unlock_advanced";

export type AdaptiveEvaluation = {
  scorePct: number;
  correctCount: number;
  totalQuestions: number;
  recommendedTier: DifficultyTier;
  action: AdaptiveAction;
  actionLabel: string;
  recommendation: string;
  weakTopics: string[];
  gradedAnswers: GradedAnswer[];
};

/**
 * Pure adaptive tier rule required by Orexa:
 *   < 60%   -> review foundation module
 *   60-84%  -> intermediate practice
 *   >= 85%  -> unlock advanced challenge
 */
export function computeAdaptiveTier(scorePct: number): {
  recommendedTier: DifficultyTier;
  action: AdaptiveAction;
  actionLabel: string;
} {
  if (scorePct < 60) {
    return {
      recommendedTier: "foundation",
      action: "review_foundation",
      actionLabel: "Review Foundation Module",
    };
  }
  if (scorePct < 85) {
    return {
      recommendedTier: "intermediate",
      action: "intermediate_practice",
      actionLabel: "Intermediate Practice",
    };
  }
  return {
    recommendedTier: "advanced",
    action: "unlock_advanced",
    actionLabel: "Unlock Advanced Challenge",
  };
}

export function gradeAssessment(
  questions: QuizQuestion[],
  submittedAnswers: Array<{ questionId: string; selectedIndex: number }>,
  courseTitle: string,
): AdaptiveEvaluation {
  const answerMap = new Map(submittedAnswers.map((a) => [a.questionId, a.selectedIndex]));
  const gradedAnswers: GradedAnswer[] = [];
  const missedTopics = new Set<string>();
  let correctCount = 0;

  for (const q of questions) {
    const selectedIndex = answerMap.has(q.id) ? answerMap.get(q.id)! : -1;
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) {
      correctCount += 1;
    } else if (q.topicTag) {
      missedTopics.add(q.topicTag);
    }
    gradedAnswers.push({
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      topicTag: q.topicTag,
      explanation: q.explanation,
    });
  }

  const totalQuestions = Math.max(1, questions.length);
  const scorePct = Math.round((correctCount / totalQuestions) * 100);
  const tier = computeAdaptiveTier(scorePct);
  const weakTopics = Array.from(missedTopics);

  let recommendation = "";
  if (tier.action === "review_foundation") {
    const focus = weakTopics.length > 0 ? ` Focus on ${weakTopics.join(", ")}.` : "";
    recommendation = `Score ${scorePct}% (< 60%): Review the Foundation module in ${courseTitle} and revisit core lesson takeaways before retaking.${focus}`;
  } else if (tier.action === "intermediate_practice") {
    const focus = weakTopics.length > 0 ? ` Reinforce ${weakTopics.join(", ")} with the course exercises.` : "";
    recommendation = `Score ${scorePct}% (60–84%): Ready for Intermediate Practice in ${courseTitle}.${focus}`;
  } else {
    recommendation = `Score ${scorePct}% (≥ 85%): Mastery verified — Advanced Challenge unlocked for ${courseTitle}. Proceed to advanced architecture labs and capstone scenarios.`;
  }

  return {
    scorePct,
    correctCount,
    totalQuestions: questions.length,
    recommendedTier: tier.recommendedTier,
    action: tier.action,
    actionLabel: tier.actionLabel,
    recommendation,
    weakTopics,
    gradedAnswers,
  };
}

export type ReadinessProfile = {
  level: DifficultyTier;
  label: string;
  summary: string;
  avgScorePct: number;
  advancedUnlockedCount: number;
};

export function computeLearnerReadiness(
  attempts: Array<{ scorePct: number; difficultyLevel: DifficultyTier }>,
): ReadinessProfile {
  if (attempts.length === 0) {
    return {
      level: "foundation",
      label: "Foundation Onboarding",
      summary: "Complete your first adaptive quiz to calibrate your personalized difficulty track.",
      avgScorePct: 0,
      advancedUnlockedCount: 0,
    };
  }

  const avgScorePct = Math.round(
    attempts.reduce((sum, item) => sum + item.scorePct, 0) / attempts.length,
  );
  const advancedUnlockedCount = attempts.filter((a) => a.scorePct >= 85).length;
  const tier = computeAdaptiveTier(avgScorePct);

  if (tier.action === "unlock_advanced") {
    return {
      level: "advanced",
      label: "Advanced Challenge Ready",
      summary: `Strong mastery (${avgScorePct}% average across ${attempts.length} attempts). Advanced tier assessments are unlocked.`,
      avgScorePct,
      advancedUnlockedCount,
    };
  }
  if (tier.action === "intermediate_practice") {
    return {
      level: "intermediate",
      label: "Intermediate Practitioner",
      summary: `Solid trajectory (${avgScorePct}% average). Practice intermediate scenarios to push past 85% and unlock advanced challenges.`,
      avgScorePct,
      advancedUnlockedCount,
    };
  }
  return {
    level: "foundation",
    label: "Foundation Review Track",
    summary: `Recent score average (${avgScorePct}%) indicates reviewing core foundation modules will build faster momentum.`,
    avgScorePct,
    advancedUnlockedCount,
  };
}
