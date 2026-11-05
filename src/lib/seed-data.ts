import { Cause } from "./types";

export const SEED_CAUSES: Cause[] = [
  // 1. Utilities — Overdue Heat (Brandon Powers flagship inspiration)
  {
    id: "cause-dte-heat-01",
    title: "DTE Energy · Overdue Gas & Heating Bill",
    description: "Shutoff notice received for natural gas service. Single mother with two toddlers after unexpected car repair reduced working hours.",
    category: "utilities",
    needType: "bill",
    goalAmount: 142.50,
    raisedAmount: 95.00,
    receiverEmail: "sarah.detroit.aid@gmail.com",
    receiverName: "Sarah M.",
    receiverLocation: "Detroit, MI",
    receiverId: "rec_sarah_01",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    ],
    redactedProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    trustScore: {
      overall: 96,
      tier: "high",
      factors: [
        { name: "Vendor Legitimacy", score: 98, status: "verified", details: "DTE Energy statement verified via utility layout analysis" },
        { name: "Amount Consistency", score: 95, status: "verified", details: "Exact match: $142.50 overdue balance" },
        { name: "Statement Date", score: 94, status: "verified", details: "Issued 12 days ago with imminent disconnect notice" },
        { name: "Privacy Redacted", score: 98, status: "verified", details: "Account # and home address masked" },
      ],
      verifiedAt: "2026-11-01T14:32:00Z",
    },
    createdAt: "2026-11-01T14:35:00Z",
    updatedAt: "2026-11-04T18:20:00Z",
  },

  // 2. Medical — Urgent Insulin Copay
  {
    id: "cause-insulin-copay-02",
    title: "Walgreens Pharmacy · 30-Day Insulin Copay",
    description: "Monthly Humalog insulin prescription ready for pickup. Unemployed retail worker awaiting disability decision.",
    category: "medical",
    needType: "bill",
    goalAmount: 65.00,
    raisedAmount: 40.00,
    receiverEmail: "marcus.atlanta.health@gmail.com",
    receiverName: "Marcus T.",
    receiverLocation: "Atlanta, GA",
    receiverId: "rec_marcus_02",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    ],
    redactedProofUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    trustScore: {
      overall: 94,
      tier: "high",
      factors: [
        { name: "Pharmacy Verification", score: 96, status: "verified", details: "Valid Walgreens Rx label with NDC identifier" },
        { name: "Amount Consistency", score: 92, status: "verified", details: "Copay receipt matches $65.00 ask" },
        { name: "Privacy Redacted", score: 95, status: "verified", details: "Patient ID and insurance member number redacted" },
      ],
      verifiedAt: "2026-11-02T09:15:00Z",
    },
    createdAt: "2026-11-02T09:20:00Z",
    updatedAt: "2026-11-04T12:00:00Z",
  },

  // 3. Channel3 Physical Aid — Space Heater
  {
    id: "cause-channel3-heater-03",
    title: "Honeywell Ceramic Digital Space Heater",
    description: "Apartment radiator broken during sudden cold snap. Landlord repair delayed until next Tuesday; need auxiliary safe heater.",
    category: "utilities",
    needType: "aid_supply",
    goalAmount: 49.99,
    raisedAmount: 25.00,
    receiverEmail: "elena.cleveland.aid@gmail.com",
    receiverName: "Elena R.",
    receiverLocation: "Cleveland, OH",
    receiverId: "rec_elena_03",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    ],
    channel3Product: {
      id: "ch3_prod_honeywell_hce322v",
      title: "Honeywell Digital Ceramic Compact Tower Heater (EnergySmart)",
      price: 49.99,
      currency: "USD",
      merchant: "Target",
      imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
      productUrl: "https://www.target.com/p/honeywell-digital-tower-heater",
      inStock: true,
    },
    trustScore: {
      overall: 92,
      tier: "high",
      factors: [
        { name: "Channel3 Merchant Verified", score: 95, status: "verified", details: "Target retail SKU live and in-stock" },
        { name: "Price Accuracy", score: 98, status: "verified", details: "Matches MSRP $49.99 with no markup" },
      ],
      verifiedAt: "2026-11-03T11:00:00Z",
    },
    createdAt: "2026-11-03T11:05:00Z",
    updatedAt: "2026-11-04T20:10:00Z",
  },

  // 4. Channel3 Physical Aid — Infant Formula 6-Pack
  {
    id: "cause-channel3-formula-04",
    title: "Similac Advance Infant Formula (6-Pack)",
    description: "Mother of twin infants in need of formula supply while transitioning between WIC re-certification appointments.",
    category: "food",
    needType: "aid_supply",
    goalAmount: 89.94,
    raisedAmount: 50.00,
    receiverEmail: "jasmine.chicago.twins@gmail.com",
    receiverName: "Jasmine K.",
    receiverLocation: "Chicago, IL",
    receiverId: "rec_jasmine_04",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1594824813580-77a83526db38?auto=format&fit=crop&w=800&q=80",
    ],
    channel3Product: {
      id: "ch3_prod_similac_adv_6pk",
      title: "Similac Advance Infant Formula with Iron Powder (30.8 oz 6-Pack)",
      price: 89.94,
      currency: "USD",
      merchant: "Walmart",
      imageUrl: "https://images.unsplash.com/photo-1594824813580-77a83526db38?auto=format&fit=crop&w=800&q=80",
      productUrl: "https://www.walmart.com/ip/similac-advance-6pk",
      inStock: true,
    },
    trustScore: {
      overall: 95,
      tier: "high",
      factors: [
        { name: "Channel3 Retail Catalog", score: 97, status: "verified", details: "Walmart Direct item verified" },
        { name: "Direct Delivery", score: 94, status: "verified", details: "Eligible for 2-day home shipping" },
      ],
      verifiedAt: "2026-11-02T16:00:00Z",
    },
    createdAt: "2026-11-02T16:15:00Z",
    updatedAt: "2026-11-04T15:45:00Z",
  },

  // 5. Utilities — Water Service Disconnection Prevention
  {
    id: "cause-water-bill-05",
    title: "City of Philadelphia · Overdue Water Bill",
    description: "Final notice to avoid water shutoff. Elderly resident on fixed social security pension following hot water tank leak.",
    category: "utilities",
    needType: "bill",
    goalAmount: 82.20,
    raisedAmount: 60.00,
    receiverEmail: "arthur.philly.aid@gmail.com",
    receiverName: "Arthur P.",
    receiverLocation: "Philadelphia, PA",
    receiverId: "rec_arthur_05",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
    ],
    redactedProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    trustScore: {
      overall: 91,
      tier: "high",
      factors: [
        { name: "Municipal Bill Validation", score: 93, status: "verified", details: "Philadelphia Water Dept billing seal identified" },
        { name: "Amount Match", score: 92, status: "verified", details: "Past-due balance exactly $82.20" },
      ],
      verifiedAt: "2026-11-03T13:40:00Z",
    },
    createdAt: "2026-11-03T13:45:00Z",
    updatedAt: "2026-11-05T08:30:00Z",
  },

  // 6. Education — High School Chemistry Textbook & Calculator
  {
    id: "cause-school-supplies-06",
    title: "AP Chemistry Lab Manual & TI-84 Calculator",
    description: "First-generation high school senior needing required AP coursework materials. Family currently living in transitional shelter.",
    category: "education",
    needType: "bill",
    goalAmount: 115.00,
    raisedAmount: 80.00,
    receiverEmail: "david.houston.student@gmail.com",
    receiverName: "David L.",
    receiverLocation: "Houston, TX",
    receiverId: "rec_david_06",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    ],
    trustScore: {
      overall: 90,
      tier: "high",
      factors: [
        { name: "Syllabus Verification", score: 92, status: "verified", details: "Official school syllabus fee sheet cross-referenced" },
      ],
      verifiedAt: "2026-11-01T10:00:00Z",
    },
    createdAt: "2026-11-01T10:10:00Z",
    updatedAt: "2026-11-04T19:00:00Z",
  },

  // 7. Community — Community Garden Winterization (Bryntum Timeline Demo)
  {
    id: "cause-community-garden-07",
    title: "Highland Park Community Greenhouse Winterization",
    description: "Equipping 12 raised garden beds with cold frames and organic soil blankets to supply fresh greens to 40 neighborhood seniors throughout winter.",
    category: "community",
    needType: "community",
    goalAmount: 350.00,
    raisedAmount: 210.00,
    receiverEmail: "greenthumb.detroit@gmail.com",
    receiverName: "Highland Greens Co-Op",
    receiverLocation: "Highland Park, MI",
    receiverId: "rec_greens_07",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80",
    ],
    milestones: [
      { id: "m1", title: "Lumber & Polycarbonate Panels", targetDate: "2026-11-10", completed: true, requiredAmount: 150.00 },
      { id: "m2", title: "Organic Thermal Soil Blankets", targetDate: "2026-11-18", completed: false, requiredAmount: 100.00 },
      { id: "m3", title: "Cold-Hardy Seedling Distribution", targetDate: "2026-11-25", completed: false, requiredAmount: 100.00 },
    ],
    trustScore: {
      overall: 93,
      tier: "high",
      factors: [
        { name: "501(c)(3) Verification", score: 95, status: "verified", details: "Grassroots nonprofit partner in good standing" },
        { name: "Bryntum Milestone Schedule", score: 92, status: "verified", details: "Phased expenditure roadmap submitted" },
      ],
      verifiedAt: "2026-10-28T12:00:00Z",
    },
    createdAt: "2026-10-28T12:15:00Z",
    updatedAt: "2026-11-05T09:00:00Z",
  },

  // 8. Climate — Emergency Rain Barrel & Sump Pump Co-Op
  {
    id: "cause-climate-rain-08",
    title: "Urban Flood Relief Sump Kit & Rain Barrels",
    description: "Basement flood prevention equipment for low-income historic block prone to heavy stormwater overflows.",
    category: "climate",
    needType: "community",
    goalAmount: 220.00,
    raisedAmount: 160.00,
    receiverEmail: "block.council.neworleans@gmail.com",
    receiverName: "Lower 9th Ward Council",
    receiverLocation: "New Orleans, LA",
    receiverId: "rec_council_08",
    status: "active",
    evidenceUrls: [
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    ],
    trustScore: {
      overall: 89,
      tier: "high",
      factors: [
        { name: "Community Association", score: 90, status: "verified", details: "Verified municipal flood map location" },
      ],
      verifiedAt: "2026-10-30T15:00:00Z",
    },
    createdAt: "2026-10-30T15:20:00Z",
    updatedAt: "2026-11-04T17:30:00Z",
  },
];
