export type RequirementKind = "budget_total" | "amenity" | "privacy" | "availability" | "location" | "guest_count" | "other";

export interface Requirement {
  id: string;
  description: string;
  kind: RequirementKind;
  mandatory: true;
  expected: string | number | boolean;
}

export interface Evidence {
  requirementId: string;
  status: "verified" | "contradicted" | "unknown";
  summary: string;
  sourceUrl?: string;
  sourceType: "listing_description" | "listing_photo" | "host_statement" | "authorized_api" | "user_supplied" | "other";
  checkedAt: string;
}

export interface Candidate {
  id: string;
  title: string;
  listingUrl: string;
  platform: "airbnb";
  priceTotal?: number;
  currency?: string;
  availability?: "confirmed" | "unavailable" | "unknown";
  evidence: Evidence[];
  discoverySource: string;
  discoveredAt: string;
}

export interface VerificationResult {
  candidateId: string;
  eligible: boolean;
  status: "confirmed_match" | "rejected" | "needs_review";
  checks: Array<{
    requirementId: string;
    requirement: string;
    status: "pass" | "fail" | "unknown";
    evidenceSummary: string;
    sourceUrl?: string;
  }>;
  rejectionReasons: string[];
}
