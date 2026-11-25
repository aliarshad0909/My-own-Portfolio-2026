export function fnv1aBucket(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 10_000; // basis points 0..9999
}

export function evaluateFlag(flag, context) {
  if (flag.killSwitch) return { enabled: false, reason: "kill_switch" };
  if ((flag.allowUsers || []).includes(context.userId)) return { enabled: true, reason: "user_allowlist" };
  if (flag.requiredPlan && flag.requiredPlan !== context.plan) return { enabled: false, reason: "plan_mismatch" };
  const bucket = fnv1aBucket(`${flag.key}:${context.userId}`);
  const cutoff = Math.round((flag.rolloutPct || 0) * 100);
  return { enabled: bucket < cutoff, bucket, reason: bucket < cutoff ? "rollout_hit" : "rollout_holdout" };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  console.log(JSON.stringify(evaluateFlag({ key: "new-checkout", rolloutPct: 25, allowUsers: ["u_beta"] }, { userId: "u_42", plan: "pro" })));
}
