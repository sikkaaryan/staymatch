
import {
  discoverAirbnbCandidates,
  BraveSearchProvider,
} from "../src/discovery.js";
import type { Requirement } from "../src/types.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Use POST to search.",
    });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error:
        "Search provider is not configured. Add BRAVE_SEARCH_API_KEY in Vercel Environment Variables.",
    });
  }

  const body =
    req.body && typeof req.body === "object" ? req.body : {};

  const {
    location,
    checkIn,
    checkOut,
    guests,
    maxTotalPrice,
  } = body;

  if (
    typeof location !== "string" ||
    !location.trim() ||
    location.length > 120
  ) {
    return res.status(400).json({
      error: "Enter a valid location.",
    });
  }

  if (
    typeof checkIn !== "string" ||
    typeof checkOut !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) ||
    checkOut <= checkIn
  ) {
    return res.status(400).json({
      error: "Enter valid check-in and check-out dates.",
    });
  }

  if (
    !Number.isInteger(Number(guests)) ||
    Number(guests) < 1 ||
    Number(guests) > 16 ||
    !Number.isFinite(Number(maxTotalPrice)) ||
    Number(maxTotalPrice) <= 0
  ) {
    return res.status(400).json({
      error: "Enter a valid guest count and maximum budget.",
    });
  }

  const allowedRequirements = new Set([
    "Gaming console (PS5 or PS4)",
    "Private jacuzzi",
    "Private pool",
    "Entire place",
    "Kitchen",
    "Free parking",
  ]);

  const selected = Array.isArray(body.requirements)
    ? body.requirements.filter(
        (item: unknown): item is string =>
          typeof item === "string" &&
          allowedRequirements.has(item),
      ).slice(0, 6)
    : [];

  const requirements: Requirement[] = selected.map(
    (description: string, index: number) => ({
      id: `requirement-${index + 1}`,
      description,
      kind:
        description === "Entire place" ? "privacy" : "amenity",
      mandatory: true,
      expected: true,
    }),
  );

  try {
    const provider = new BraveSearchProvider(apiKey);

    const report = await discoverAirbnbCandidates(provider, {
      location: location.trim(),
      checkIn,
      checkOut,
      guests: Number(guests),
      maxTotalPrice: Number(maxTotalPrice),
      requirements,
    });

    return res.status(200).json({
      candidates: report.candidates,
      queries: report.queries,
      excludedCount: report.excluded.length,
      note: report.note,
    });
  } catch {
    return res.status(502).json({
      error:
        "Search failed. Check your search-provider API key, credits, and try again.",
    });
  }
}
