import type { SourceOsDb } from "@/db";
import {
  documents,
  landedCostScenarios,
  purchaseOrders,
  quotations,
  rfqs,
  shipments,
  suppliers,
  users,
} from "@/db/schema";
import { DEMO_ACCOUNT, generateLockedPassword, hashPassword } from "@/lib/crypto";
import { calculateLandedCost } from "@/lib/landed-cost";

type SeedOptions = {
  usersOnly?: boolean;
  skipUsers?: boolean;
};

export async function seedSourceOsDemo(db: SourceOsDb, options: SeedOptions = {}) {
  if (!options.skipUsers) {
    await db
      .insert(users)
      .values([
        {
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
          role: DEMO_ACCOUNT.role,
        },
        {
          email: "compliance@sourceos.studio",
          name: "Marcus Lindholm (Trade Compliance)",
          passwordHash: hashPassword(generateLockedPassword()),
          role: "procurement_lead",
        },
        {
          email: "logistics@sourceos.studio",
          name: "Mei-Ling Chen (Freight Operations)",
          passwordHash: hashPassword(generateLockedPassword()),
          role: "buyer",
        },
      ])
      .onConflictDoNothing({ target: users.email });
  }

  if (options.usersOnly) return;

  const insertedSuppliers = await db
    .insert(suppliers)
    .values([
      {
        name: "RheinWerk Precision GmbH",
        country: "Germany",
        category: "CNC Machining",
        qualificationStatus: "approved",
        leadTimeDays: 18,
        onTimePct: 98.4,
        defectRatePct: 0.25,
        certifications: "ISO 9001, IATF 16949, ISO 14001",
        rating: 4.9,
        contactEmail: "bids@rheinwerk-precision.example",
        notes: "Tier-1 5-axis CNC aerospace & industrial housings supplier with automated CMM inspection.",
      },
      {
        name: "Saigon Volt Industrial Co.",
        country: "Vietnam",
        category: "Power Electronics",
        qualificationStatus: "approved",
        leadTimeDays: 24,
        onTimePct: 95.8,
        defectRatePct: 0.6,
        certifications: "ISO 9001, UL Listed, RoHS",
        rating: 4.6,
        contactEmail: "export@saigonvolt.example",
        notes: "High-volume industrial power supplies, DC-DC converters, and harness assemblies.",
      },
      {
        name: "Formosa Thermal Systems",
        country: "Taiwan",
        category: "Thermal Assemblies",
        qualificationStatus: "approved",
        leadTimeDays: 20,
        onTimePct: 97.1,
        defectRatePct: 0.4,
        certifications: "ISO 9001, ISO 14001, RoHS, REACH",
        rating: 4.8,
        contactEmail: "rfq@formosathermal.example",
        notes: "Extruded aluminum heat sinks, cold plates, and vapor-chamber cooling modules.",
      },
      {
        name: "Monterrey Steel & Fasteners SA",
        country: "Mexico",
        category: "Precision Fasteners",
        qualificationStatus: "approved",
        leadTimeDays: 12,
        onTimePct: 96.2,
        defectRatePct: 0.5,
        certifications: "ISO 9001, USMCA Origin Certified",
        rating: 4.5,
        contactEmail: "sales@monterreyfasteners.example",
        notes: "Nearshore North American stainless steel structural bolts and custom turned pins.",
      },
      {
        name: "Gdansk HydroFluid Sp. z o.o.",
        country: "Poland",
        category: "Hydraulic Components",
        qualificationStatus: "under_review",
        leadTimeDays: 26,
        onTimePct: 91.5,
        defectRatePct: 1.1,
        certifications: "ISO 9001, PED 2014/68/EU",
        rating: 4.2,
        contactEmail: "tenders@gdanskhydro.example",
        notes: "Pending final PPAP pressure-cycle audit report for 350-bar manifold blocks.",
      },
      {
        name: "Busan PackTech Corp.",
        country: "South Korea",
        category: "Industrial Packaging",
        qualificationStatus: "approved",
        leadTimeDays: 15,
        onTimePct: 97.8,
        defectRatePct: 0.3,
        certifications: "ISO 9001, ISTA 3A, FSC",
        rating: 4.7,
        contactEmail: "global@busanpacktech.example",
        notes: "ESD-safe export crating, moisture-barrier foil pouches, and shock-absorbing inserts.",
      },
      {
        name: "Osaka MicroDrive K.K.",
        country: "Japan",
        category: "Power Electronics",
        qualificationStatus: "under_review",
        leadTimeDays: 28,
        onTimePct: 99.1,
        defectRatePct: 0.15,
        certifications: "ISO 9001, ISO 14001, JIS Q 9100",
        rating: 4.9,
        contactEmail: "intl@osakamicrodrive.example",
        notes: "Brushless servo actuators undergoing dual-source qualification for Q3 production.",
      },
      {
        name: "Midwest Cast Alloy Foundry",
        country: "United States",
        category: "CNC Machining",
        qualificationStatus: "probation",
        leadTimeDays: 32,
        onTimePct: 84.0,
        defectRatePct: 2.3,
        certifications: "ISO 9001",
        rating: 3.4,
        contactEmail: "ops@midwestcast.example",
        notes: "On 60-day corrective action plan (CAPA) following surface porosity deviations on Lot 19B.",
      },
    ])
    .returning();

  const [rhein, saigon, formosa, monterrey, gdansk, busan, osaka] = insertedSuppliers;

  const insertedRfqs = await db
    .insert(rfqs)
    .values([
      {
        rfqNumber: "RFQ-2026-104",
        title: "6061-T6 Anodized Inverter Enclosures (IP66)",
        targetQty: 1200,
        targetUnitCents: 4650,
        currency: "USD",
        status: "evaluating",
        dueDate: "2026-12-08",
        notes: "Requires ±0.03mm sealing groove tolerance, hard-coat black anodize, and 100% leak test.",
      },
      {
        rfqNumber: "RFQ-2026-105",
        title: "48V 600W Industrial DIN-Rail Power Modules",
        targetQty: 800,
        targetUnitCents: 6800,
        currency: "USD",
        status: "open",
        dueDate: "2026-12-14",
        notes: "UL 508 / CE compliance mandatory. Include 36-month warranty terms in quotation.",
      },
      {
        rfqNumber: "RFQ-2026-106",
        title: "Liquid-Cooled Aluminum Cold Plates (Gen-4)",
        targetQty: 600,
        targetUnitCents: 5400,
        currency: "USD",
        status: "awarded",
        dueDate: "2026-11-12",
        notes: "Vacuum-brazed internal fin channels, helium leak certified.",
      },
      {
        rfqNumber: "RFQ-2026-107",
        title: "A4-80 Stainless Flange Bolt & Stud Kits (M10)",
        targetQty: 5000,
        targetUnitCents: 420,
        currency: "USD",
        status: "open",
        dueDate: "2026-12-19",
        notes: "USMCA or EUR.1 certificate of origin preferred for duty mitigation.",
      },
    ])
    .returning();

  const [rfq104, rfq105, rfq106, rfq107] = insertedRfqs;

  await db.insert(quotations).values([
    {
      rfqId: rfq104.id,
      supplierId: rhein.id,
      unitPriceCents: 4820,
      moq: 500,
      leadTimeDays: 18,
      incoterms: "FCA",
      freightEstimateCents: 420000,
      selected: false,
      notes: "Includes full CMM dimensional packet and anodize thickness certificate.",
    },
    {
      rfqId: rfq104.id,
      supplierId: formosa.id,
      unitPriceCents: 4490,
      moq: 1000,
      leadTimeDays: 21,
      incoterms: "FOB",
      freightEstimateCents: 385000,
      selected: false,
      notes: "Dedicated extrusion die amortized over first 1,200 pcs.",
    },
    {
      rfqId: rfq104.id,
      supplierId: gdansk.id,
      unitPriceCents: 4610,
      moq: 600,
      leadTimeDays: 25,
      incoterms: "CIF",
      freightEstimateCents: 295000,
      selected: false,
      notes: "Pricing valid for 30 days; tooling ready in 10 working days.",
    },
    {
      rfqId: rfq105.id,
      supplierId: saigon.id,
      unitPriceCents: 6450,
      moq: 500,
      leadTimeDays: 24,
      incoterms: "FOB",
      freightEstimateCents: 340000,
      selected: false,
      notes: "UL file E519204 ready; burn-in 24h at 55°C included.",
    },
    {
      rfqId: rfq105.id,
      supplierId: osaka.id,
      unitPriceCents: 7180,
      moq: 300,
      leadTimeDays: 27,
      incoterms: "CIF",
      freightEstimateCents: 260000,
      selected: false,
      notes: "105°C Japanese electrolytic capacitors; MTBF > 280,000 hrs.",
    },
    {
      rfqId: rfq106.id,
      supplierId: formosa.id,
      unitPriceCents: 5250,
      moq: 500,
      leadTimeDays: 20,
      incoterms: "FOB",
      freightEstimateCents: 310000,
      selected: true,
      notes: "Awarded — best thermal resistance benchmark & helium leak pass rate.",
    },
    {
      rfqId: rfq106.id,
      supplierId: rhein.id,
      unitPriceCents: 5790,
      moq: 400,
      leadTimeDays: 19,
      incoterms: "EXW",
      freightEstimateCents: 440000,
      selected: false,
      notes: "Strong quality profile, higher unit landed cost.",
    },
    {
      rfqId: rfq107.id,
      supplierId: monterrey.id,
      unitPriceCents: 395,
      moq: 2500,
      leadTimeDays: 12,
      incoterms: "DDP",
      freightEstimateCents: 145000,
      selected: false,
      notes: "USMCA origin eligible (0% Section 301 duty exposure).",
    },
    {
      rfqId: rfq107.id,
      supplierId: busan.id,
      unitPriceCents: 410,
      moq: 3000,
      leadTimeDays: 16,
      incoterms: "CIF",
      freightEstimateCents: 195000,
      selected: false,
      notes: "Delivered in corrosion-inhibited VCI export cartons.",
    },
  ]);

  const insertedPos = await db
    .insert(purchaseOrders)
    .values([
      {
        poNumber: "PO-2026-4410",
        supplierId: formosa.id,
        rfqId: rfq106.id,
        itemName: "Liquid-Cooled Aluminum Cold Plates (Gen-4)",
        quantity: 600,
        unitCostCents: 5250,
        totalCents: 600 * 5250,
        incoterms: "FOB",
        status: "shipped",
      },
      {
        poNumber: "PO-2026-4411",
        supplierId: rhein.id,
        rfqId: null,
        itemName: "5-Axis Machined Gearbox Housings (Rev C)",
        quantity: 350,
        unitCostCents: 11800,
        totalCents: 350 * 11800,
        incoterms: "CIF",
        status: "in_production",
      },
      {
        poNumber: "PO-2026-4412",
        supplierId: saigon.id,
        rfqId: null,
        itemName: "24V Industrial Switching Power Bricks",
        quantity: 1400,
        unitCostCents: 3150,
        totalCents: 1400 * 3150,
        incoterms: "FOB",
        status: "shipped",
      },
      {
        poNumber: "PO-2026-4413",
        supplierId: monterrey.id,
        rfqId: null,
        itemName: "M12 Structural Anchoring Fastener Assemblies",
        quantity: 4000,
        unitCostCents: 340,
        totalCents: 4000 * 340,
        incoterms: "DDP",
        status: "delivered",
      },
    ])
    .returning();

  const [po4410, po4411, po4412, po4413] = insertedPos;

  await db.insert(shipments).values([
    {
      trackingCode: "SHP-MAEU-88412",
      poId: po4410.id,
      carrier: "Maersk Ocean Line",
      mode: "sea",
      originPort: "Kaohsiung (TWKHH)",
      destPort: "Los Angeles (USLAX)",
      status: "in_transit",
      etaDate: "2026-12-03",
      freightCents: 318000,
      insuranceCents: 42500,
      dutyCents: 215000,
    },
    {
      trackingCode: "SHP-LHCG-51209",
      poId: po4411.id,
      carrier: "Lufthansa Cargo",
      mode: "air",
      originPort: "Frankfurt (DEFRA)",
      destPort: "Chicago O'Hare (USORD)",
      status: "booked",
      etaDate: "2026-12-11",
      freightCents: 495000,
      insuranceCents: 61000,
      dutyCents: 174000,
    },
    {
      trackingCode: "SHP-ONEU-77341",
      poId: po4412.id,
      carrier: "Ocean Network Express",
      mode: "sea",
      originPort: "Ho Chi Minh (VNSGN)",
      destPort: "Savannah (USSAV)",
      status: "customs",
      etaDate: "2026-11-26",
      freightCents: 356000,
      insuranceCents: 49000,
      dutyCents: 312000,
    },
    {
      trackingCode: "SHP-DHLX-30944",
      poId: po4413.id,
      carrier: "DHL Express Freight",
      mode: "express",
      originPort: "Monterrey (MXMTY)",
      destPort: "Dallas Hub (USDFW)",
      status: "delivered",
      etaDate: "2026-11-18",
      freightCents: 148000,
      insuranceCents: 18500,
      dutyCents: 0,
    },
  ]);

  await db.insert(documents).values([
    {
      title: "Commercial Invoice — Cold Plates Batch #4410",
      docType: "commercial_invoice",
      entityRef: "PO-2026-4410",
      status: "verified",
      notes: "Harmonized code 8419.50.5000 cross-checked against supplier packing slip.",
    },
    {
      title: "Ocean Bill of Lading — Vessel MV Maersk Sentinel",
      docType: "bill_of_lading",
      entityRef: "SHP-MAEU-88412",
      status: "verified",
      notes: "Telex release approved; container MSKU-492018-4 sealed.",
    },
    {
      title: "Packing List — 18 Euro-Pallets (Gross 4,620 kg)",
      docType: "packing_list",
      entityRef: "SHP-ONEU-77341",
      status: "submitted",
      notes: "Submitted to Savannah customs broker for ISF 10+2 clearance.",
    },
    {
      title: "Pre-Shipment QC Inspection Report (AQL 1.0)",
      docType: "qc_report",
      entityRef: "PO-2026-4411",
      status: "pending_review",
      notes: "Awaiting final CMM flatness sign-off from RheinWerk QA team.",
    },
    {
      title: "USMCA Certificate of Origin — Fastener Lot M12",
      docType: "certificate_of_origin",
      entityRef: "PO-2026-4413",
      status: "verified",
      notes: "Preferential 0% tariff eligibility validated and archived.",
    },
    {
      title: "Commercial Invoice — 24V Power Bricks",
      docType: "commercial_invoice",
      entityRef: "PO-2026-4412",
      status: "submitted",
      notes: "Under US CBP entry summary review at Port of Savannah.",
    },
  ]);

  const scenarioDefs = [
    {
      title: "Taiwan Cold Plates — Ocean FCL (20ft) to Los Angeles",
      productPriceCents: 5250,
      quantity: 600,
      freightCents: 318000,
      insuranceCents: 42500,
      customsDutyPct: 6.2,
      otherExpensesCents: 115000,
      currency: "USD",
      exchangeRateToUsd: 1.0,
      notes: "User-entered planning model for Q4 ocean lane; includes drayage & broker entry fee.",
    },
    {
      title: "Germany CNC Gearbox Housings — Air Freight (EUR)",
      productPriceCents: 10900,
      quantity: 350,
      freightCents: 460000,
      insuranceCents: 54000,
      customsDutyPct: 4.5,
      otherExpensesCents: 98000,
      currency: "EUR",
      exchangeRateToUsd: 1.08,
      notes: "Assumes EUR/USD 1.08 planning FX and urgent airlift to Chicago O'Hare.",
    },
    {
      title: "Shenzhen Industrial Enclosure Alternative (CNY)",
      productPriceCents: 29500,
      quantity: 1200,
      freightCents: 3200000,
      insuranceCents: 410000,
      customsDutyPct: 25.0,
      otherExpensesCents: 1450000,
      currency: "CNY",
      exchangeRateToUsd: 0.138,
      notes: "Sensitivity model factoring hypothetical 25% tariff rate vs. Taiwan/EU sourcing.",
    },
  ];

  await db.insert(landedCostScenarios).values(
    scenarioDefs.map((s) => {
      const calc = calculateLandedCost(s);
      return {
        title: s.title,
        productPriceCents: s.productPriceCents,
        quantity: s.quantity,
        freightCents: s.freightCents,
        insuranceCents: s.insuranceCents,
        customsDutyPct: s.customsDutyPct,
        otherExpensesCents: s.otherExpensesCents,
        currency: s.currency,
        exchangeRateToUsd: s.exchangeRateToUsd,
        totalLandedUsdCents: calc.totalLandedUsdCents,
        perUnitLandedUsdCents: calc.perUnitLandedUsdCents,
        notes: s.notes,
      };
    }),
  );
}
