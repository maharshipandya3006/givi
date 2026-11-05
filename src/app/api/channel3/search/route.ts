import { NextRequest, NextResponse } from "next/server";
import { Channel3Product } from "@/lib/types";

const CHANNEL3_API_KEY = process.env.CHANNEL3_API_KEY || "";
const CHANNEL3_API_BASE = process.env.CHANNEL3_API_BASE || "https://api.channel3.com/v1";

const CATALOG_FALLBACK: Channel3Product[] = [
  {
    id: "ch3_heater_01",
    title: "Honeywell Digital Ceramic Compact Tower Heater (EnergySmart)",
    price: 49.99,
    currency: "USD",
    merchant: "Target",
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    productUrl: "https://www.target.com/p/honeywell-digital-tower-heater",
    inStock: true,
  },
  {
    id: "ch3_heater_02",
    title: "De'Longhi Mica Panel Radiator Auxiliary Space Heater",
    price: 79.95,
    currency: "USD",
    merchant: "Amazon",
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    productUrl: "https://www.amazon.com/dp/B000TGDGLU",
    inStock: true,
  },
  {
    id: "ch3_formula_01",
    title: "Similac Advance Infant Formula with Iron (30.8 oz 6-Pack)",
    price: 89.94,
    currency: "USD",
    merchant: "Walmart",
    imageUrl: "https://images.unsplash.com/photo-1594824813580-77a83526db38?auto=format&fit=crop&w=800&q=80",
    productUrl: "https://www.walmart.com/ip/similac-advance-6pk",
    inStock: true,
  },
  {
    id: "ch3_formula_02",
    title: "Enfamil NeuroPro Infant Formula Powder Refill Box (31.4 oz)",
    price: 45.98,
    currency: "USD",
    merchant: "Kroger",
    imageUrl: "https://images.unsplash.com/photo-1594824813580-77a83526db38?auto=format&fit=crop&w=800&q=80",
    productUrl: "https://www.kroger.com/p/enfamil-neuropro",
    inStock: true,
  },
  {
    id: "ch3_boots_01",
    title: "Columbia Men's Bugaboot III Waterproof Winter Boots",
    price: 64.99,
    currency: "USD",
    merchant: "Dick's Sporting Goods",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    productUrl: "https://www.columbia.com/p/mens-bugaboot-iii",
    inStock: true,
  },
  {
    id: "ch3_medical_01",
    title: "OneTouch Verio Reflect Blood Glucose Monitoring Kit & 100 Strips",
    price: 34.50,
    currency: "USD",
    merchant: "Walgreens",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    productUrl: "https://www.walgreens.com/store/c/onetouch-verio",
    inStock: true,
  },
  {
    id: "ch3_school_01",
    title: "Texas Instruments TI-84 Plus Graphing Calculator & STEM Case",
    price: 99.00,
    currency: "USD",
    merchant: "Best Buy",
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    productUrl: "https://www.bestbuy.com/site/texas-instruments-ti-84",
    inStock: true,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  if (CHANNEL3_API_KEY) {
    try {
      const response = await fetch(
        `${CHANNEL3_API_BASE}/products/search?q=${encodeURIComponent(q)}`,
        {
          headers: {
            Authorization: `Bearer ${CHANNEL3_API_KEY}`,
            "X-Promo-Code": "PAYPAL-HACKATHON-2026",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data.products || data);
      }
    } catch (err) {
      console.warn("Channel3 live API error, using catalog fallback:", err);
    }
  }

  // Filter local catalog fallback
  const results = q
    ? CATALOG_FALLBACK.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.merchant.toLowerCase().includes(q)
      )
    : CATALOG_FALLBACK;

  return NextResponse.json(results);
}
