import { BraveSearchProvider, discoverAirbnbCandidates } from "./discovery.js";
import type { Requirement } from "./types.js";

const requirements: Requirement[] = [
  { id: "console", description: "PS5 or PS4 console", kind: "amenity", mandatory: true, expected: true },
  { id: "jacuzzi", description: "Private jacuzzi", kind: "amenity", mandatory: true, expected: true },
  { id: "budget", description: "Total stay price below ₹5000", kind: "budget_total", mandatory: true, expected: 5000 },
];

const apiKey = process.env.BRAVE_SEARCH_API_KEY;
if (!apiKey) {
  console.error("Missing BRAVE_SEARCH_API_KEY. Set it in your local environment; no searches were run.");
  console.error("The search API offers monthly free credits but requires an account and may require a payment card for verification.");
  process.exitCode = 1;
} else {
  const provider = new BraveSearchProvider(apiKey);
  const report = await discoverAirbnbCandidates(provider, {
    location: process.env.STAYMATCH_LOCATION ?? "Gurugram, Delhi NCR",
    checkIn: process.env.STAYMATCH_CHECKIN ?? "2026-10-27",
    checkOut: process.env.STAYMATCH_CHECKOUT ?? "2026-10-28",
    guests: Number(process.env.STAYMATCH_GUESTS ?? "2"),
    maxTotalPrice: Number(process.env.STAYMATCH_MAX_TOTAL ?? "5000"),
    requirements,
  });
  console.log(JSON.stringify(report, null, 2));
  console.log("\nIMPORTANT: these are discovered candidates only, not verified matches.");
}
