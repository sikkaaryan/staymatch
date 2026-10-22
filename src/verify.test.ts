import test from "node:test";
import assert from "node:assert/strict";
import type { Candidate, Requirement } from "./types.js";
import { verifyCandidate } from "./verify.js";

const requirements: Requirement[] = [
  { id: "console", description: "Has a PS5", kind: "amenity", mandatory: true, expected: true },
  { id: "jacuzzi", description: "Has a private jacuzzi", kind: "privacy", mandatory: true, expected: true },
];

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "listing-1",
    title: "Example Airbnb",
    listingUrl: "https://www.airbnb.com/rooms/example",
    platform: "airbnb",
    availability: "confirmed",
    evidence: [
      { requirementId: "console", status: "verified", summary: "Example explicit evidence", sourceType: "listing_description", checkedAt: new Date(0).toISOString() },
      { requirementId: "jacuzzi", status: "verified", summary: "Example explicit evidence", sourceType: "host_statement", checkedAt: new Date(0).toISOString() },
    ],
    discoverySource: "test fixture",
    discoveredAt: new Date(0).toISOString(),
    ...overrides,
  };
}

test("accepts a candidate only when all mandatory requirements and availability are verified", () => {
  assert.equal(verifyCandidate(candidate(), requirements).status, "confirmed_match");
});

test("rejects an unverified mandatory requirement", () => {
  const c = candidate({ evidence: [{ requirementId: "console", status: "verified", summary: "Has console", sourceType: "listing_description", checkedAt: new Date(0).toISOString() }] });
  const result = verifyCandidate(c, requirements);
  assert.equal(result.eligible, false);
  assert.equal(result.status, "needs_review");
});

test("rejects contradicted evidence", () => {
  const c = candidate({ evidence: [
    { requirementId: "console", status: "contradicted", summary: "Host says no console", sourceType: "host_statement", checkedAt: new Date(0).toISOString() },
    { requirementId: "jacuzzi", status: "verified", summary: "Private jacuzzi", sourceType: "listing_description", checkedAt: new Date(0).toISOString() },
  ]});
  assert.equal(verifyCandidate(c, requirements).status, "rejected");
});

test("does not treat unknown availability as confirmed", () => {
  assert.equal(verifyCandidate(candidate({ availability: "unknown" }), requirements).eligible, false);
});
