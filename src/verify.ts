import type { Candidate, Requirement, VerificationResult } from "./types.js";

/**
 * Strict gate: every mandatory requirement must have explicit verified evidence.
 * This module does not fetch data and does not infer facts from missing evidence.
 */
export function verifyCandidate(
  candidate: Candidate,
  requirements: Requirement[],
): VerificationResult {
  const checks: VerificationResult["checks"] = [];
  const rejectionReasons: string[] = [];

  if (candidate.platform !== "airbnb") {
    rejectionReasons.push("Non-Airbnb candidate rejected.");
  }

  for (const requirement of requirements) {
    const evidence = candidate.evidence.filter(
      (item) => item.requirementId === requirement.id,
    );

    // Evidence is considered verified only when there is an explicit verified record.
    const verified = evidence.find((item) => item.status === "verified");
    const contradicted = evidence.find((item) => item.status === "contradicted");

    if (contradicted) {
      checks.push({
        requirementId: requirement.id,
        requirement: requirement.description,
        status: "fail",
        evidenceSummary: contradicted.summary,
        sourceUrl: contradicted.sourceUrl,
      });
      rejectionReasons.push(
        `${requirement.description}: contradicted by evidence (${contradicted.summary}).`,
      );
    } else if (verified) {
      checks.push({
        requirementId: requirement.id,
        requirement: requirement.description,
        status: "pass",
        evidenceSummary: verified.summary,
        sourceUrl: verified.sourceUrl,
      });
    } else {
      const unknown = evidence.find((item) => item.status === "unknown");
      checks.push({
        requirementId: requirement.id,
        requirement: requirement.description,
        status: "unknown",
        evidenceSummary: unknown?.summary ?? "No supporting evidence recorded.",
        sourceUrl: unknown?.sourceUrl,
      });
      rejectionReasons.push(
        `${requirement.description}: not verified; excluded from confirmed matches.`,
      );
    }
  }

  if (candidate.availability === "unavailable") {
    rejectionReasons.push("Listing is marked unavailable for the requested dates.");
  } else if (candidate.availability !== "confirmed") {
    rejectionReasons.push("Availability is not confirmed for the requested dates.");
  }

  const eligible = rejectionReasons.length === 0;
  const hasUnknown = checks.some((check) => check.status === "unknown");

  return {
    candidateId: candidate.id,
    eligible,
    status: eligible ? "confirmed_match" : hasUnknown ? "needs_review" : "rejected",
    checks,
    rejectionReasons,
  };
}
