#!/usr/bin/env node
/**
 * Optional local-dev demo seeder.
 * Inserts explicitly marked `is_demo = true` rows into Neon PostgreSQL ONLY when
 * BOTH `ADMIN_DEMO_MODE=true` AND `--confirm-demo` are provided.
 */
import { neon } from "@neondatabase/serverless";

if (process.env.ADMIN_DEMO_MODE !== "true" || !process.argv.includes("--confirm-demo")) {
  console.error(
    "Refusing to seed demo data. Set ADMIN_DEMO_MODE=true and pass --confirm-demo (local development only).",
  );
  process.exit(1);
}

const connectionString = (process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "").trim();
if (!connectionString) {
  console.error("Error: Set DATABASE_URL or DIRECT_DATABASE_URL before seeding.");
  process.exit(1);
}

const sql = neon(connectionString);

await sql`
  INSERT INTO admin_contact_inquiries (
    id, name, email, company, service, description, budget, timeline, status, notes, delivery_channel, is_demo
  ) VALUES (
    'demo_seed_inq_1', 'Sample Contact — Priya Nair (Demo)', 'priya.demo@example.invalid',
    'Alder & Loom (Fictional Demo)', 'Web & Software Development',
    '[DEMO SEED] Synthetic inquiry inserted for local UI testing.', '$5,000 to $15,000',
    '1 to 3 months', 'new', 'Demo seed row — safe to delete.', 'demo', true
  )
  ON CONFLICT (id) DO NOTHING
`;

await sql`
  INSERT INTO admin_studio_applications (
    id, name, email, location_timezone, skills, portfolio_url, availability, introduction,
    public_listing_opt_in, approximate_region, moderation_status, notes, is_demo
  ) VALUES (
    'demo_seed_app_1', 'Sample Applicant — Devon Park (Demo)', 'devon.demo@example.invalid',
    'Chicago, IL (US Central)', '["Full-Stack Web / Next.js"]'::jsonb,
    'https://example.invalid/devon-demo', 'Project-based / Part-time',
    '[DEMO SEED] Synthetic collaborator registration.', false, '', 'private_pending',
    'Demo seed row — private by default.', true
  )
  ON CONFLICT (id) DO NOTHING
`;

await sql`
  INSERT INTO admin_workflow_items (id, title, kind, status, linked_slug, due_date, notes, is_demo)
  VALUES (
    'demo_seed_wf_1', '[Demo Seed] Publish n8n Guardrails Walkthrough', 'content', 'in_progress',
    'inbound-lead-qualification-workflow', '2026-12-05', 'Demo seed row — safe to delete.', true
  )
  ON CONFLICT (id) DO NOTHING
`;

console.log("Synthetic demo rows seeded (`is_demo = true`).");
