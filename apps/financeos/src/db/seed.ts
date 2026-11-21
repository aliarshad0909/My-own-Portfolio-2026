import type { FinanceDb } from "@/db";
import {
  accounts,
  auditLogs,
  bankStatements,
  budgets,
  currencyRates,
  invoiceItems,
  invoices,
  transactions,
  users,
} from "@/db/schema";
import { DEMO_ACCOUNT, generateLockedPassword, hashPassword } from "@/lib/crypto";

export async function seedFinanceDemo(
  db: FinanceDb,
  opts: { skipUsers?: boolean; usersOnly?: boolean } = {},
): Promise<void> {
  if (!opts.skipUsers) {
    await db
      .insert(users)
      .values([
        {
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          role: "demo",
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
        },
        {
          email: "controller@financeos.studio",
          name: "Amina Farooq (Controller)",
          role: "manager",
          passwordHash: hashPassword(generateLockedPassword()),
        },
        {
          email: "auditor@financeos.studio",
          name: "Daniel Brooks (Read-Only Auditor)",
          role: "readonly",
          passwordHash: hashPassword(generateLockedPassword()),
        },
      ])
      .onConflictDoNothing();
  }
  if (opts.usersOnly) return;

  // 1. User-configurable multi-currency reference rates (explicitly marked as demonstration rates)
  await db
    .insert(currencyRates)
    .values([
      { code: "USD", name: "US Dollar", rateToUsd: 1.0, note: "Base reporting currency" },
      { code: "EUR", name: "Euro", rateToUsd: 1.08, note: "Demo reference rate (user-editable)" },
      { code: "GBP", name: "British Pound", rateToUsd: 1.27, note: "Demo reference rate (user-editable)" },
      { code: "AED", name: "UAE Dirham", rateToUsd: 0.2723, note: "Demo reference rate (user-editable)" },
      { code: "PKR", name: "Pakistani Rupee", rateToUsd: 0.0036, note: "Demo reference rate (user-editable)" },
    ])
    .onConflictDoNothing();

  // 2. Fictional Customers (AR) & Vendors (AP) for Meridian Digital Commerce LLC
  const insertedAccounts = await db
    .insert(accounts)
    .values([
      {
        type: "customer",
        name: "Northstar Logistics Group",
        contactName: "Hannah Vance",
        email: "ap@northstar-demo.example",
        currency: "USD",
        paymentTermsDays: 30,
        notes: "Retainer + custom software integration client",
      },
      {
        type: "customer",
        name: "Alder & Pine Home Goods",
        contactName: "Marcus Chen",
        email: "finance@alderpine-demo.example",
        currency: "USD",
        paymentTermsDays: 15,
        notes: "E-commerce platform & wholesale order account",
      },
      {
        type: "customer",
        name: "Vanguard MedTech GmbH",
        contactName: "Lukas Weber",
        email: "billing@vanguard-demo.example",
        currency: "EUR",
        paymentTermsDays: 30,
        notes: "Multi-currency European client billed in EUR",
      },
      {
        type: "vendor",
        name: "CloudScale Infrastructure Inc.",
        contactName: "Billing Desk",
        email: "invoices@cloudscale-demo.example",
        currency: "USD",
        paymentTermsDays: 30,
        notes: "Cloud hosting, managed PostgreSQL, CDN",
      },
      {
        type: "vendor",
        name: "Shenzhen Meridian Hardware Ltd.",
        contactName: "Wei Lin",
        email: "export@szmeridian-demo.example",
        currency: "USD",
        paymentTermsDays: 45,
        notes: "Inventory & packaging supplier (COGS purchases)",
      },
      {
        type: "vendor",
        name: "Thames Creative Studio Ltd.",
        contactName: "Claire Patel",
        email: "accounts@thames-demo.example",
        currency: "GBP",
        paymentTermsDays: 30,
        notes: "External video & motion design contractor (GBP)",
      },
    ])
    .returning();

  const [custNorthstar, custAlder, custVanguard, vendCloud, vendHardware, vendThames] = insertedAccounts;

  // 3. Multi-month ledger transactions (Sales/Income, COGS Purchases, Operating Expenses)
  const insertedTx = await db
    .insert(transactions)
    .values([
      {
        type: "sale",
        category: "SaaS & Software Revenue",
        description: "Northstar Q3 Automation Retainer (INV-2026-101)",
        accountId: custNorthstar.id,
        reference: "INV-2026-101",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 2450000,
        baseAmountCents: 2450000,
        status: "cleared",
        reconciled: 1,
        occurredAt: "2026-08-18",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "purchase",
        category: "Cost of Goods Sold",
        description: "Packaging & hardware stock batch #44",
        accountId: vendHardware.id,
        reference: "PO-8841",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 720000,
        baseAmountCents: 720000,
        status: "cleared",
        reconciled: 1,
        occurredAt: "2026-08-22",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "sale",
        category: "Product Sales",
        description: "Alder & Pine Storefront Launch Milestone",
        accountId: custAlder.id,
        reference: "INV-2026-102",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 1890000,
        baseAmountCents: 1890000,
        status: "cleared",
        reconciled: 1,
        occurredAt: "2026-09-14",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "expense",
        category: "Cloud & Infrastructure",
        description: "Production clusters & Postgres hosting (Sep)",
        accountId: vendCloud.id,
        reference: "CS-9021",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 215000,
        baseAmountCents: 215000,
        status: "cleared",
        reconciled: 1,
        occurredAt: "2026-09-20",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "income",
        category: "Consulting & Advisory",
        description: "Vanguard MedTech EU Integration Phase 1 (EUR 12,000)",
        accountId: custVanguard.id,
        reference: "INV-2026-103",
        currency: "EUR",
        exchangeRate: 1.08,
        amountCents: 1200000,
        baseAmountCents: 1296000,
        status: "cleared",
        reconciled: 1,
        occurredAt: "2026-10-08",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "expense",
        category: "Contractors & Production",
        description: "Thames Creative 3D Launch Assets (GBP 3,200)",
        accountId: vendThames.id,
        reference: "BILL-441",
        currency: "GBP",
        exchangeRate: 1.27,
        amountCents: 320000,
        baseAmountCents: 406400,
        status: "cleared",
        reconciled: 0,
        occurredAt: "2026-10-16",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "expense",
        category: "Payroll & Benefits",
        description: "October Operations & Engineering Payroll",
        reference: "PAY-2026-10",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 1180000,
        baseAmountCents: 1180000,
        status: "cleared",
        reconciled: 1,
        occurredAt: "2026-10-30",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "sale",
        category: "SaaS & Software Revenue",
        description: "Northstar November Platform Subscription",
        accountId: custNorthstar.id,
        reference: "INV-2026-104",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 2680000,
        baseAmountCents: 2680000,
        status: "cleared",
        reconciled: 0,
        occurredAt: "2026-11-06",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "purchase",
        category: "Cost of Goods Sold",
        description: "Q4 Fulfillment Hardware Replenishment",
        accountId: vendHardware.id,
        reference: "PO-8910",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 640000,
        baseAmountCents: 640000,
        status: "cleared",
        reconciled: 0,
        occurredAt: "2026-11-10",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "expense",
        category: "Marketing & Growth",
        description: "B2B Search & Content Distribution Campaigns",
        reference: "MKT-1109",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 345000,
        baseAmountCents: 345000,
        status: "cleared",
        reconciled: 0,
        occurredAt: "2026-11-14",
        createdBy: DEMO_ACCOUNT.name,
      },
      {
        type: "expense",
        category: "Cloud & Infrastructure",
        description: "November Cloud Compute & Observability",
        accountId: vendCloud.id,
        reference: "CS-9188",
        currency: "USD",
        exchangeRate: 1.0,
        amountCents: 238000,
        baseAmountCents: 238000,
        status: "cleared",
        reconciled: 0,
        occurredAt: "2026-11-18",
        createdBy: DEMO_ACCOUNT.name,
      },
    ])
    .returning();

  // 4. AR Invoices & AP Bills
  const insertedInvoices = await db
    .insert(invoices)
    .values([
      {
        invoiceNumber: "INV-2026-104",
        direction: "receivable",
        accountId: custNorthstar.id,
        status: "paid",
        currency: "USD",
        exchangeRate: 1.0,
        subtotalCents: 2680000,
        taxRatePct: 0,
        taxCents: 0,
        totalCents: 2680000,
        baseTotalCents: 2680000,
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        paidAt: "2026-11-06",
        notes: "Settled via ACH wire",
      },
      {
        invoiceNumber: "INV-2026-105",
        direction: "receivable",
        accountId: custAlder.id,
        status: "sent",
        currency: "USD",
        exchangeRate: 1.0,
        subtotalCents: 1400000,
        taxRatePct: 5,
        taxCents: 70000,
        totalCents: 1470000,
        baseTotalCents: 1470000,
        issueDate: "2026-11-12",
        dueDate: "2026-11-27",
        notes: "Q4 Inventory Sync Integration — Open AR",
      },
      {
        invoiceNumber: "INV-2026-106",
        direction: "receivable",
        accountId: custVanguard.id,
        status: "overdue",
        currency: "EUR",
        exchangeRate: 1.08,
        subtotalCents: 850000,
        taxRatePct: 0,
        taxCents: 0,
        totalCents: 850000,
        baseTotalCents: 918000,
        issueDate: "2026-10-15",
        dueDate: "2026-11-14",
        notes: "Overdue EU analytics phase invoice (EUR)",
      },
      {
        invoiceNumber: "BILL-2026-409",
        direction: "payable",
        accountId: vendHardware.id,
        status: "sent",
        currency: "USD",
        exchangeRate: 1.0,
        subtotalCents: 510000,
        taxRatePct: 0,
        taxCents: 0,
        totalCents: 510000,
        baseTotalCents: 510000,
        issueDate: "2026-11-15",
        dueDate: "2026-12-15",
        notes: "Open AP vendor bill for Q4 hardware batch",
      },
      {
        invoiceNumber: "BILL-2026-410",
        direction: "payable",
        accountId: vendCloud.id,
        status: "sent",
        currency: "USD",
        exchangeRate: 1.0,
        subtotalCents: 245000,
        taxRatePct: 0,
        taxCents: 0,
        totalCents: 245000,
        baseTotalCents: 245000,
        issueDate: "2026-11-19",
        dueDate: "2026-12-05",
        notes: "Upcoming cloud infrastructure invoice",
      },
    ])
    .returning();

  await db.insert(invoiceItems).values([
    {
      invoiceId: insertedInvoices[0].id,
      description: "Platform Retainer & Automation Operations",
      quantity: 1,
      unitPriceCents: 2680000,
      lineTotalCents: 2680000,
    },
    {
      invoiceId: insertedInvoices[1].id,
      description: "Multi-Warehouse ERP Connector Implementation",
      quantity: 2,
      unitPriceCents: 700000,
      lineTotalCents: 1400000,
    },
    {
      invoiceId: insertedInvoices[2].id,
      description: "BI Dashboarding & Reporting Setup (EUR)",
      quantity: 1,
      unitPriceCents: 850000,
      lineTotalCents: 850000,
    },
    {
      invoiceId: insertedInvoices[3].id,
      description: "Warehouse Barcode Hardware Batch #46",
      quantity: 30,
      unitPriceCents: 17000,
      lineTotalCents: 510000,
    },
    {
      invoiceId: insertedInvoices[4].id,
      description: "Managed PostgreSQL + Node Production Nodes",
      quantity: 1,
      unitPriceCents: 245000,
      lineTotalCents: 245000,
    },
  ]);

  // 5. Category Budgets
  await db.insert(budgets).values([
    { category: "Cloud & Infrastructure", monthlyLimitCents: 500000, period: "2026-Q4", ownerName: "DevOps Lead" },
    { category: "Marketing & Growth", monthlyLimitCents: 400000, period: "2026-Q4", ownerName: "Growth Lead" },
    { category: "Contractors & Production", monthlyLimitCents: 350000, period: "2026-Q4", ownerName: "Studio Ops" },
    { category: "Payroll & Benefits", monthlyLimitCents: 1300000, period: "2026-Q4", ownerName: "People Ops" },
    { category: "Cost of Goods Sold", monthlyLimitCents: 1500000, period: "2026-Q4", ownerName: "Procurement" },
  ]);

  // 6. Bank Statement Lines (some reconciled, 3 ready for interactive matching!)
  await db.insert(bankStatements).values([
    {
      statementDate: "2026-08-18",
      description: "ACH CREDIT NORTHSTAR LOGISTICS",
      reference: "INV-2026-101",
      currency: "USD",
      amountCents: 2450000,
      status: "reconciled",
      matchedTransactionId: insertedTx[0].id,
    },
    {
      statementDate: "2026-11-06",
      description: "WIRE IN NORTHSTAR NOV PLATFORM",
      reference: "INV-2026-104",
      currency: "USD",
      amountCents: 2680000,
      status: "unmatched",
    },
    {
      statementDate: "2026-11-14",
      description: "CARD DEBIT B2B AD NETWORK",
      reference: "MKT-1109",
      currency: "USD",
      amountCents: -345000,
      status: "unmatched",
    },
    {
      statementDate: "2026-11-18",
      description: "ACH DEBIT CLOUDSCALE INFRA",
      reference: "CS-9188",
      currency: "USD",
      amountCents: -238000,
      status: "unmatched",
    },
  ]);

  // 7. Initial Audit Logs
  await db.insert(auditLogs).values([
    {
      action: "SEED_WORKSPACE",
      entityType: "workspace",
      summary: "Initialized Meridian Digital Commerce LLC demonstration ledger, AR/AP invoices, budgets, and bank feed.",
      actor: "System",
    },
    {
      action: "INVOICE_PAID",
      entityType: "invoice",
      entityId: insertedInvoices[0].id,
      summary: "Marked INV-2026-104 ($26,800.00) paid and posted matching sales revenue transaction.",
      actor: DEMO_ACCOUNT.name,
    },
  ]);
}
