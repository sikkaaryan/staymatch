import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchQueries, discoverAirbnbCandidates, isAirbnbListingUrl, type SearchProvider } from "./discovery.js";
import type { Requirement } from "./types.js";

const requirements: Requirement[] = [
  { id: "console", description: "PS5 or PS4 console", kind: "amenity", mandatory: true, expected: true },
  { id: "jacuzzi", description: "Private jacuzzi", kind: "amenity", mandatory: true, expected: true },
];

test("only recognizes secure Airbnb listing URLs", () => {
  assert.equal(isAirbnbListingUrl("https://www.airbnb.co.in/rooms/123456"), true);
  assert.equal(isAirbnbListingUrl("https://airbnb.com/rooms/123456?source=abc"), true);
  assert.equal(isAirbnbListingUrl("https://example.com/rooms/123456"), false);
  assert.equal(isAirbnbListingUrl("https://airbnb.com.evil.test/rooms/123456"), false);
  assert.equal(isAirbnbListingUrl("http://airbnb.com/rooms/123456"), false);
  assert.equal(isAirbnbListingUrl("https://www.airbnb.co.in/experiences/123456"), false);
});

test("query builder includes dates, location, guest count, budget and requirements", () => {
  const queries = buildSearchQueries({
    location: "Gurugram",
    checkIn: "2026-10-27",
    checkOut: "2026-10-28",
    guests: 2,
    maxTotalPrice: 5000,
    requirements,
  });
  assert.equal(queries.length, 3);
  assert.ok(queries[0].includes("Gurugram"));
  assert.ok(queries[0].includes("2026-10-27"));
  assert.ok(queries[0].includes("2 guests"));
  assert.ok(queries[0].includes("₹5000"));
  assert.ok(queries[0].includes("Private jacuzzi"));
});

test("discovery deduplicates Airbnb listings and leaves every requirement unverified", async () => {
  const provider: SearchProvider = {
    async search(query) {
      if (query.includes("2026-10-27")) {
        return [
          { title: "Listing A", url: "https://www.airbnb.co.in/rooms/123?source=search", description: "PS5 jacuzzi" },
          { title: "Not Airbnb", url: "https://example.com/rooms/999" },
        ];
      }
      return [{ title: "Listing A duplicate", url: "https://www.airbnb.co.in/rooms/123" }];
    },
  };
  const report = await discoverAirbnbCandidates(provider, {
    location: "Gurugram",
    checkIn: "2026-10-27",
    checkOut: "2026-10-28",
    guests: 2,
    maxTotalPrice: 5000,
    requirements,
  }, new Date("2026-10-21T00:00:00.000Z"));

  assert.equal(report.candidates.length, 1);
  assert.equal(report.excluded.length, 1);
  assert.equal(report.candidates[0].availability, "unknown");
  assert.equal(report.candidates[0].evidence.every((item) => item.status === "unknown"), true);
  assert.ok(report.note.includes("not verified"));
});
